const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sistem cevapları için anahtar kelimeler ve cevaplar
const systemResponses = {
  'merhaba': ['Merhaba! Size nasıl yardımcı olabilirim?', 'Merhaba! Hoş geldiniz, size nasıl yardımcı olabilirim?'],
  'nasılsın': ['İyiyim, teşekkür ederim! Siz nasılsınız?', 'Çok iyiyim, sizin için buradayım!'],
  'yardım': ['Size nasıl yardımcı olabilirim?', 'Hangi konuda yardıma ihtiyacınız var?'],
  'teşekkür': ['Rica ederim!', 'Ne demek, her zaman!'],
  'görüşürüz': ['Görüşmek üzere!', 'İyi günler!'],
  'fiyat': ['Ürünlerimizin fiyatları hakkında bilgi almak için lütfen hangi ürünü öğrenmek istediğinizi belirtin.'],
  'adres': ['Adresimiz: [Adres bilgisi buraya gelecek]'],
  'çalışma saatleri': ['Pazartesi - Cumartesi: 09:00 - 18:00'],
  'iletişim': ['Bize ulaşmak için:\nTelefon: [Telefon numarası]\nE-posta: [E-posta adresi]'],
  'default': ['Üzgünüm, bu konuda size nasıl yardımcı olabileceğimi tam olarak anlayamadım. Lütfen sorunuzu farklı bir şekilde ifade eder misiniz?']
};

// Sistem cevabı oluşturma fonksiyonu
function generateSystemResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Anahtar kelimeleri kontrol et
  for (const [keyword, responses] of Object.entries(systemResponses)) {
    if (lowerMessage.includes(keyword)) {
      // Rastgele bir cevap seç
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return {
        id: Date.now(),
        content: randomResponse,
        type: 'text',
        sender: 'Yardımcı Usta',
        timestamp: new Date(),
        isSystem: true
      };
    }
  }
  
  // Eğer hiçbir anahtar kelime bulunamazsa varsayılan cevabı döndür
  return {
    id: Date.now(),
    content: systemResponses.default[0],
    type: 'text',
    sender: 'Yardımcı Usta',
    timestamp: new Date(),
    isSystem: true
  };
}

// Dosya yükleme için multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Aktif kullanıcıları takip etmek için
const activeUsers = new Map();

// Admin kullanıcıları için
const adminUsers = new Map();

io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  // Kullanıcı katıldığında
  socket.on('userJoined', (userData) => {
    activeUsers.set(socket.id, userData);
    io.emit('userList', Array.from(activeUsers.values()));
    
    // Hoş geldin mesajı gönder
    const welcomeMessage = {
      id: Date.now(),
      content: 'Merhaba! Ben Yardımcı Usta. Size nasıl yardımcı olabilirim?',
      type: 'text',
      sender: 'Yardımcı Usta',
      timestamp: new Date(),
      isSystem: true
    };
    socket.emit('newMessage', welcomeMessage);
  });

  // Admin girişi
  socket.on('adminLogin', (adminData) => {
    if (adminData.password === '12345') {
      adminUsers.set(socket.id, adminData.username);
      socket.emit('adminStatus', { isAdmin: true });
      console.log('Admin girişi yapıldı:', adminData.username);
    }
  });

  // Sistem mesajı gönderme
  socket.on('sendSystemMessage', (data) => {
    if (adminUsers.has(socket.id)) {
      const systemMessage = {
        id: Date.now(),
        content: data.message,
        type: 'text',
        sender: data.username,
        timestamp: new Date(),
        isSystem: true
      };
      io.emit('newMessage', systemMessage);
    }
  });

  // Mesaj gönderildiğinde
  socket.on('sendMessage', (message) => {
    // Kullanıcı mesajını yayınla
    io.emit('newMessage', {
      ...message,
      timestamp: new Date(),
      status: 'sent'
    });

    // Sistem cevabı oluştur ve gönder
    setTimeout(() => {
      const systemResponse = generateSystemResponse(message.content);
      socket.emit('newMessage', systemResponse);
    }, 1000);
  });

  // Mesaj durumu güncellendiğinde
  socket.on('updateMessageStatus', (messageId) => {
    io.emit('messageStatusUpdated', messageId);
  });

  // Mesaj okundu bildirimi
  socket.on('messageRead', (messageId) => {
    io.emit('messageRead', messageId);
  });

  // Kullanıcı yazıyor bildirimi
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('userList', Array.from(activeUsers.values()));
  });
});

// Dosya yükleme endpoint'i
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
  res.json({ 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Sistem mesajı gönderme endpoint'i
app.post('/send-system-message', express.json(), (req, res) => {
    const { message, socketId } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Mesaj içeriği gerekli' });
    }

    if (socketId) {
        // Belirli bir kullanıcıya mesaj gönder
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            sendSystemMessage(socket, message);
            res.json({ success: true, message: 'Mesaj gönderildi' });
        } else {
            res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
    } else {
        // Tüm kullanıcılara mesaj gönder
        io.emit('newMessage', {
            id: Date.now(),
            content: message,
            type: 'text',
            sender: 'Yardımcı Usta',
            timestamp: new Date(),
            isSystem: true
        });
        res.json({ success: true, message: 'Mesaj tüm kullanıcılara gönderildi' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 