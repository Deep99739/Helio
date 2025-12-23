const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// ... existing imports ...

// Google Auth Route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback Route
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication, generate JWT
        const payload = {
            user: {
                id: req.user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                // Redirect to frontend with token
                // In production, use a secure cookie or a structured redirect
                // Ideally: res.redirect(`http://localhost:3000/auth/success?token=${token}`);
                // We need to know frontend URL. Assuming relative for now or env.
                // Let's assume dev env for redirect logic or grab from referer?
                // Better to use env var for CLIENT_URL
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                res.redirect(`${clientUrl}/auth/success?token=${token}`);
            }
        );
    }
);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);
// Need middleware to protect this route
const auth = require('../middleware/auth'); // Assuming this exists or we need to check index/routes for location
router.get('/me', auth, authController.getMe);
module.exports = router;
