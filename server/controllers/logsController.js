const AuditLog = require("../models/AuditLog");

exports.createLog = async ({ roomId, user, action, codeSnapshot }) => {
    try {
        await AuditLog.create({
            roomId,
            user,
            action,
            codeSnapshot
        });
        // Console log for debugging, though we might not want to spam
        // console.log("Audit log created"); 
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
};

exports.getLogs = async (req, res) => {
    const { roomId } = req.params;
    try {
        const logs = await AuditLog.find({ roomId }).sort({ timestamp: -1 }); // Newest first
        res.json(logs);
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
};
