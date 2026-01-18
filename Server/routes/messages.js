const express = require('express');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.userId },
            { receiver: req.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', req.userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate user details
    await Message.populate(messages, {
      path: 'lastMessage.sender lastMessage.receiver',
      select: 'username avatar shopName role'
    });

    res.json({ conversations: messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages in a conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const conversationId = Message.getConversationId(req.userId, otherUserId);

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username avatar shopName role')
      .populate('receiver', 'username avatar shopName role')
      .populate('product', 'name images price')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, message, productId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver and message are required' });
    }

    const conversationId = Message.getConversationId(req.userId, receiverId);

    const newMessage = new Message({
      conversation: conversationId,
      sender: req.userId,
      receiver: receiverId,
      message,
      product: productId || null
    });

    await newMessage.save();
    await newMessage.populate('sender', 'username avatar shopName role');
    await newMessage.populate('receiver', 'username avatar shopName role');
    if (productId) {
      await newMessage.populate('product', 'name images price');
    }

    res.status(201).json({ message: 'Message sent', data: newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        receiver: req.userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;