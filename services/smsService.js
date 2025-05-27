const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // SMS gönder
  async sendSMS(to, message) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to
      });

      console.log('SMS sent:', result.sid);
      return result;
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }

  // Doğrulama kodu gönder
  async sendVerificationCode(phoneNumber, code) {
    const message = `Usta Kapında doğrulama kodunuz: ${code}. Bu kod 5 dakika geçerlidir.`;
    return this.sendSMS(phoneNumber, message);
  }

  // Randevu hatırlatma
  async sendAppointmentReminder(phoneNumber, appointment) {
    const message = `Sayın müşterimiz, ${appointment.date} tarihindeki ${appointment.startTime} saatindeki randevunuzu hatırlatırız. Usta Kapında.`;
    return this.sendSMS(phoneNumber, message);
  }

  // Ödeme hatırlatma
  async sendPaymentReminder(phoneNumber, payment) {
    const message = `Sayın müşterimiz, ${payment.amount} ${payment.currency} tutarındaki ödemeniz için son tarih yaklaşıyor. Usta Kapında.`;
    return this.sendSMS(phoneNumber, message);
  }

  // İş durumu güncelleme
  async sendJobStatusUpdate(phoneNumber, job) {
    const message = `İş durumunuz güncellendi: ${job.status}. Detaylar için Usta Kapında uygulamasını kontrol edin.`;
    return this.sendSMS(phoneNumber, message);
  }

  // Acil durum bildirimi
  async sendEmergencyNotification(phoneNumber, message) {
    const emergencyMessage = `ACİL: ${message} - Usta Kapında`;
    return this.sendSMS(phoneNumber, emergencyMessage);
  }

  // Toplu SMS gönderimi
  async sendBulkSMS(phoneNumbers, message) {
    const promises = phoneNumbers.map(phoneNumber => this.sendSMS(phoneNumber, message));
    return Promise.all(promises);
  }
}

module.exports = new SMSService(); 