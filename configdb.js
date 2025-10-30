const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] تم الاتصال بقاعدة البيانات: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] خطأ في الاتصال: ${error.message}`);
    process.exit(1); // إيقاف السيرفر عند فشل الاتصال
  }
};

module.exports = connectDB;
