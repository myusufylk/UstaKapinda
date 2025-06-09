const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ustakapinda';
const EMAIL = 'yusuf0079@icloud.com';

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const user = await User.findOne({ email: EMAIL });
    if (user) {
      console.log('Kullanıcı bulundu:', user);
    } else {
      console.log('Kullanıcı bulunamadı.');
    }
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkUser(); 