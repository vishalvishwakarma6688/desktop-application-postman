import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { setDefaultAutoSelectFamily } from 'net';

dotenv.config();

// Force DNS to resolve to IPv4 only to prevent ENETUNREACH errors
dns.setDefaultResultOrder('ipv4first');

// Disable Happy Eyeballs Algorithm (prevents IPv6 fallback attempts)
try {
    setDefaultAutoSelectFamily(false);
} catch (e) {
    console.log('   ⚠️  Could not disable auto-select family (Node.js < 19)');
}

console.log('📧 Email Configuration:');
console.log('   HOST:', '64.233.184.109 (Gmail IPv4 - bypassing DNS)');
console.log('   SERVERNAME:', 'smtp.gmail.com');
console.log('   PORT:', 587, '(STARTTLS)');
console.log('   USER:', process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET');
console.log('   PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('   DNS:', 'BYPASSED - Using direct IPv4 address');
console.log('   TLS:', 'Required');
console.log('   IPv6:', 'IMPOSSIBLE - Direct IPv4 connection');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env file');
}

const transporter = nodemailer.createTransport({
    host: '64.233.184.109', // Gmail's IPv4 SMTP server (bypasses DNS to force IPv4)
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4, // Force IPv4
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 45000,
    tls: {
        // Don't fail on hostname mismatch since we're using IP address
        servername: 'smtp.gmail.com',
        rejectUnauthorized: true
    },
    debug: true,
    logger: true
});

// Verify transporter configuration on startup
transporter.isEmailAvailable = false;

if (process.env.RESEND_API_KEY) {
    console.log('✅ Email service: Resend API is configured (RESEND_API_KEY)');
    transporter.isEmailAvailable = true;
} else if (process.env.BREVO_API_KEY) {
    console.log('✅ Email service: Brevo API is configured (BREVO_API_KEY)');
    transporter.isEmailAvailable = true;
} else {
    transporter.verify(function (error, success) {
        if (error) {
            console.error('❌ Email transporter verification failed:', error.message);
            transporter.isEmailAvailable = false;
        } else {
            console.log('✅ Email server is ready to send messages');
            console.log('✅ Connection pooling enabled');
            transporter.isEmailAvailable = true;
        }
    });
}

export default transporter;