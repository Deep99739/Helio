const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Verify connection configuration
    try {
        await transporter.verify();
        logger.info('SMTP Connection established successfully.');
    } catch (error) {
        logger.error(`SMTP Connection Failed: ${error.message}`);
    }

    const message = {
        from: `Helio App <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(message);
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Email send failed: ${error.message}`);
        throw error;
    }
};

module.exports = sendEmail;
