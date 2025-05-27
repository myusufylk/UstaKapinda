const admin = require('firebase-admin');
const path = require('path');

class PushNotificationService {
  constructor() {
    // Firebase yapılandırması
    const serviceAccount = require(path.join(__dirname, '../config/firebase-service-account.json'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    this.messaging = admin.messaging();
  }

  // Tekil bildirim gönder
  async sendNotification(token, notification) {
    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('Push notification sent:', response);
      return response;
    } catch (error) {
      console.error('Push notification error:', error);
      throw error;
    }
  }

  // Toplu bildirim gönder
  async sendMulticastNotification(tokens, notification) {
    try {
      const message = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.sendMulticast(message);
      console.log('Multicast notification sent:', response);
      return response;
    } catch (error) {
      console.error('Multicast notification error:', error);
      throw error;
    }
  }

  // Konuya bildirim gönder
  async sendTopicNotification(topic, notification) {
    try {
      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('Topic notification sent:', response);
      return response;
    } catch (error) {
      console.error('Topic notification error:', error);
      throw error;
    }
  }

  // Kullanıcıya bildirim gönder
  async sendUserNotification(userId, notification) {
    try {
      // Kullanıcının FCM token'larını veritabanından al
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        throw new Error('User has no FCM tokens');
      }

      return this.sendMulticastNotification(user.fcmTokens, notification);
    } catch (error) {
      console.error('User notification error:', error);
      throw error;
    }
  }

  // Bildirim şablonları
  getNotificationTemplates() {
    return {
      newMessage: (senderName) => ({
        title: 'Yeni Mesaj',
        body: `${senderName} size bir mesaj gönderdi`
      }),
      newJob: (jobTitle) => ({
        title: 'Yeni İş Teklifi',
        body: `${jobTitle} için yeni bir iş teklifi aldınız`
      }),
      paymentReceived: (amount) => ({
        title: 'Ödeme Alındı',
        body: `${amount} TL tutarında ödeme alındı`
      }),
      appointmentReminder: (date, time) => ({
        title: 'Randevu Hatırlatması',
        body: `${date} tarihinde ${time} saatinde randevunuz var`
      }),
      reviewRequest: (jobTitle) => ({
        title: 'Değerlendirme İsteği',
        body: `${jobTitle} işi için değerlendirmenizi bekliyoruz`
      })
    };
  }
}

module.exports = new PushNotificationService(); 