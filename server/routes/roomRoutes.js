const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Optional auth middleware (similar to user routes)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
            }
        }
        next();
    } catch (err) {
        next();
    }
};

// @route   POST /api/rooms/join
// @desc    Join or create a room
// @access  Public (Optional Auth for history)
router.post('/join', optionalAuth, roomController.joinRoom);

// @route   GET /api/rooms/recent
// @desc    Get recent rooms for logged in user
// @access  Private
router.get('/recent', auth, roomController.getRecentRooms);

module.exports = router;
