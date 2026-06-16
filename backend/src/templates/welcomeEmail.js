export const getWelcomeEmailTemplate = (userName) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DataCourier</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333333;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            padding: 48px 40px;
            text-align: center;
        }
        .logo-text {
            font-size: 36px;
            font-weight: 700;
            color: white;
            letter-spacing: -0.5px;
            margin-bottom: 16px;
        }
        .header-subtitle {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 400;
            margin: 0;
        }
        .content {
            padding: 48px 40px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 24px;
        }
        .message {
            font-size: 16px;
            line-height: 1.7;
            color: #4b5563;
            margin-bottom: 24px;
        }
        .message strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        .info-box {
            background-color: #fef3f2;
            border-left: 4px solid #f97316;
            border-radius: 6px;
            padding: 24px;
            margin: 32px 0;
        }
        .info-box-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 0;
            margin-bottom: 12px;
        }
        .info-box-text {
            font-size: 15px;
            line-height: 1.6;
            color: #4b5563;
            margin: 0;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 32px 0;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(249, 115, 22, 0.3);
        }
        .resources {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 28px;
            margin: 32px 0;
        }
        .resources-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .resource-link {
            display: block;
            color: #f97316;
            text-decoration: none;
            padding: 10px 0;
            font-size: 15px;
            font-weight: 500;
            border-bottom: 1px solid #e5e7eb;
        }
        .resource-link:last-child {
            border-bottom: none;
        }
        .resource-link:hover {
            color: #ea580c;
        }
        .support-section {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
        }
        .support-text {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 12px;
        }
        .support-email {
            color: #f97316;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
        }
        .support-email:hover {
            color: #ea580c;
        }
        .footer {
            background-color: #f9fafb;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
            line-height: 1.6;
        }
        .footer-links {
            margin: 20px 0;
        }
        .footer-link {
            display: inline-block;
            margin: 0 12px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        .footer-link:hover {
            color: #f97316;
        }
        .footer-separator {
            color: #d1d5db;
            margin: 0 4px;
        }
        .signature {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 600;
            margin-top: 24px;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 32px 24px;
            }
            .header {
                padding: 36px 24px;
            }
            .greeting {
                font-size: 20px;
            }
            .logo-text {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-text">DataCourier</div>
            <p class="header-subtitle">Professional API Testing Platform</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Welcome, ${userName}</div>
            
            <p class="message">
                Thank you for creating your DataCourier account. We're pleased to have you join our platform dedicated to streamlined API development and testing.
            </p>

            <p class="message">
                DataCourier provides you with comprehensive tools for testing REST APIs, managing request collections, handling environment variables, and maintaining detailed request histories—all within a native desktop application designed for professional developers.
            </p>

            <div class="info-box">
                <h3 class="info-box-title">Getting Started</h3>
                <p class="info-box-text">
                    Your account is now active. Launch the DataCourier desktop application to begin creating workspaces, organizing your API collections, and testing endpoints. Our platform is designed to integrate seamlessly into your development workflow.
                </p>
            </div>

            <div class="cta-section">
                <a href="#" class="cta-button">Open DataCourier</a>
            </div>

            <div class="resources">
                <h3 class="resources-title">Resources</h3>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman" class="resource-link">Documentation</a>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman/releases" class="resource-link">Latest Downloads</a>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman/issues" class="resource-link">Support & Community</a>
            </div>

            <div class="support-section">
                <p class="support-text">Need assistance or have questions?</p>
                <a href="mailto:datacourier.support@gmail.com" class="support-email">datacourier.support@gmail.com</a>
            </div>

            <p class="message">
                We're committed to providing you with reliable tools for API development and testing.
            </p>

            <p class="signature">
                Best regards,<br>
                The DataCourier Team
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                <strong>DataCourier</strong> — Professional API Testing Platform
            </div>
            
            <div class="footer-links">
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman" class="footer-link">GitHub</a>
                <span class="footer-separator">•</span>
                <a href="mailto:datacourier.support@gmail.com" class="footer-link">Support</a>
            </div>

            <div class="footer-text" style="font-size: 13px; margin-top: 24px; color: #9ca3af;">
                You received this email because you created an account with DataCourier.<br>
                © ${new Date().getFullYear()} DataCourier. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
