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
            // Room does not exist in DB
            if (name) {
                // Name provided -> Create new PERSISTENT room
                room = new Room({
                    roomId,
                    name,
                    owner: userId,
                    lastActive: Date.now(),
                    members: userId ? [userId] : []
                });
                await room.save();
            } else {
                // Name NOT provided -> Anonymous Join (Ephemeral)
                // We do NOT create a DB entry.
                // We just return a success response so client can proceed to socket join.
                return res.json({ roomId, message: 'Joined anonymous room' });
            }
        }

        // If user is logged in, AND we found/created a persistent room, add to recentRooms
        if (userId && room) {
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

exports.removeRecentRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.user.id;

        // 1. Remove from User's recentRooms
        const room = await Room.findOne({ roomId });
        if (!room) {
            // If room doesn't exist, just remove from user's list if it's there (by ID ref)
            // But we need the _id to remove from user array.
            // If we can't find room, maybe we can't remove it easily by _id unless we know it.
            // Let's assume the client sends the room's ObjectId or we find it.
            // Wait, req.body has roomId (string).
            // If room is gone, we can't find its _id. 
            // Better to find User, populate recentRooms, filter out by roomId.
        }

        const user = await User.findById(userId).populate('recentRooms');
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Filter out the room to remove
        const initialCount = user.recentRooms.length;
        user.recentRooms = user.recentRooms.filter(r => r && r.roomId !== roomId);

        await user.save();

        if (!room) {
            // Room apparently already deleted or phantom
            return res.json({ message: 'Removed from history (Room was already gone)' });
        }

        // 2. Check if ANY other user still has this room in recentRooms
        // We look for any user whose recentRooms array contains room._id
        const usersWithRoom = await User.countDocuments({ recentRooms: room._id });

        if (usersWithRoom === 0) {
            // No one remembers this room. Delete it.
            await Room.deleteOne({ _id: room._id });
            console.log(`[GC] Deleted Room ${roomId} as no users reference it anymore.`);
            return res.json({ message: 'Room removed from history and deleted from DB' });
        }

        res.json({ message: 'Removed from history' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
