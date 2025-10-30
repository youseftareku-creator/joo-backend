const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// --- دالة مساعدة لإنشاء Token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // صلاحية 30 يوم
  });
};


// --- 1. تسجيل مستخدم جديد ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // التحقق إذا كان الإيميل مسجل مسبقاً
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    // إنشاء مستخدم جديد
    // (عملية التشفير تتم تلقائياً بفضل الـ "hook" في نموذج User)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        message: 'تم التسجيل بنجاح!',
        // لا نرسل Token هنا، نطلب منه تسجيل الدخول
      });
    } else {
      res.status(400).json({ message: 'بيانات المستخدم غير صالحة' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- 2. تسجيل الدخول ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // البحث عن المستخدم
    const user = await User.findOne({ email });

    // التحقق من المستخدم ومن كلمة المرور
    if (user && (await user.matchPassword(password))) {
      // إرسال البيانات المتوقعة من الواجهة الأمامية
      res.json({
        token: generateToken(user._id),
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- 3. جلب بيانات المستخدم الحالي ---
// GET /api/auth/me
// (هذا المسار محمي)
router.get('/me', protect, async (req, res) => {
  // الـ Middleware 'protect' قام بجلب المستخدم ووضعه في req.user
  res.json({
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = router;
