const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  isGroup:  { type: Boolean, default: false },
  name:     { type: String, trim: true }, // only used for groups
  members:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  admin:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // group creator/admin
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
