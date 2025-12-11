const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

// Hardcode URI if needed since we are running from root
const MONGO_URI = process.env.MONGO_URI || 'REDACTED_SECRET';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- Username: '${u.username}' (Email: ${u.email})`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
