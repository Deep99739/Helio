const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    // Use standard Gmail SMTP with explicit STARTTLS (Port 587)
    // Disabled pooling to prevent stale connection timeouts
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Must be false for port 587
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // Bypass strict certificate checks
        },
        logger: true,
        debug: true
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
