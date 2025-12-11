const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// @route   POST /api/chat/send
// @desc    Send a private message
// @access  Private
router.post('/send', auth, chatController.sendMessage);

// @route   GET /api/chat/history/:friendId
// @desc    Get chat history
// @access  Private
router.get('/history/:friendId', auth, chatController.getMessages);

module.exports = router;
