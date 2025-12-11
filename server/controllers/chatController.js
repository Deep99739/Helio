const Message = require('../models/Message');
const User = require('../models/User');
const ACTIONS = require('../Actions');

// Send a private message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.user.id;

        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        // Security Constraint: Check if users are friends
        const sender = await User.findById(senderId);

        // Ensure friends array contains strings or Compare ObjectIds correctly
        const isFriend = sender.friends.some(friendId => friendId.toString() === receiverId);

        if (!isFriend) {
            // Check if it's the other way around? Friends is usually bidirectional but let's be safe.
            // Our acceptRequest adds to BOTH. So checking sender list is sufficient.
            return res.status(403).json({ message: "You can only message friends." });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await newMessage.save();

        // Populate sender details for frontend display
        await newMessage.populate('sender', 'username avatar');

        // Real-Time: Emit socket event
        const io = req.app.get('io');
        // We need the socketId of the receiver.
        // We stored this in globalOnlineUsers map in index.js, but that's a local variable there.
        // Option 1: Export the map.
        // Option 2: Use io.to() if we joined them to a personal room "userId".
        // In index.js we didn't join them to a userId room. 
        // But we have the map. If the map is in index.js, we can't access it here easily unless we exported it or attached it to app.

        // Let's rely on joining a room named with userId in index.js OR attached the map to app.
        // For simplicity and robustness, it's best if every user joins a room with their own userId upon connection.
        // Let's assume we update index.js to do `socket.join(userId)` in the USER_ONLINE event or generic connection.

        // Alternatively, access the map if we attach it to app.
        // `req.app.get('onlineUsersMap')`

        // For now, I will use `io.to(receiverSocketId).emit(...)`.
        // I need to get the socketId.
        // I will add `app.set('onlineUsers', globalOnlineUsers)` in index.js.

        const onlineUsers = req.app.get('onlineUsers');
        if (onlineUsers && onlineUsers.has(receiverId)) {
            const receiverSocketId = onlineUsers.get(receiverId);
            io.to(receiverSocketId).emit('private-message', newMessage);
        }

        res.json(newMessage);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get chat history
exports.getMessages = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.user.id;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'username avatar');

        res.json(messages);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};
