const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Handles: auth on connect, online/offline presence, joining conversation rooms,
// typing indicators. Actual message delivery is triggered from messageRoutes.js
// (via io.to(socketId).emit(...)) right after a message is saved to MongoDB.
module.exports = function registerSocketHandlers(io, onlineUsers) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', { userId });

    console.log(`Socket connected: user ${userId}`);

    // client asks to join a conversation room, e.g. when opening a chat
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // typing indicator, broadcast to everyone else in that conversation room
    socket.on('typing', ({ conversationId, name }) => {
      socket.to(conversationId).emit('user_typing', { conversationId, name });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', { conversationId });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user_offline', { userId });
      console.log(`Socket disconnected: user ${userId}`);
    });
  });
};
