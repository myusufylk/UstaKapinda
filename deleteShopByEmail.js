const mongoose = require('mongoose');
const Shop = require('./models/Shop');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ustakapinda';
const EMAIL = 'yusuf.y0079@icloud.com';

async function deleteShop() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const result = await Shop.deleteOne({ email: EMAIL });
    console.log('Silme sonucu:', result);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

deleteShop(); 