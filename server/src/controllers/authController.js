const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            username,
            email,
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

// --- PHASE 2: OTP & Verification ---

// @desc    Send OTP for Verification (Signup/Reset)
// @route   POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
    const { email } = req.body;
    try {
        let user = await User.findOne({ email });

        // If user doesn't exist and this is for signup, we just send OTP to verify email ownership.
        if (!user) {
            // Create temporary user shell
            // In a real production app, we might store this in a temporary "OTP" collection.
            // For simplicity in this plan, we will optimistically allow sending OTP.
            // BUT, to persist it, we need a document. 
            // We will create a User with minimal fields and isVerified: false.

            user = new User({
                username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
                email,
                password: crypto.randomBytes(10).toString('hex'),
                isVerified: false
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        // Save using validateBeforeSave: false if needed, but here simple save should work 
        // as long as required fields like username are present (handled above).
        await user.save();

        // Send Email
        const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #4A90E2;">Helio Verification Code</h1>
                <p>Use the code below to verify your email address:</p>
                <div style="background-color: #f4f4f4; padding: 10px; font-size: 24px; letter-spacing: 5px; font-weight: bold; width: fit-content; border-radius: 5px;">
                    ${otp}
                </div>
                <p>This code expires in 10 minutes.</p>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Helio Verification Code',
            html: message
        });

        res.status(200).json({ message: `OTP sent to ${email}` });
    } catch (err) {
        console.error("OTP Error:", err);
        res.status(500).json({ message: 'Email could not be sent. Check server logs.' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or Expired OTP' });
        }

        // OTP Valid
        user.isVerified = true;

        // Don't clear OTP immediately if we need it for password reset in the next step?
        // Actually for pure verification it is fine.
        // But for reset flow, we verify OTP *inside* resetPassword or use a token.
        // For simplicity in this plan: resetPassword will accept OTP again.

        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Email Verified Successfully', verified: true, userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Verification Error' });
    }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or Expired Method. Please request a new code.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password Reset Successfully. Please Login.' });
    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
