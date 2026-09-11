const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/conversations -> all conversations the logged-in user belongs to
router.get('/', auth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ members: req.userId })
      .populate('members', 'name email avatarColor isOnline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) { next(err); }
});

// POST /api/conversations/private  { userId }  -> get or create a 1-to-1 conversation
router.post('/private', auth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [req.userId, userId], $size: 2 }
    }).populate('members', 'name email avatarColor isOnline');

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        members: [req.userId, userId]
      });
      conversation = await conversation.populate('members', 'name email avatarColor isOnline');
    }
    res.status(201).json(conversation);
  } catch (err) { next(err); }
});

// POST /api/conversations/group  { name, memberIds: [] }  -> create a group chat
router.post('/group', auth, async (req, res, next) => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name || memberIds.length < 1) {
      return res.status(400).json({ message: 'Group name and at least one member are required' });
    }
    const members = Array.from(new Set([...memberIds, req.userId]));
    const conversation = await Conversation.create({
      isGroup: true,
      name,
      members,
      admin: req.userId
    });
    const populated = await conversation.populate('members', 'name email avatarColor isOnline');
    res.status(201).json(populated);
  } catch (err) { next(err); }
});

module.exports = router;
