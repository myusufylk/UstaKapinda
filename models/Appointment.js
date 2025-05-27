const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String
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
    }
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Konum bazlı sorgular için index
appointmentSchema.index({ location: '2dsphere' });

// Randevu durumu değiştiğinde bildirim gönder
appointmentSchema.post('save', async function(doc) {
  const Notification = mongoose.model('Notification');
  const User = mongoose.model('User');
  
  let notificationData = {
    recipient: doc.client,
    type: 'appointment_update',
    title: 'Randevu Durumu Güncellendi',
    message: `Randevunuzun durumu "${doc.status}" olarak güncellendi.`,
    data: {
      appointmentId: doc._id,
      jobId: doc.job,
      status: doc.status
    }
  };

  await Notification.create(notificationData);
});

module.exports = mongoose.model('Appointment', appointmentSchema); 