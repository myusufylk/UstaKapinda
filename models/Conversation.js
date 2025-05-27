const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ job: 1 });

// Method to get unread count for a user
conversationSchema.methods.getUnreadCount = function(userId) {
    return this.unreadCount.get(userId.toString()) || 0;
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function(userId) {
    const currentCount = this.getUnreadCount(userId);
    this.unreadCount.set(userId.toString(), currentCount + 1);
    return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnreadCount = function(userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation; 