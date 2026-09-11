const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:conversationId -> full message history for a conversation
router.get('/:conversationId', auth, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.some(m => m.toString() === req.userId)) {
      return res.status(403).json({ message: 'Not a member of this conversation' });
    }
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatarColor')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { next(err); }
});

// POST /api/messages  { conversationId, text } -> send a message
router.post('/', auth, async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text) {
      return res.status(400).json({ message: 'conversationId and text are required' });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.members.some(m => m.toString() === req.userId)) {
      return res.status(403).json({ message: 'Not a member of this conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.userId,
      text,
      readBy: [req.userId]
    });
    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await message.populate('sender', 'name avatarColor');

    // notify every other member + push down the socket in real time
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const recipients = conversation.members.filter(m => m.toString() !== req.userId);

    for (const recipientId of recipients) {
      await Notification.create({
        user: recipientId,
        type: 'message',
        text: `${populated.sender.name}: ${text}`,
        conversation: conversationId
      });
      const socketId = onlineUsers.get(recipientId.toString());
      if (socketId) {
        io.to(socketId).emit('receive_message', populated);
        io.to(socketId).emit('new_notification', { conversationId, text: `${populated.sender.name}: ${text}` });
      }
    }

    res.status(201).json(populated);
  } catch (err) { next(err); }
});

module.exports = router;
