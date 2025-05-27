const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    craftsman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Craftsman',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'TRY'
    },
    paymentIntentId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    refundRequested: {
        type: Boolean,
        default: false
    },
    refundStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: null
    },
    refundReason: String,
    refundAmount: Number,
    refundDate: Date,
    invoiceNumber: {
        type: String,
        unique: true
    },
    invoiceUrl: String,
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'bank_transfer'],
        required: true
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Generate invoice number before saving
paymentSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
    }
    next();
});

// Index for faster queries
paymentSchema.index({ job: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ craftsman: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment; 