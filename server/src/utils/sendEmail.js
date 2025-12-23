const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    // Create transporter with connection pooling to manage connections more efficiently
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        pool: true, // Use pooled connections
        maxConnections: 1, // Limit distinct connections to avoid aggressive blocking
        rateLimit: 5, // Limit messages per second
        tls: {
            rejectUnauthorized: false // Skip strict certificate validation
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000
    });

    const message = {
        from: `Helio App <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    // Retry Logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const info = await transporter.sendMail(message);
            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            attempts++;
            logger.error(`Email send attempt ${attempts} failed: ${error.message}`);

            if (attempts >= maxAttempts) {
                // Return valuable feedback instead of just crashing
                logger.error("All email retry attempts failed.");
                throw error;
            }

            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = sendEmail;
