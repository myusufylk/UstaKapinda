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
    skills: [{
        type: String
    }],
    experience: {
        type: Number,
        required: true
    },
    hourlyRate: {
        type: Number,
        required: true
    },
    availability: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available'
    },
    workingHours: {
        start: String,
        end: String
    },
    serviceArea: {
        type: [String],
        required: true
    },
    portfolio: [{
        title: String,
        description: String,
        imageUrl: String,
        date: Date
    }],
    certifications: [{
        name: String,
        issuer: String,
        date: Date,
        imageUrl: String
    }],
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    completedJobs: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDocuments: [{
        type: String,
        name: String,
        date: Date
    }]
}, {
    timestamps: true
});

// Calculate average rating
craftsmanSchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) return 0;
    
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = sum / this.reviews.length;
    this.rating.count = this.reviews.length;
    return this.rating.average;
};

const Craftsman = mongoose.model('Craftsman', craftsmanSchema);
module.exports = Craftsman; 