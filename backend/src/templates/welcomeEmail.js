export const getWelcomeEmailTemplate = (userName) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to APIFlow</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f0f0f;
            color: #e5e5e5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 50px;
            height: 50px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: white;
        }
        .logo-text {
            font-size: 32px;
            font-weight: bold;
            color: white;
            letter-spacing: -0.5px;
        }
        .header h1 {
            margin: 0;
            color: white;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            background-color: #1a1a1a;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #d1d5db;
            margin-bottom: 20px;
        }
        .features {
            background-color: #262626;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border-left: 4px solid #f97316;
        }
        .features h2 {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 12px;
            background-color: #1a1a1a;
            border-radius: 8px;
        }
        .feature-item:last-child {
            margin-bottom: 0;
        }
        .feature-icon {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            font-size: 14px;
        }
        .feature-text {
            flex: 1;
        }
        .feature-title {
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 4px;
        }
        .feature-description {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.5;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
        }
        .quick-links {
            background-color: #262626;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }
        .quick-links h3 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .quick-link {
            display: block;
            color: #f97316;
            text-decoration: none;
            padding: 8px 0;
            font-size: 14px;
        }
        .quick-link:hover {
            text-decoration: underline;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #262626;
        }
        .footer-text {
            font-size: 14px;
            color: #9ca3af;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #9ca3af;
            text-decoration: none;
            font-size: 14px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #f97316, transparent);
            margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .features {
                padding: 20px;
            }
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div style="text-align: center;">
                <div style="display: inline-block; background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 12px; line-height: 60px; font-size: 32px; font-weight: bold; margin-bottom: 15px;">
                    A
                </div>
                <div class="logo-text">APIFlow</div>
            </div>
            <h1>Welcome to the Future of API Testing! 🚀</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hi ${userName}! 👋</div>
            
            <p class="message">
                Thank you for joining <strong>APIFlow</strong>! We're thrilled to have you as part of our community. 
                You now have access to a powerful, free, and open-source API testing platform designed specifically for developers like you.
            </p>

            <p class="message">
                Whether you're building REST APIs, testing webhooks, or exploring GraphQL endpoints, APIFlow has everything you need to streamline your workflow.
            </p>

            <div class="divider"></div>

            <!-- Features Section -->
            <div class="features">
                <h2>✨ What You Can Do with APIFlow</h2>
                
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">
                        <div class="feature-title">Powerful Request Builder</div>
                        <div class="feature-description">Send HTTP requests with custom headers, body, authentication, and more</div>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">📁</div>
                    <div class="feature-text">
                        <div class="feature-title">Collections & Workspaces</div>
                        <div class="feature-description">Organize your APIs into collections and workspaces for better project management</div>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-text">
                        <div class="feature-title">Environment Variables</div>
                        <div class="feature-description">Manage different environments (dev, staging, production) with ease</div>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-text">
                        <div class="feature-title">AI-Powered Assistant</div>
                        <div class="feature-description">Get intelligent API insights, generate test cases, and debug responses with AI</div>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">
                        <div class="feature-title">Request History</div>
                        <div class="feature-description">Track all your API calls with detailed history and easy replay functionality</div>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-text">
                        <div class="feature-title">Fast & Lightweight</div>
                        <div class="feature-description">Native desktop application built with Electron for maximum performance</div>
                    </div>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="quick-links">
                <h3>🔗 Quick Links to Get Started</h3>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman" class="quick-link">📖 Documentation & Guides</a>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman/issues" class="quick-link">💬 Community & Support</a>
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman/releases" class="quick-link">📥 Latest Downloads</a>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="cta-button">Launch APIFlow Desktop</a>
            </div>

            <div class="divider"></div>

            <p class="message">
                <strong>Need Help?</strong><br>
                If you have any questions or feedback, feel free to reach out to us at 
                <a href="mailto:apiflow.support@gmail.com" style="color: #f97316;">apiflow.support@gmail.com</a>
            </p>

            <p class="message">
                Happy Testing! 🎉<br>
                <strong>The APIFlow Team</strong>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                <strong>APIFlow</strong> - A powerful, free, and open-source API testing tool for developers
            </div>
            
            <div class="social-links">
                <a href="https://github.com/vishalvishwakarma6688/desktop-application-postman" class="social-link">GitHub</a>
                <span style="color: #4b5563;">•</span>
                <a href="mailto:apiflow.support@gmail.com" class="social-link">Support</a>
            </div>

            <div class="footer-text" style="font-size: 12px; margin-top: 20px;">
                You're receiving this email because you created an account on APIFlow.<br>
                © ${new Date().getFullYear()} APIFlow. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
