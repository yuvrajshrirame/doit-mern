import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'CheckCircle',
  },
  color: {
    type: String,
    default: 'bg-cyan-500',
  },
  frequency: {
    type: String,
    default: 'daily',
  },
  category: {
    type: String,
    default: 'Other',
  },
  history: {
    type: Object,
    default: {},
  },
  streak: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);
