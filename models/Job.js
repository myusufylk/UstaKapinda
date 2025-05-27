const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    craftsman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Craftsman'
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'open'
    },
    budget: {
        type: Number,
        required: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    schedule: {
        preferredDate: Date,
        preferredTime: String,
        duration: Number // in hours
    },
    images: [{
        url: String,
        description: String
    }],
    requirements: [{
        type: String
    }],
    proposals: [{
        craftsman: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Craftsman'
        },
        price: Number,
        description: String,
        estimatedDuration: Number,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    completionDetails: {
        actualDuration: Number,
        finalPrice: Number,
        completionDate: Date,
        clientFeedback: {
            rating: Number,
            comment: String
        }
    }
}, {
    timestamps: true
});

// Add index for better search performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ 'location.city': 1, 'location.state': 1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job; 