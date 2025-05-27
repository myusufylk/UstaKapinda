const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    preferences: {
      newMessages: { type: Boolean, default: true },
      jobOffers: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      reviewRequests: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true }
    }
  },
  sms: {
    enabled: {
      type: Boolean,
      default: true
    },
    preferences: {
      newMessages: { type: Boolean, default: true },
      jobOffers: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      reviewRequests: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true }
    }
  },
  push: {
    enabled: {
      type: Boolean,
      default: true
    },
    preferences: {
      newMessages: { type: Boolean, default: true },
      jobOffers: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      reviewRequests: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true }
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00'
    },
    endTime: {
      type: String,
      default: '08:00'
    }
  },
  language: {
    type: String,
    enum: ['tr', 'en'],
    default: 'tr'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncelleme tarihini otomatik güncelle
notificationPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Bildirim tercihlerini kontrol et
notificationPreferenceSchema.methods.shouldNotify = function(channel, type) {
  if (!this[channel].enabled) return false;
  if (this.quietHours.enabled) {
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;
    if (this.isInQuietHours(currentTime)) return false;
  }
  return this[channel].preferences[type];
};

// Sessiz saatlerde mi kontrol et
notificationPreferenceSchema.methods.isInQuietHours = function(currentTime) {
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const [startHour, startMinute] = this.quietHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.quietHours.endTime.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

// Varsayılan tercihleri oluştur
notificationPreferenceSchema.statics.createDefault = function(userId) {
  return this.create({
    user: userId,
    email: {
      enabled: true,
      preferences: {
        newMessages: true,
        jobOffers: true,
        paymentUpdates: true,
        appointmentReminders: true,
        reviewRequests: true,
        systemUpdates: true
      }
    },
    sms: {
      enabled: true,
      preferences: {
        newMessages: true,
        jobOffers: true,
        paymentUpdates: true,
        appointmentReminders: true,
        reviewRequests: true,
        systemUpdates: true
      }
    },
    push: {
      enabled: true,
      preferences: {
        newMessages: true,
        jobOffers: true,
        paymentUpdates: true,
        appointmentReminders: true,
        reviewRequests: true,
        systemUpdates: true
      }
    }
  });
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema); 