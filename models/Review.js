const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    craftsman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Craftsman',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    images: [{
        type: String
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
reviewSchema.index({ job: 1 });
reviewSchema.index({ craftsman: 1 });
reviewSchema.index({ client: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Prevent duplicate reviews for the same job
reviewSchema.index({ job: 1, client: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 