const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatarColor: { type: String, default: '#2A5BFF' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
