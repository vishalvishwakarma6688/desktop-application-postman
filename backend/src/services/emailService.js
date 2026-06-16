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
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to: userEmail,
            subject: 'Welcome to DataCourier - Let\'s Get Started!',
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
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to: testEmail,
            subject: 'DataCourier - Email Configuration Test',
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

/**
 * Send collaboration invitation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.inviterName - Name of the person sending the invitation
 * @param {string} options.workspaceName - Name of the workspace
 * @param {string} options.role - Role being offered (viewer, editor, admin)
 * @param {string} options.invitationUrl - URL to accept the invitation
 * @param {string} [options.message] - Optional personal message from inviter
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export const sendCollaborationInvitation = async ({ to, inviterName, workspaceName, role, invitationUrl, message }) => {
    try {
        const roleDescriptions = {
            viewer: 'view requests and collections',
            editor: 'view and edit requests and collections',
            admin: 'manage the workspace and its members'
        };

        const mailOptions = {
            from: {
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to,
            subject: `${inviterName} invited you to collaborate on ${workspaceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #f97316; margin: 0;">DataCourier</h1>
                            <p style="color: #666; font-size: 14px; margin-top: 5px;">Collaboration Invitation</p>
                        </div>
                        
                        <h2 style="color: #1f2937; margin-bottom: 20px;">You've been invited!</h2>
                        
                        <p style="color: #4b5563; line-height: 1.6;">
                            <strong>${inviterName}</strong> has invited you to collaborate on the workspace 
                            <strong style="color: #f97316;">${workspaceName}</strong>.
                        </p>
                        
                        ${message ? `
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e; font-style: italic;">"${message}"</p>
                        </div>
                        ` : ''}
                        
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0; color: #4b5563;">
                                <strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}
                            </p>
                            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                                You'll be able to ${roleDescriptions[role]}.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${invitationUrl}" 
                               style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                                Accept Invitation
                            </a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 20px;">
                            This invitation will expire in 7 days. If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
                            ${invitationUrl}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Collaboration invitation sent to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending collaboration invitation to ${to}:`, error.message);
        throw error;
    }
};
