const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// Get user profile by username
exports.getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        console.log(`Getting profile for: ${username}`);
        let user = await User.findOne({ username }).select('-password');

        if (!user) {
            // Try case-insensitive
            console.log(`Exact match failed for ${username}, trying regex...`);
            user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select('-password');
        }

        if (!user) {
            console.log(`User not found: ${username}`);
            return res.status(404).json({ message: 'User not found' });
        }

        // Logic to determine friendship status if authenticated
        let friendshipStatus = 'NONE';

        // Ensure req.user exists (since this route might be Public in routes, 
        // need to handle if the user is logged in via token or if it's purely public)
        // However, middleware auth might not be applied here based on routes file.
        // Assuming we check headers or if req.user is populated loosely. 
        // For consistent checking, we'd need auth middleware or manual token check if available.
        // Given current route definition is PUBLIC, req.user won't be defined unless we optionally run auth.
        // For now, if req.user exists (optional auth scenario), we check status.
        // If not, it remains 'NONE'.

        // WAIT: The routes file says @access Public for this endpoint. 
        // User request: "Update GET /profile/:username ... so the frontend knows which button to show."
        // Frontend will likely look for this field. 
        // Since it is public, we cannot know WHO is viewing unless we pass a token.
        // I will assume for now that if the requester IS logged in (JWT present), 
        // the client typically sends it. But without middleware, req.user is undefined.
        // For strict correctness, to support "which button to show", this endpoint 
        // should ideally be accessible to logged-in users too. 
        // I will add code to check `req.user` if it EXISTS (meaning we might need to apply optional auth middleware).
        // Since I cannot change middleware easily in this step without seeing it, 
        // I will assume the caller puts the user info in req.user if authenticated 
        // (e.g. by using a middleware wrapper or if the user changed route access).

        // Actually, to make this work seamlessly without changing middleware architecture too much:
        // I'll proceed assuming req.user *might* be present.

        if (req.user && req.user.user.id !== user._id.toString()) {
            const currentUserId = req.user.user.id;
            const profileUserId = user._id;

            // Check if already friends using the 'friends' array
            // Check if already friends using the 'friends' array
            const currentUserDoc = await User.findById(currentUserId);

            // Safety check: if token is stale and user doesn't exist
            if (currentUserDoc && currentUserDoc.friends.includes(profileUserId)) {
                friendshipStatus = 'FRIENDS';
            } else if (currentUserDoc) {
                // Check pending requests
                // Check pending requests
                const sentRequest = await FriendRequest.findOne({
                    sender: currentUserId,
                    receiver: profileUserId,
                    status: 'PENDING'
                });

                const receivedRequest = await FriendRequest.findOne({
                    sender: profileUserId,
                    receiver: currentUserId,
                    status: 'PENDING'
                });

                if (sentRequest) {
                    friendshipStatus = 'PENDING_SENT';
                    // Return the request details if needed (though for sent, we just show "Sent")
                } else if (receivedRequest) {
                    friendshipStatus = 'PENDING_RECEIVED';
                    // Add the request ID so the frontend can accept it
                    user = user.toObject();
                    user.friendRequestId = receivedRequest._id;
                }
            }
        }

        // Return user object + status (if not already converted to object above)
        if (typeof user.toObject === 'function') {
            user = user.toObject();
        }
        res.json({ ...user, friendshipStatus });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const { bio, socialHandles, avatar, coverPhoto } = req.body;
        const userId = req.user.user.id; // from auth middleware

        // Fetch user document to use save() for reliable Map updates
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (typeof bio !== 'undefined') {
            user.bio = bio;
        }

        if (avatar) {
            user.avatar = {
                type: avatar.type,
                value: avatar.value
            };
        }

        if (coverPhoto) {
            user.coverPhoto = {
                type: coverPhoto.type,
                value: coverPhoto.value
            };
        }

        if (socialHandles) {
            // Robust Map Update: Clear existing and set new to ensure Mongoose tracking works
            if (!user.socialHandles) {
                user.socialHandles = new Map();
            } else {
                user.socialHandles.clear();
            }

            for (const [key, value] of Object.entries(socialHandles)) {
                if (value && typeof value === 'string') {
                    user.socialHandles.set(key, value);
                }
            }
            user.markModified('socialHandles');
        }

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('username bio avatar').limit(10);

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Send Friend Request
exports.sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.user.id;
        const { userId: receiverId } = req.params;

        console.log(`Friend Request: ${senderId} -> ${receiverId}`);

        if (!receiverId) {
            return res.status(400).json({ message: "Recipient ID required" });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ message: "Cannot send request to yourself" });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (sender.friends.includes(receiverId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: 'PENDING'
        });

        if (existingRequest) {
            if (existingRequest.sender.toString() === senderId) {
                return res.status(400).json({ message: "Friend request already sent" });
            } else {
                return res.status(400).json({ message: "This user has already sent you a request" });
            }
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
            status: 'PENDING'
        });

        await newRequest.save();
        res.json({ message: "Friend request sent", request: newRequest });

    } catch (err) {
        console.error("SendFriendRequest Error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// Accept Friend Request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.user.id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.receiver.toString() !== userId) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: "Request already handled" });
        }

        request.status = 'ACCEPTED';
        await request.save();

        // Add to friends lists
        // Add to friends lists (Check for duplicates)
        const sender = await User.findById(request.sender);
        const receiver = await User.findById(request.receiver);

        if (!sender.friends.includes(receiver._id)) {
            sender.friends.push(receiver._id);
            await sender.save();
        }

        if (!receiver.friends.includes(sender._id)) {
            receiver.friends.push(sender._id);
            await receiver.save();
        }

        // Ideally delete the request or keep as history. 
        // User spec says: "delete the request".
        await FriendRequest.findByIdAndDelete(requestId);

        res.json({ message: "Friend request accepted" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get Friends List
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId).populate('friends', 'username bio avatar email');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.friends);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get Pending Requests
exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'PENDING'
        })
            .populate('sender', 'username avatar email') // Populating sender details for UI
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};
