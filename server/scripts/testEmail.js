require('dotenv').config({ path: '.env' });
const sendEmail = require('../src/utils/sendEmail');
const mongoose = require('mongoose');

// Mock logger if needed or ensure logger handles standalone execution
// Assuming logger uses console in dev/default

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log(`User: ${process.env.EMAIL_USER}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Missing credentials in .env');
        process.exit(1);
    }

    try {
        await sendEmail({
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Helio Email Config Test',
            html: '<h1>Success!</h1><p>Your email configuration is working correctly.</p>'
        });
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }
}

testEmail();
