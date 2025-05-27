const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const { validateAppointment } = require('../middleware/validator');
const { sendAppointmentNotification } = require('../utils/email');

// Tüm randevuları getir (filtreleme ve sayfalama ile)
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    
    // Kullanıcı rolüne göre filtreleme
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'craftsman') {
      query.craftsman = req.user.craftsmanProfile;
    }

    // Tarih aralığı filtreleme
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Durum filtreleme
    if (req.query.status) {
      query.status = req.query.status;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('job', 'title description')
      .populate('client', 'name email')
      .populate('craftsman', 'user')
      .sort({ date: 1, startTime: 1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Randevular getirilirken bir hata oluştu'
    });
  }
});

// Yeni randevu oluştur
router.post('/', protect, validateAppointment, async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      client: req.user.id
    });

    // Bildirim gönder
    await sendAppointmentNotification(appointment);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Randevu oluşturulurken bir hata oluştu'
    });
  }
});

// Randevu detaylarını getir
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('job', 'title description')
      .populate('client', 'name email')
      .populate('craftsman', 'user');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Randevu bulunamadı'
      });
    }

    // Yetki kontrolü
    if (req.user.role !== 'admin' && 
        appointment.client.toString() !== req.user.id && 
        appointment.craftsman.toString() !== req.user.craftsmanProfile) {
      return res.status(403).json({
        success: false,
        error: 'Bu randevuyu görüntüleme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Randevu detayları getirilirken bir hata oluştu'
    });
  }
});

// Randevu güncelle
router.put('/:id', protect, async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Randevu bulunamadı'
      });
    }

    // Yetki kontrolü
    if (req.user.role !== 'admin' && 
        appointment.client.toString() !== req.user.id && 
        appointment.craftsman.toString() !== req.user.craftsmanProfile) {
      return res.status(403).json({
        success: false,
        error: 'Bu randevuyu güncelleme yetkiniz yok'
      });
    }

    // Tamamlanmış randevuları güncellemeyi engelle
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Tamamlanmış randevular güncellenemez'
      });
    }

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Randevu güncellenirken bir hata oluştu'
    });
  }
});

// Randevu iptal et
router.delete('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Randevu bulunamadı'
      });
    }

    // Yetki kontrolü
    if (req.user.role !== 'admin' && 
        appointment.client.toString() !== req.user.id && 
        appointment.craftsman.toString() !== req.user.craftsmanProfile) {
      return res.status(403).json({
        success: false,
        error: 'Bu randevuyu iptal etme yetkiniz yok'
      });
    }

    // Tamamlanmış randevuları iptal etmeyi engelle
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Tamamlanmış randevular iptal edilemez'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason;
    appointment.cancelledBy = req.user.id;
    await appointment.save();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Randevu iptal edilirken bir hata oluştu'
    });
  }
});

// Randevu hatırlatıcı gönder
router.post('/:id/reminder', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Randevu bulunamadı'
      });
    }

    // Hatırlatıcı gönder
    await sendAppointmentNotification(appointment, true);

    appointment.reminderSent = true;
    await appointment.save();

    res.json({
      success: true,
      message: 'Randevu hatırlatıcısı gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hatırlatıcı gönderilirken bir hata oluştu'
    });
  }
});

module.exports = router; 