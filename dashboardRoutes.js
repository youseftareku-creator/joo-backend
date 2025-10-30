const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Debt = require('../models/Debt');

// --- حماية جميع المسارات ---
router.use(protect);

// --- 1. إحصائيات الكروت ---
// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // جلب المعاملات والديون الخاصة بالمستخدم
    const transactions = await Transaction.find({ user: userId });
    const debts = await Debt.find({ user: userId });

    // حساب الإحصائيات
    const totalPaid = transactions.reduce((acc, t) => acc + t.paid, 0);
    const totalRemaining = transactions.reduce((acc, t) => acc + t.remaining, 0);
    
    const totalTheyOwe = debts
      .filter(d => d.status === 'they-owe')
      .reduce((acc, d) => acc + d.amount, 0);
      
    const totalIOwe = debts
      .filter(d => d.status === 'i-owe')
      .reduce((acc, d) => acc + d.amount, 0);

    res.json({
      totalPaid,
      totalRemaining,
      totalTheyOwe,
      totalIOwe,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- 2. بيانات الرسم البياني الخطي (آخر 30 يوم) ---
// GET /api/dashboard/chart
router.get('/chart', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // تاريخ اليوم قبل 30 يوم
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

    // تجميع (Aggregation) للمعاملات
    const data = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: date30DaysAgo } // المعاملات التي أُنشئت في آخر 30 يوم
        }
      },
      {
        $group: {
          // تجميع حسب اليوم
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 } // عدد المعاملات في ذلك اليوم
        }
      },
      {
        $sort: { _id: 1 } // ترتيب حسب التاريخ
      }
    ]);

    // تنسيق البيانات كما يتوقعها Chart.js
    const chartData = {
      labels: data.map(d => new Date(d._id).toLocaleDateString('ar-EG-u-nu-latn', { day: '2-digit', month: 'short' })),
      data: data.map(d => d.count),
    };

    res.json(chartData);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- 3. بيانات الرسم البياني الدائري (أنواع التأشيرات) ---
// GET /api/dashboard/piechart
router.get('/piechart', async (req, res) => {
  try {
    const userId = req.user._id;

    // تجميع حسب نوع المعاملة
    const data = await Transaction.aggregate([
      {
        $match: { user: userId }
      },
      {
        $group: {
          _id: "$type", // تجميع حسب حقل 'type'
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 } // ترتيب من الأكثر للأقل
      }
    ]);

    // تنسيق البيانات
    const pieData = {
      labels: data.map(d => d._id),
      data: data.map(d => d.count),
    };

    res.json(pieData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
