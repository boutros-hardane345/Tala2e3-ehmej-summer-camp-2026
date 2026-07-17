import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  message: { type: String, required: true },
  rating: { type: Number, default: 0 }
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model('Feedback', feedbackSchema);
