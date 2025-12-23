const SibApiV3Sdk = require('sib-api-v3-sdk');
const logger = require('./logger');

// Configure API key authorization: api-key
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (options) => {
    // Basic validation to ensure we have a sender
    const senderEmail = process.env.EMAIL_USER;
    if (!senderEmail) {
        const err = new Error("EMAIL_USER env var is missing. Brevo requires a sender.");
        logger.error(err.message);
        throw err;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    // Sender must be the verified email in your Brevo account
    sendSmtpEmail.sender = { "name": "Helio App", "email": senderEmail };
    sendSmtpEmail.to = [{ "email": options.to }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        logger.info(`Brevo Email sent successfully. MessageId: ${data.messageId}`);
        return data;
    } catch (error) {
        logger.error(`Brevo Email Failed: ${error}`);
        // Log detailed error from Brevo if available
        if (error.response && error.response.text) {
            logger.error(`Brevo Response: ${error.response.text}`);
        }
        throw error;
    }
};

module.exports = sendEmail;
