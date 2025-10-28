/**
 * Email Test Script
 * Tests if Resend email sending works
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(process.cwd(), '.env') });

import { sendVerificationEmail } from '@/lib/email/send';
import { generateEmailVerificationURL } from '@/lib/email-verification';

async function testEmailSending() {
  console.log('=== EMAIL SENDING TEST ===');
  console.log('');

  // 1. Check environment variables
  console.log('1. Checking environment variables...');
  console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('   RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Using default');
  console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
  console.log('');

  // 2. Generate verification URL
  console.log('2. Generating verification URL...');
  const testEmail = 'hugala1223@wegwerfemail.com';
  try {
    const verificationURL = await generateEmailVerificationURL(testEmail, 'de');
    console.log('   ✓ URL generated:', verificationURL);
    console.log('');

    // 3. Send email
    console.log('3. Sending verification email...');
    const result = await sendVerificationEmail(testEmail, verificationURL, 'de');

    if (result.success) {
      console.log('   ✓ Email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.log('   ✗ Email sending failed!');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('   ✗ Exception occurred!');
    console.log('   Error:', error instanceof Error ? error.message : String(error));
  }

  console.log('');
  console.log('=== TEST COMPLETE ===');
}

testEmailSending();
