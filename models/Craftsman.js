const mongoose = require('mongoose');

const craftsmanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profession: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    experienceYears: {
        type: Number,
        required: true
    },
    hourlyRate: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDocuments: [{
        type: {
            type: String,
            enum: ['identity', 'certificate', 'license', 'other']
        },
        url: String,
        verified: {
            type: Boolean,
            default: false
        },
        verifiedAt: Date
    }],
    portfolio: [{
        title: String,
        description: String,
        images: [String],
        completedAt: Date,
        clientFeedback: String
    }],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        documentUrl: String,
        verified: {
            type: Boolean,
            default: false
        }
    }],
    availability: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available'
    },
    workingHours: {
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
        saturday: { start: String, end: String },
        sunday: { start: String, end: String }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: String
    },
    serviceArea: {
        type: Number, // km cinsinden
        default: 10
    },
    languages: [{
        type: String
    }],
    skills: [{
        type: String
    }],
    completedJobs: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featuredUntil: {
        type: Date
    },
    badges: [{
        type: {
            type: String,
            enum: ['top_rated', 'fast_response', 'verified', 'premium']
        },
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    responseTime: {
        type: Number, // dakika cinsinden ortalama yanıt süresi
        default: 0
    },
    completionRate: {
        type: Number, // yüzde cinsinden
        default: 100
    }
}, {
    timestamps: true
});

// Konum bazlı sorgular için index
craftsmanSchema.index({ location: '2dsphere' });

// Puan hesaplama
craftsmanSchema.methods.calculateRating = async function() {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
        { $match: { craftsman: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        this.rating = Math.round(stats[0].averageRating * 10) / 10;
        this.totalReviews = stats[0].totalReviews;
        await this.save();
    }
};

// Tamamlanan iş sayısını güncelle
craftsmanSchema.methods.updateCompletedJobs = async function() {
    const Job = mongoose.model('Job');
    const count = await Job.countDocuments({
        craftsman: this._id,
        status: 'completed'
    });
    
    this.completedJobs = count;
    await this.save();
};

// Yanıt süresini güncelle
craftsmanSchema.methods.updateResponseTime = async function() {
    const Message = mongoose.model('Message');
    const stats = await Message.aggregate([
        {
            $match: {
                recipient: this.user,
                isRead: true
            }
        },
        {
            $group: {
                _id: null,
                averageResponseTime: {
                    $avg: {
                        $subtract: ['$readAt', '$createdAt']
                    }
                }
            }
        }
    ]);

    if (stats.length > 0) {
        this.responseTime = Math.round(stats[0].averageResponseTime / (1000 * 60)); // dakikaya çevir
        await this.save();
    }
};

// Tamamlanma oranını güncelle
craftsmanSchema.methods.updateCompletionRate = async function() {
    const Job = mongoose.model('Job');
    const stats = await Job.aggregate([
        {
            $match: {
                craftsman: this._id,
                status: { $in: ['completed', 'cancelled'] }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    let completed = 0;
    let total = 0;

    stats.forEach(stat => {
        if (stat._id === 'completed') completed = stat.count;
        total += stat.count;
    });

    if (total > 0) {
        this.completionRate = Math.round((completed / total) * 100);
        await this.save();
    }
};

// Rozetleri güncelle
craftsmanSchema.methods.updateBadges = async function() {
    const badges = [];

    // Top Rated rozeti
    if (this.rating >= 4.5 && this.totalReviews >= 10) {
        badges.push({ type: 'top_rated', earnedAt: new Date() });
    }

    // Fast Response rozeti
    if (this.responseTime <= 30) { // 30 dakika veya daha hızlı
        badges.push({ type: 'fast_response', earnedAt: new Date() });
    }

    // Verified rozeti
    if (this.isVerified) {
        badges.push({ type: 'verified', earnedAt: new Date() });
    }

    // Premium rozeti
    if (this.featuredUntil && this.featuredUntil > new Date()) {
        badges.push({ type: 'premium', earnedAt: new Date() });
    }

    this.badges = badges;
    await this.save();
};

module.exports = mongoose.model('Craftsman', craftsmanSchema); 