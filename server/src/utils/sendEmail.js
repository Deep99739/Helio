const { Resend } = require('resend');
const logger = require('./logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    const { to, subject, html } = options;

    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev', // Default for free tier. Verify domain to use custom.
            to: to,
            subject: subject,
            html: html
        });

        logger.info(`Email sent successfully: ${data.id}`);
        return data;
    } catch (error) {
        logger.error(`Resend Email Error: ${error.message}`);
        throw error;
    }
};

module.exports = sendEmail;
