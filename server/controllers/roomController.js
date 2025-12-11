const Room = require('../models/Room');
const User = require('../models/User');

exports.joinRoom = async (req, res) => {
    try {
        const { roomId, name } = req.body;
        const userId = req.user ? req.user.user.id : null;

        if (!roomId) {
            return res.status(400).json({ error: 'Room ID is required' });
        }

        let room = await Room.findOne({ roomId });

        if (room) {
            // Update lastActive
            room.lastActive = Date.now();
            // Add member if logged in
            if (userId && !room.members.includes(userId)) {
                room.members.push(userId);
            }
            await room.save();
        } else {
            // Create new room
            if (!name) {
                // If checking only, maybe don't create? But prompt says "If it doesn't exist, Create it (require a name)"
                // We'll return error if no name provided for creation
                return res.status(400).json({ error: 'Room name is required for new rooms' });
            }
            room = new Room({
                roomId,
                name,
                owner: userId,
                lastActive: Date.now(),
                members: userId ? [userId] : []
            });
            await room.save();
        }

        // If user is logged in, add to recentRooms
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { recentRooms: room._id }
            });
        }

        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRecentRooms = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId).populate({
            path: 'recentRooms',
            options: { sort: { lastActive: -1 } }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.recentRooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
