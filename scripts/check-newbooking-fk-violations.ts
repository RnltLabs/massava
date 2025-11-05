// Copyright (c) 2025 Roman Reinelt / RNLT Labs
// Script to check for FK violations before migration

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function checkFKViolations(): Promise<void> {
  console.log('Checking for potential FK violations in NewBooking table...\n');

  try {
    // Check all NewBooking records
    const bookings = await prisma.newBooking.findMany({
      select: {
        id: true,
        studioId: true,
        serviceId: true,
        customerId: true,
      },
    });

    console.log(`Total NewBooking records: ${bookings.length}\n`);

    if (bookings.length === 0) {
      console.log('✅ No NewBooking records found. Safe to proceed with migration.');
      return;
    }

    // Check for invalid studioId references
    const studioIds = [...new Set(bookings.map(b => b.studioId))];
    const studios = await prisma.studio.findMany({
      where: { id: { in: studioIds } },
      select: { id: true },
    });
    const validStudioIds = new Set(studios.map(s => s.id));
    const invalidStudioIds = studioIds.filter(id => !validStudioIds.has(id));

    if (invalidStudioIds.length > 0) {
      console.log('❌ Invalid studioId references found:');
      invalidStudioIds.forEach(id => {
        const count = bookings.filter(b => b.studioId === id).length;
        console.log(`  - studioId: ${id} (${count} bookings)`);
      });
    } else {
      console.log('✅ All studioId references are valid');
    }

    // Check for invalid serviceId references
    const serviceIds = [...new Set(bookings.map(b => b.serviceId).filter(Boolean) as string[])];
    let invalidServiceIds: string[] = [];

    if (serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      const validServiceIds = new Set(services.map(s => s.id));
      invalidServiceIds = serviceIds.filter(id => !validServiceIds.has(id));

      if (invalidServiceIds.length > 0) {
        console.log('\n❌ Invalid serviceId references found:');
        invalidServiceIds.forEach(id => {
          const count = bookings.filter(b => b.serviceId === id).length;
          console.log(`  - serviceId: ${id} (${count} bookings)`);
        });
      } else {
        console.log('✅ All serviceId references are valid');
      }
    } else {
      console.log('✅ No serviceId references to check (all NULL)');
    }

    // Check for invalid customerId references
    const customerIds = [...new Set(bookings.map(b => b.customerId).filter((id): id is string => id !== null))];
    const users = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true },
    });
    const validCustomerIds = new Set(users.map(u => u.id));
    const invalidCustomerIds = customerIds.filter(id => !validCustomerIds.has(id));

    if (invalidCustomerIds.length > 0) {
      console.log('\n❌ Invalid customerId references found:');
      invalidCustomerIds.forEach(id => {
        const count = bookings.filter(b => b.customerId === id).length;
        console.log(`  - customerId: ${id} (${count} bookings)`);
      });
    } else {
      console.log('✅ All customerId references are valid');
    }

    // Summary
    const hasViolations = invalidStudioIds.length > 0 || invalidServiceIds.length > 0 || invalidCustomerIds.length > 0;

    if (hasViolations) {
      console.log('\n⚠️  WARNING: Found FK violations. Clean up before migration!');
      console.log('You can delete invalid bookings or fix the references.\n');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed. Safe to proceed with migration!');
    }

  } catch (error) {
    console.error('Error checking FK violations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkFKViolations();
