const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    role: user.role,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  };
}

// GET /api/users?search=abc  -> list/search users (for starting a new chat)
router.get('/', auth, async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const filter = {
      _id: { $ne: req.userId },
      ...(search ? { name: { $regex: search, $options: 'i' } } : {})
    };
    const users = await User.find(filter).limit(30);
    res.json(users.map(publicUser));
  } catch (err) { next(err); }
});

// PUT /api/users/me  -> update own profile (name / avatar color)
router.put('/me', auth, async (req, res, next) => {
  try {
    const { name, avatarColor } = req.body;
    const update = {};
    if (name) update.name = name;
    if (avatarColor) update.avatarColor = avatarColor;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    res.json(publicUser(user));
  } catch (err) { next(err); }
});

module.exports = router;
