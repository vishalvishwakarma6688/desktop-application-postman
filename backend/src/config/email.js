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
console.log('   HOST:', 'smtp.gmail.com');
console.log('   PORT:', 587, '(STARTTLS)');
console.log('   USER:', process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET');
console.log('   PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('   DNS:', 'IPv4 only (forced)');
console.log('   TLS:', 'Required');
console.log('   IPv6:', 'Disabled');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env file');
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Changed to 587 with STARTTLS - more reliable than 465
    secure: false, // false for 587, use STARTTLS
    requireTLS: true, // Force TLS upgrade
    family: 4, // Force IPv4 - critical for avoiding ENETUNREACH errors
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    pool: true, // Use pooled connections
    maxConnections: 3, // Reduced from 5 to avoid connection issues
    maxMessages: 100, // Maximum messages per connection
    rateDelta: 1000, // Minimum time between messages
    rateLimit: 5, // Maximum messages per rateDelta
    connectionTimeout: 15000, // 15 seconds connection timeout (increased)
    greetingTimeout: 15000, // 15 seconds greeting timeout
    socketTimeout: 45000, // 45 seconds socket timeout (increased)
    debug: true, // Enable debug output
    logger: true // Log information to console
});

// Verify transporter configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Email transporter verification failed:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
        console.log('✅ Connection pooling enabled');
    }
});

export default transporter;