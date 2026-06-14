import transporter from '../config/email.js';
import { getWelcomeEmailTemplate } from '../templates/welcomeEmail.js';

/**
 * Send welcome email to newly registered user
 * @param {string} userEmail - The email address of the new user
 * @param {string} userName - The name of the new user
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
    try {
        const mailOptions = {
            from: {
                name: 'APIFlow',
                address: process.env.EMAIL_USER
            },
            to: userEmail,
            subject: 'Welcome to APIFlow - Let\'s Get Started!',
            html: getWelcomeEmailTemplate(userName)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${userEmail}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending welcome email to ${userEmail}:`, error.message);
        // Don't throw error - we don't want registration to fail if email fails
        return false;
    }
};

/**
 * Send test email to verify email configuration
 * @param {string} testEmail - Email address to send test email to
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export const sendTestEmail = async (testEmail) => {
    try {
        const mailOptions = {
            from: {
                name: 'APIFlow',
                address: process.env.EMAIL_USER
            },
            to: testEmail,
            subject: 'APIFlow - Email Configuration Test',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f97316;">Email Configuration Test</h2>
                    <p>If you're seeing this, your email configuration is working correctly!</p>
                    <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toLocaleString()}</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Test email sent to ${testEmail}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending test email:`, error.message);
        throw error;
    }
};
