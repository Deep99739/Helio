const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
    },
    user: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: ['CODE_RUN', 'FILE_SAVE'],
        required: true,
    },
    codeSnapshot: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
