import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  day: { type: String, required: true },
  date: { type: String, required: true },
  time_start: { type: String, required: true },
  time_end: { type: String, required: true },
  activity_name: { type: String, required: true },
  responsible_person: { type: String, default: '' },
  category: { type: String, default: 'نشاط' },
  location: { type: String, default: '' },
  material: { type: String, default: '' },
  restrictions: { type: String, default: '' },
  notes: { type: String, default: '' },
  sort_order: { type: Number, default: 0 }
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model('Session', sessionSchema);
