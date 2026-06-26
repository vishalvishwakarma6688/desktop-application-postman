import transporter from '../config/email.js';
import { getWelcomeEmailTemplate } from '../templates/welcomeEmail.js';
import { getResetPasswordEmailTemplate } from '../templates/resetPasswordEmail.js';
import axios from 'axios';

/**
 * Send email using Brevo API over HTTPS (port 443)
 */
const sendEmailViaBrevo = async ({ to, subject, html }) => {
    const fromName = 'DataCourier';
    const fromEmail = process.env.EMAIL_USER || 'datacourier.support@gmail.com';
    
    console.log(`   📤 Sending email via Brevo API from ${fromName} <${fromEmail}> to ${to}...`);
    
    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: {
                name: fromName,
                email: fromEmail
            },
            to: [{
                email: to
            }],
            subject: subject,
            htmlContent: html
        }, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   ✅ Brevo API response:', response.data);
        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('   ❌ Brevo API sending failed:', errorMsg, error.response?.data || '');
        throw new Error(`Brevo email sending failed: ${errorMsg}`);
    }
};

/**
 * Send welcome email to newly registered user
 * @param {string} userEmail - The email address of the new user
 * @param {string} userName - The name of the new user
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
    console.log('\n📧 ===== SENDING WELCOME EMAIL =====');
    console.log('   To:', userEmail);
    console.log('   Name:', userName);

    if (!transporter.isEmailAvailable) {
        console.warn('   ⚠️ Skipping welcome email: SMTP server is offline or ports are blocked.');
        console.log('===== EMAIL SEND SKIPPED =====\n');
        return false;
    }

    try {
        const subject = 'Welcome to DataCourier - Let\'s Get Started!';
        const html = getWelcomeEmailTemplate(userName);

        if (process.env.BREVO_API_KEY) {
            await sendEmailViaBrevo({ to: userEmail, subject, html });
            console.log(`   ✅ SUCCESS! Welcome email sent to ${userEmail} via Brevo`);
            console.log('===== EMAIL SEND COMPLETE =====\n');
            return true;
        }

        const mailOptions = {
            from: {
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to: userEmail,
            subject,
            html
        };

        console.log('   📤 Attempting to send email via SMTP...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`   ✅ SUCCESS! Welcome email sent to ${userEmail}`);
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('===== EMAIL SEND COMPLETE =====\n');
        return true;
    } catch (error) {
        console.error('\n   ❌ ERROR SENDING WELCOME EMAIL');
        console.error('   To:', userEmail);
        console.error('   Error Type:', error.name);
        console.error('   Error Message:', error.message);
        console.error('   Error Code:', error.code);
        console.error('   Full Error:', error);
        console.error('===== EMAIL SEND FAILED =====\n');
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
    console.log('\n📧 ===== SENDING COLLABORATION INVITATION EMAIL =====');
    console.log('   To:', to);
    console.log('   Inviter:', inviterName);
    console.log('   Workspace:', workspaceName);
    console.log('   Role:', role);
    console.log('   Invitation URL:', invitationUrl);
    console.log('   Has Message:', !!message);

    if (!transporter.isEmailAvailable) {
        console.warn('   ⚠️ Skipping invitation email: SMTP server is offline or ports are blocked.');
        console.log('===== EMAIL SEND SKIPPED =====\n');
        throw new Error('SMTP server is unreachable or ports are blocked by hosting provider');
    }

    const roleDescriptions = {
        viewer: 'view requests and collections',
        editor: 'view and edit requests and collections',
        admin: 'manage the workspace and its members'
    };

    const subject = `${inviterName} invited you to collaborate on ${workspaceName}`;
    const html = `
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
    `;

    if (process.env.BREVO_API_KEY) {
        await sendEmailViaBrevo({ to, subject, html });
        console.log(`   ✅ SUCCESS! Collaboration invitation sent to ${to} via Brevo`);
        console.log('===== EMAIL SEND COMPLETE =====\n');
        return true;
    }

    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`   🔄 Retry attempt ${attempt}/${maxRetries}`);
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }

            const mailOptions = {
                from: {
                    name: 'DataCourier',
                    address: process.env.EMAIL_USER
                },
                to,
                subject,
                html
            };

            console.log('   📤 Attempting to send email via SMTP...');
            const info = await transporter.sendMail(mailOptions);
            console.log(`   ✅ SUCCESS! Collaboration invitation sent to ${to}`);
            console.log('   Message ID:', info.messageId);
            console.log('   Response:', info.response);
            console.log('   Accepted:', info.accepted);
            console.log('   Rejected:', info.rejected);
            console.log('===== EMAIL SEND COMPLETE =====\n');
            return true;
        } catch (error) {
            lastError = error;
            console.error(`\n   ❌ Attempt ${attempt}/${maxRetries} FAILED`);
            console.error('   Error Type:', error.name);
            console.error('   Error Message:', error.message);
            console.error('   Error Code:', error.code);

            if (attempt === maxRetries) {
                console.error('\n   ❌ ALL RETRY ATTEMPTS EXHAUSTED');
                console.error('   To:', to);
                console.error('   Error Command:', error.command);
                console.error('   Full Error:', error);
                console.error('===== EMAIL SEND FAILED =====\n');
            }
        }
    }

    throw lastError;
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export const sendResetPasswordEmail = async (email, resetUrl) => {
    console.log('\n📧 ===== SENDING PASSWORD RESET EMAIL =====');
    console.log('   To:', email);
    console.log('   Reset URL:', resetUrl);

    if (!transporter.isEmailAvailable) {
        console.warn('   ⚠️ Skipping reset email: SMTP/Brevo is offline or ports are blocked.');
        console.log('===== EMAIL SEND SKIPPED =====\n');
        throw new Error('Email service is currently offline or unreachable.');
    }

    try {
        const subject = 'Reset Your DataCourier Password';
        const html = getResetPasswordEmailTemplate(resetUrl);

        if (process.env.BREVO_API_KEY) {
            await sendEmailViaBrevo({ to: email, subject, html });
            console.log(`   ✅ SUCCESS! Password reset email sent to ${email} via Brevo`);
            console.log('===== EMAIL SEND COMPLETE =====\n');
            return true;
        }

        const mailOptions = {
            from: {
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject,
            html
        };

        console.log('   📤 Attempting to send email via SMTP...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`   ✅ SUCCESS! Password reset email sent to ${email}`);
        console.log('   Message ID:', info.messageId);
        console.log('===== EMAIL SEND COMPLETE =====\n');
        return true;
    } catch (error) {
        console.error('\n   ❌ ERROR SENDING PASSWORD RESET EMAIL');
        console.error('   To:', email);
        console.error('   Error Message:', error.message);
        console.error('===== EMAIL SEND FAILED =====\n');
        throw error;
    }
};
