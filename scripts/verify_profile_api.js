const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyProfile() {
    try {
        const username = `TestUser_${Date.now()}`;
        const email = `test_${Date.now()}@example.com`;
        const password = 'Password123!';

        // 1. Register
        console.log(`1. Registering user: ${username}`);
        await axios.post(`${API_URL}/auth/register`, { username, email, password });
        console.log('   Registration successful');

        // 2. Login
        console.log('2. Logging in');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        console.log('   Login successful');

        // 3. Get Profile (Public)
        console.log('3. Fetching profile (GET)');
        const getRes = await axios.get(`${API_URL}/users/${username}`);
        console.log('   Fetch successful. Current Bio:', getRes.data.bio);

        // 4. Update Profile (Private)
        console.log('4. Updating profile (PUT)');
        const updateData = {
            bio: 'I am a verified user.',
            socialHandles: {
                github: 'https://github.com/testuser',
                twitter: 'https://twitter.com/testuser'
            }
        };

        await axios.put(
            `${API_URL}/users/profile`,
            updateData,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('   Update successful');

        // 5. Verify Update
        console.log('5. Verifying update (GET)');
        const verifyRes = await axios.get(`${API_URL}/users/${username}`);

        if (verifyRes.data.bio === updateData.bio &&
            verifyRes.data.socialHandles.github === updateData.socialHandles.github) {
            console.log('   SUCCESS: Profile updated and verified!');
        } else {
            console.error('   FAILURE: Profile data mismatch', verifyRes.data);
        }

    } catch (error) {
        console.error('ERROR OBJECT:', error);
        console.error('ERROR RESPONSE:', error.response ? error.response.data : 'No response data');
        console.error('ERROR MESSAGE:', error.message);
    }
}

verifyProfile();
