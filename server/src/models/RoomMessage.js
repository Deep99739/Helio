const mongoose = require('mongoose');

const roomMessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // time string from logic
    time: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('RoomMessage', roomMessageSchema);
