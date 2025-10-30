const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Debt = require('../models/Debt');

// --- حماية جميع المسارات ---
router.use(protect);

// --- 1. جلب جميع الديون (للمستخدم الحالي) ---
// GET /api/debts
router.get('/', async (req, res) => {
  try {
    // البحث فقط عن ديون المستخدم الحالي
    const debts = await Debt.find({ user: req.user._id });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 2. إضافة دين جديد ---
// POST /api/debts
router.post('/', async (req, res) => {
  try {
    const { name, amount, status, date, notes } = req.body;

    const debt = new Debt({
      name,
      amount,
      status,
      date,
      notes,
      user: req.user._id, // ربط الدين بالمستخدم
    });

    const createdDebt = await debt.save();
    res.status(201).json(createdDebt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- 3. تعديل دين ---
// PUT /api/debts/:id
router.put('/:id', async (req, res) => {
  try {
    let debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: 'الدين غير موجود' });
    }

    // التحقق من الملكية
    if (debt.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'غير مصرح لك' });
    }

    const updatedDebt = await Debt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedDebt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- 4. حذف دين ---
// DELETE /api/debts/:id
router.delete('/:id', async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: 'الدين غير موجود' });
    }

    // التحقق من الملكية
    if (debt.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'غير مصرح لك' });
    }

    await Debt.deleteOne({ _id: req.params.id });
    res.json({ message: 'تم حذف الدين' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
