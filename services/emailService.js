const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.templates = {};
  }

  // E-posta şablonunu yükle
  async loadTemplate(templateName) {
    if (this.templates[templateName]) {
      return this.templates[templateName];
    }

    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templates[templateName] = handlebars.compile(template);
      return this.templates[templateName];
    } catch (error) {
      console.error('Template loading error:', error);
      throw error;
    }
  }

  // E-posta gönder
  async sendEmail(to, subject, templateName, data) {
    try {
      const template = await this.loadTemplate(templateName);
      const html = template(data);

      const mailOptions = {
        from: `"Usta Kapında" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Hoş geldin e-postası
  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Usta Kapında\'ya Hoş Geldiniz!',
      'welcome',
      {
        name: user.name,
        verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${user.verificationToken}`
      }
    );
  }

  // Şifre sıfırlama e-postası
  async sendPasswordResetEmail(user, resetToken) {
    return this.sendEmail(
      user.email,
      'Şifre Sıfırlama',
      'password-reset',
      {
        name: user.name,
        resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
      }
    );
  }

  // İş teklifi e-postası
  async sendJobOfferEmail(user, job) {
    return this.sendEmail(
      user.email,
      'Yeni İş Teklifi',
      'job-offer',
      {
        name: user.name,
        jobTitle: job.title,
        jobDescription: job.description,
        jobLink: `${process.env.CLIENT_URL}/jobs/${job._id}`
      }
    );
  }

  // Ödeme onayı e-postası
  async sendPaymentConfirmationEmail(user, payment) {
    return this.sendEmail(
      user.email,
      'Ödeme Onayı',
      'payment-confirmation',
      {
        name: user.name,
        amount: payment.amount,
        currency: payment.currency,
        invoiceNumber: payment.invoiceNumber,
        invoiceLink: `${process.env.CLIENT_URL}/invoices/${payment._id}`
      }
    );
  }

  // Randevu hatırlatma e-postası
  async sendAppointmentReminderEmail(user, appointment) {
    return this.sendEmail(
      user.email,
      'Randevu Hatırlatması',
      'appointment-reminder',
      {
        name: user.name,
        appointmentDate: appointment.date,
        appointmentTime: appointment.startTime,
        serviceType: appointment.serviceType,
        location: appointment.location
      }
    );
  }

  // Değerlendirme isteği e-postası
  async sendReviewRequestEmail(user, job) {
    return this.sendEmail(
      user.email,
      'Hizmet Değerlendirmesi',
      'review-request',
      {
        name: user.name,
        jobTitle: job.title,
        reviewLink: `${process.env.CLIENT_URL}/jobs/${job._id}/review`
      }
    );
  }
}

module.exports = new EmailService(); 