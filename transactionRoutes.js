const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

// --- حماية جميع المسارات التالية ---
// أي طلب يصل لهذا الملف يجب أن يمر عبر 'protect' أولاً
router.use(protect);

// --- 1. جلب جميع المعاملات (للمستخدم الحالي) ---
// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    // البحث فقط عن المعاملات التي يملكها المستخدم (req.user._id)
    const transactions = await Transaction.find({ user: req.user._id });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 2. إضافة معاملة جديدة ---
// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { name, type, paid, remaining, deliveryDate, notes } = req.body;

    const transaction = new Transaction({
      name,
      type,
      paid,
      remaining,
      deliveryDate,
      notes,
      user: req.user._id, // ربط المعاملة بالمستخدم
    });

    const createdTransaction = await transaction.save();
    res.status(201).json(createdTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- 3. تعديل معاملة ---
// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    // البحث عن المعاملة
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'المعاملة غير موجودة' });
    }

    // التحقق من أن المستخدم هو مالك المعاملة
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'غير مصرح لك بتعديل هذه المعاملة' });
    }

    // تحديث البيانات
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // إرجاع النسخة المحدثة
    );
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- 4. حذف معاملة ---
// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'المعاملة غير موجودة' });
    }

    // التحقق من الملكية
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'غير مصرح لك بحذف هذه المعاملة' });
    }

    await Transaction.deleteOne({ _id: req.params.id });
    res.json({ message: 'تم حذف المعاملة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
