const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who receives it
  type:    { type: String, enum: ['message', 'group_add', 'system'], default: 'message' },
  text:    { type: String, required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  isRead:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
