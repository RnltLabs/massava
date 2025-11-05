/**
 * Script to check email verification tokens
 * Usage: npx tsx scripts/check-verification-token.ts <email>
 */

import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

async function checkVerificationToken(email: string) {
  console.log(`\n🔍 Checking verification tokens for: ${email}\n`);

  try {
    // Check EmailVerificationToken
    const tokens = await prisma.emailVerificationToken.findMany({
      where: { email },
      orderBy: { expiresAt: 'desc' },
      take: 5,
    });

    if (tokens.length > 0) {
      console.log(`✅ Found ${tokens.length} verification token(s):\n`);
      tokens.forEach((token, index) => {
        const isExpired = token.expiresAt < new Date();
        const isUsed = token.used;
        console.log(`Token #${index + 1}:`);
        console.log('   Email:', token.email);
        console.log('   Token:', token.token.substring(0, 20) + '...');
        console.log('   Expires:', token.expiresAt);
        console.log('   Used:', isUsed ? 'Yes' : 'No');
        console.log('   Status:', isUsed ? '✅ USED' : isExpired ? '❌ EXPIRED' : '✅ VALID');
        console.log('');
      });
    } else {
      console.log('❌ No verification tokens found');
      console.log('');
    }

    // Check if user exists but not verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        primaryRole: true,
      },
    });

    if (user) {
      console.log('User exists in database:');
      console.log('   Email Verified:', user.emailVerified ? 'Yes' : 'No');
      console.log('   Primary Role:', user.primaryRole);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/check-verification-token.ts <email>');
  process.exit(1);
}

checkVerificationToken(email);
