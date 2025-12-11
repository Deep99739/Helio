const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Optional auth middleware for public routes that might need user context
const optionalAuth = (req, res, next) => {
    try {
        // Safe header access
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
        // Token invalid or other error -> proceed as public
        next();
    }
};

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', userController.searchUsers);

// @route   GET /api/users/friends
// @desc    Get friends list
// @access  Private
router.get('/friends', auth, userController.getFriends);

// @route   GET /api/users/requests
// @desc    Get pending requests
// @access  Private
router.get('/requests', auth, userController.getFriendRequests);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, userController.updateUserProfile);

// @route   POST /api/users/request/:userId
// @desc    Send friend request
// @access  Private
router.post('/request/:userId', auth, userController.sendFriendRequest);

// @route   PUT /api/users/accept/:requestId
// @desc    Accept friend request
// @access  Private
router.put('/accept/:requestId', auth, userController.acceptFriendRequest);

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public (but authenticated users see more info)
router.get('/:username', optionalAuth, userController.getUserProfile);

module.exports = router;
