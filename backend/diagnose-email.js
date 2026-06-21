import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 first
dns.setDefaultResultOrder('ipv4first');

console.log('🔍 EMAIL CONFIGURATION DIAGNOSTICS\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n1. ENVIRONMENT VARIABLES CHECK:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ NOT SET');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ NOT SET');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com (default)');
console.log('   EMAIL_PORT:', '587 (STARTTLS - recommended)');
console.log('   DNS ORDER:', 'IPv4 first (forced to avoid IPv6 issues)');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('\n❌ ERROR: EMAIL_USER or EMAIL_PASS is not set in .env file');
    console.log('\nPlease ensure your .env file contains:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
    console.log('\n⚠️  For Gmail, you need an App Password:');
    console.log('   1. Go to https://myaccount.google.com/security');
    console.log('   2. Enable 2-Step Verification');
    console.log('   3. Go to App Passwords');
    console.log('   4. Generate a new app password');
    console.log('   5. Use that password in EMAIL_PASS');
    process.exit(1);
}

// Create transporter
console.log('\n2. CREATING EMAIL TRANSPORTER:');
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true,
    logger: true
});

console.log('   ✅ Transporter created (Port 587 with STARTTLS, IPv4 only)');

// Verify connection
console.log('\n3. VERIFYING SMTP CONNECTION:');
transporter.verify()
    .then(() => {
        console.log('   ✅ SMTP connection verified successfully');
        console.log('   ✅ Email server is ready to send messages\n');

        // Try sending a test email
        console.log('4. SENDING TEST EMAIL:');
        const mailOptions = {
            from: {
                name: 'DataCourier',
                address: process.env.EMAIL_USER
            },
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'DataCourier - Email Diagnostic Test',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f97316;">✅ Email System Working!</h2>
                    <p>If you're reading this, your email configuration is working correctly.</p>
                    <p><strong>Configuration Details:</strong></p>
                    <ul>
                        <li>Host: smtp.gmail.com</li>
                        <li>Port: 465</li>
                        <li>From: ${process.env.EMAIL_USER}</li>
                    </ul>
                    <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toLocaleString()}</p>
                </div>
            `
        };

        return transporter.sendMail(mailOptions);
    })
    .then((info) => {
        console.log('   ✅ TEST EMAIL SENT SUCCESSFULLY!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL CHECKS PASSED - Email system is working!');
        console.log('Check your inbox at:', process.env.EMAIL_USER);
        console.log('='.repeat(50) + '\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ ERROR OCCURRED:');
        console.error('   Error Type:', error.name);
        console.error('   Error Message:', error.message);
        console.error('   Error Code:', error.code);

        if (error.code === 'EAUTH') {
            console.error('\n⚠️  AUTHENTICATION FAILED:');
            console.error('   - Check that EMAIL_USER is correct');
            console.error('   - For Gmail, you MUST use an App Password, not your regular password');
            console.error('   - Generate an App Password at: https://myaccount.google.com/apppasswords');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.error('\n⚠️  CONNECTION FAILED:');
            console.error('   - Check your internet connection');
            console.error('   - Check if your firewall is blocking port 465');
            console.error('   - Try using port 587 with TLS instead');
        }

        console.error('\nFull error details:', error);
        process.exit(1);
    });
