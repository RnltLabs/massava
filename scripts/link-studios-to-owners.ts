/**
 * Link Studios to Owners
 * Creates studioOwnership connections
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Linking Studios to Owners...\n');

  // Get studios
  const thaiWellness = await prisma.studio.findFirst({
    where: { name: 'Thai Wellness Oase' },
  });

  const bambooSpa = await prisma.studio.findFirst({
    where: { name: 'Bamboo Spa Karlsruhe' },
  });

  const sabaiMassage = await prisma.studio.findFirst({
    where: { name: 'Sabai Massage Studio' },
  });

  // Get owners
  const maria = await prisma.user.findUnique({
    where: { email: 'maria.schmidt@siamspa-ka.de' },
  });

  const thomas = await prisma.user.findUnique({
    where: { email: 'thomas.weber@wellness-oase.de' },
  });

  const sabine = await prisma.user.findUnique({
    where: { email: 'sabine.fischer@thaimassage-ka.de' },
  });

  if (!maria || !thomas || !sabine) {
    console.error('❌ Not all owners found!');
    return;
  }

  if (!thaiWellness || !bambooSpa || !sabaiMassage) {
    console.error('❌ Not all studios found!');
    return;
  }

  // Create ownerships
  console.log('Creating ownership connections...\n');

  // Maria → Thai Wellness Oase
  const ownership1 = await prisma.studioOwnership.create({
    data: {
      userId: maria.id,
      studioId: thaiWellness.id,
    },
  });
  console.log(`✅ ${maria.email} → ${thaiWellness.name}`);

  // Thomas → Bamboo Spa Karlsruhe
  const ownership2 = await prisma.studioOwnership.create({
    data: {
      userId: thomas.id,
      studioId: bambooSpa.id,
    },
  });
  console.log(`✅ ${thomas.email} → ${bambooSpa.name}`);

  // Sabine → Sabai Massage Studio
  const ownership3 = await prisma.studioOwnership.create({
    data: {
      userId: sabine.id,
      studioId: sabaiMassage.id,
    },
  });
  console.log(`✅ ${sabine.email} → ${sabaiMassage.name}`);

  console.log('\n✅ All ownerships created!\n');

  // Verify
  const updatedOwners = await prisma.user.findMany({
    where: {
      primaryRole: 'STUDIO_OWNER',
    },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  console.log('📊 Verification:\n');
  updatedOwners.forEach((owner) => {
    console.log(`${owner.name} (${owner.email}):`);
    owner.ownedStudios.forEach((os) => {
      console.log(`  → ${os.studio.name}`);
    });
    console.log();
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
