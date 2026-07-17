import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Session from './models/Session.js';
import Feedback from './models/Feedback.js';
import Registration from './models/Registration.js';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/schedule-camp';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'schedule-camp-secret';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/sessions', async (req, res) => {
  try {
    const rows = await Session.find().sort({ sort_order: 1, time_start: 1 });
    const grouped = { الثلاثاء: [], الأربعاء: [], الخميس: [] };
    const dayMap = { tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', 'الثلاثاء': 'الثلاثاء', 'الأربعاء': 'الأربعاء', 'الخميس': 'الخميس' };
    for (const row of rows) {
      const key = dayMap[row.day] || row.day;
      if (grouped[key]) grouped[key].push(row);
    }
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sessions', requireAuth, async (req, res) => {
  try {
    const rows = await Session.find().sort({ sort_order: 1, time_start: 1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sessions', requireAuth, async (req, res) => {
  const { day, date, time_start, time_end, activity_name, category } = req.body;
  if (!day || !date || !time_start || !time_end || !activity_name) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }
  try {
    const session = await Session.create({ day, date, time_start, time_end, activity_name, category: category || 'نشاط' });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { day, date, time_start, time_end, activity_name, category } = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { day, date, time_start, time_end, activity_name, category },
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { name, message, rating } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'الرجاء كتابة الملاحظة' });
  }
  try {
    await Feedback.create({
      name: (name || '').trim(),
      message: message.trim(),
      rating: rating || 0
    });
    res.status(201).json({ message: 'شكراً لملاحظاتك! 🙏' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/feedback', requireAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/feedback/:id', requireAuth, async (req, res) => {
  try {
    const fb = await Feedback.findByIdAndDelete(req.params.id);
    if (!fb) return res.status(404).json({ error: 'الملاحظة غير موجودة' });
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, phone, age, notes } = req.body;
  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ error: 'الرجاء إدخال الاسم ورقم الهاتف' });
  }
  try {
    await Registration.create({
      name: name.trim(),
      phone: phone.trim(),
      age: age || '',
      notes: (notes || '').trim()
    });
    res.status(201).json({ message: 'تم التسجيل بنجاح! ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/registrations', requireAuth, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/registrations/:id', requireAuth, async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ error: 'التسجيل غير موجود' });
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
