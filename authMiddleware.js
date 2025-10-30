const jwt = require('jsonwebtoken');
const User = require('../models/User');

// دالة وسيطة (Middleware) لحماية المسارات
const protect = async (req, res, next) => {
  let token;

  // 1. التحقق من وجود Token في الـ Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. استخلاص الـ Token
      // (يأتي بصيغة "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 3. التحقق من صحة الـ Token وفك تشفيره
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. جلب بيانات المستخدم من الـ Token وإرفاقها بالطلب
      // (نستثني كلمة المرور)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         return res.status(401).json({ message: 'المستخدم غير موجود' });
      }

      // 5. السماح للطلب بالاستمرار للمسار التالي
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'غير مصرح لك، التوكن غير صالح' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح لك، لا يوجد توكن' });
  }
};

module.exports = { protect };
