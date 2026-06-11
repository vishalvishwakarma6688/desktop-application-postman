import dotenv from 'dotenv';
import { sendTestEmail, sendWelcomeEmail } from './src/services/emailService.js';

dotenv.config();

async function testEmailSetup() {
    console.log('\n=== Email Configuration Test ===\n');

    console.log('Email User:', process.env.EMAIL_USER || '❌ NOT SET');
    console.log('Email Pass:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('\n❌ Email credentials not configured in .env file');
        process.exit(1);
    }

    console.log('\n--- Test 1: Sending test email ---');
    try {
        await sendTestEmail(process.env.EMAIL_USER);
        console.log('✅ Test email sent successfully!\n');
    } catch (error) {
        console.error('❌ Test email failed:', error.message);
        process.exit(1);
    }

    console.log('--- Test 2: Sending welcome email ---');
    try {
        await sendWelcomeEmail(process.env.EMAIL_USER, 'Test User');
        console.log('✅ Welcome email sent successfully!\n');
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
        process.exit(1);
    }

    console.log('=== All email tests passed! ===\n');
    process.exit(0);
}

testEmailSetup();
