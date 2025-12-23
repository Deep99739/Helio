const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: { type: String, enum: ['preset', 'upload', 'generated'], default: 'generated' },
        value: { type: String, default: '' } // URL for upload, Config string for generated
    },
    coverPhoto: {
        type: { type: String, enum: ['preset', 'upload'], default: 'preset' },
        value: { type: String, default: 'linear-gradient(to right, #007acc, #6366f1)' }
    },
    bio: {
        type: String,
        default: ''
    },
    socialHandles: {
        type: Map,
        of: String
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    recentRooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true }
});

module.exports = mongoose.model('User', userSchema);
