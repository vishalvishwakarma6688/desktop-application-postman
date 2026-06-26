export const getResetPasswordEmailTemplate = (resetUrl) => {
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
            <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #f97316; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">DataCourier</h1>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 5px; font-weight: 500;">Password Reset Request</p>
                </div>
                
                <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 20px; font-weight: 700;">Reset Your Password</h2>
                
                <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">
                    We received a request to reset the password for your DataCourier account. Click the button below to set up a new password. If you didn't make this request, you can safely ignore this email.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(249,115,22,0.15);">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 24px;">
                    This reset link will expire in **1 hour**. If the button doesn't work, copy and paste this URL into your web browser:
                </p>
                <p style="color: #9ca3af; font-size: 12px; word-break: break-all; font-family: monospace; background-color: #f3f4f6; padding: 10px; border-radius: 6px;">
                    ${resetUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; font-weight: 500;">
                    DataCourier API Platform
                </p>
            </div>
        </div>
    `;
};
