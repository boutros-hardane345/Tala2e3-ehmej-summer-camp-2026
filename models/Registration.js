import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model('Registration', registrationSchema);
