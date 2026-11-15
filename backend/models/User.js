import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true, // Sparse allows multiple nulls/undefined for anonymous users
  },
  password: {
    type: String,
  },
  displayName: {
    type: String,
    default: 'Anonymous',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
