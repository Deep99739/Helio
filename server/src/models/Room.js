const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    files: [{
        id: String,
        name: String,
        content: String,
        language: String
    }],
    whiteboardElements: {
        type: Array, // Array of element objects
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
