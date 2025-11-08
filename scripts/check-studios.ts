/**
 * Check Studios and Owners in Database
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Studios and Owners...\n');

  // Get all studios
  const studios = await prisma.studio.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      address: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`📍 Found ${studios.length} Studios:\n`);
  studios.forEach((studio, index) => {
    console.log(`${index + 1}. ${studio.name}`);
    console.log(`   Email: ${studio.email}`);
    console.log(`   Address: ${studio.address}, ${studio.city}`);
    console.log(`   ID: ${studio.id}\n`);
  });

  // Get all studio owners
  const owners = await prisma.user.findMany({
    where: {
      primaryRole: 'STUDIO_OWNER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      ownedStudios: {
        select: {
          studioId: true,
          studio: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      email: 'asc',
    },
  });

  console.log(`\n👥 Found ${owners.length} Studio Owners:\n`);
  owners.forEach((owner, index) => {
    console.log(`${index + 1}. ${owner.name}`);
    console.log(`   Email: ${owner.email}`);
    console.log(`   Owns: ${owner.ownedStudios.map(os => os.studio.name).join(', ') || 'No studios'}`);
    console.log(`   ID: ${owner.id}\n`);
  });

  // Get studio ownerships
  const ownerships = await prisma.studioOwnership.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      studio: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`\n🔗 Found ${ownerships.length} Ownership Connections:\n`);
  ownerships.forEach((ownership, index) => {
    console.log(`${index + 1}. ${ownership.user.email} → ${ownership.studio.name}`);
  });
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
