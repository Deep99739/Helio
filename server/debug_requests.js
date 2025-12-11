const mongoose = require('mongoose');
const User = require('./models/User');
const FriendRequest = require('./models/FriendRequest');
require('dotenv').config({ path: './.env' });

// Secrets from server/index.js if .env fails
const MONGO_URI = process.env.MONGO_URI || 'REDACTED_SECRET';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");

        console.log("--- USERS ---");
        const users = await User.find({ email: { $in: ['admin01@gmail.com', 'admin02@gmail.com'] } });
        users.forEach(u => console.log(`${u.username} (${u.email}) ID: ${u._id}`));

        const ids = users.map(u => u._id);

        console.log("\n--- FRIEND REQUESTS (All) ---");
        const allRequests = await FriendRequest.find({});
        console.log(`Total Requests: ${allRequests.length}`);

        console.log("\n--- RELEVANT REQUESTS ---");
        const relevant = await FriendRequest.find({
            $or: [
                { sender: { $in: ids } },
                { receiver: { $in: ids } }
            ]
        });

        relevant.forEach(r => {
            console.log(`Request ${r._id}: ${r.sender} -> ${r.receiver} [${r.status}]`);
        });

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
