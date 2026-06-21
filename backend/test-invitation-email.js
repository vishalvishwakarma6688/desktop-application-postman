import dotenv from 'dotenv';
dotenv.config();

import { sendCollaborationInvitation } from './src/services/emailService.js';

console.log('🧪 Testing Collaboration Invitation Email\n');

// Test data
const testData = {
    to: process.env.EMAIL_USER, // Send to yourself for testing
    inviterName: 'Test User',
    workspaceName: 'Test Workspace',
    role: 'editor',
    invitationUrl: 'http://localhost:5174/invite/test-token-12345',
    message: 'This is a test invitation to verify email functionality.'
};

console.log('Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n');

// Send test email
sendCollaborationInvitation(testData)
    .then(() => {
        console.log('\n✅ Test PASSED - Invitation email sent successfully!');
        console.log('Check your inbox at:', testData.to);
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test FAILED - Error sending invitation email');
        console.error('Error details:', error);
        process.exit(1);
    });
