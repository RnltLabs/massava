/**
 * Script to check user role in database
 * Usage: npx tsx scripts/check-user-role.ts <email>
 */

import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

async function checkUserRole(email: string) {
  console.log(`\n🔍 Checking user role for: ${email}\n`);

  try {
    // Check unified User model
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        primaryRole: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (user) {
      console.log('✅ Found in unified User model:');
      console.log('   ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Primary Role:', user.primaryRole);
      console.log('   Email Verified:', user.emailVerified ? 'Yes' : 'No');
      console.log('   Active:', user.isActive ? 'Yes' : 'No');
      console.log('   Created:', user.createdAt);
      console.log('');
      return;
    }

    // Check legacy Customer model
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (customer) {
      console.log('⚠️  Found in LEGACY Customer model:');
      console.log('   ID:', customer.id);
      console.log('   Name:', customer.name);
      console.log('   Email:', customer.email);
      console.log('   Email Verified:', customer.emailVerified ? 'Yes' : 'No');
      console.log('   Created:', customer.createdAt);
      console.log('');
      console.log('   ⚠️  This user needs migration to unified User model');
      console.log('');
      return;
    }

    // Check legacy StudioOwner model
    const studioOwner = await prisma.studioOwner.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (studioOwner) {
      console.log('⚠️  Found in LEGACY StudioOwner model:');
      console.log('   ID:', studioOwner.id);
      console.log('   Name:', studioOwner.name);
      console.log('   Email:', studioOwner.email);
      console.log('   Email Verified:', studioOwner.emailVerified ? 'Yes' : 'No');
      console.log('   Created:', studioOwner.createdAt);
      console.log('');
      console.log('   ⚠️  This user needs migration to unified User model');
      console.log('');
      return;
    }

    console.log('❌ User not found in any model');
    console.log('');

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/check-user-role.ts <email>');
  process.exit(1);
}

checkUserRole(email);
