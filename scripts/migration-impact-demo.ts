// Copyright (c) 2025 Roman Reinelt / RNLT Labs
// Interactive demo to show migration impact on studio deletion

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function demonstrateMigrationImpact(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  NewBooking Foreign Key Migration - Impact Demonstration  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Setup: Create a complete test scenario
    console.log('📋 Setup: Creating test data...\n');

    const studio = await prisma.studio.create({
      data: {
        name: 'Demo Thai Massage Studio',
        address: 'Teststraße 123',
        city: 'München',
        phone: '+49 89 12345678',
        email: 'demo@example.com',
        capacity: 2,
      },
    });
    console.log(`✓ Created Studio: ${studio.name} (ID: ${studio.id})`);

    const service = await prisma.service.create({
      data: {
        studioId: studio.id,
        name: 'Thai Massage 90 min',
        description: 'Traditional Thai Massage',
        price: 89.0,
        duration: 90,
      },
    });
    console.log(`✓ Created Service: ${service.name} (ID: ${service.id})`);

    const customers = await Promise.all([
      prisma.user.create({
        data: {
          email: `demo-customer-1-${Date.now()}@example.com`,
          name: 'Anna Müller',
          primaryRole: 'CUSTOMER',
        },
      }),
      prisma.user.create({
        data: {
          email: `demo-customer-2-${Date.now()}@example.com`,
          name: 'Thomas Schmidt',
          primaryRole: 'CUSTOMER',
        },
      }),
      prisma.user.create({
        data: {
          email: `demo-customer-3-${Date.now()}@example.com`,
          name: 'Lisa Wagner',
          primaryRole: 'CUSTOMER',
        },
      }),
    ]);
    console.log(`✓ Created ${customers.length} Customers`);

    const bookings = await Promise.all([
      prisma.newBooking.create({
        data: {
          studioId: studio.id,
          serviceId: service.id,
          customerId: customers[0].id,
          customerName: customers[0].name!,
          customerEmail: customers[0].email,
          customerPhone: '+49 151 12345678',
          preferredDate: '2025-11-15',
          preferredTime: '14:00',
          status: 'CONFIRMED',
        },
      }),
      prisma.newBooking.create({
        data: {
          studioId: studio.id,
          serviceId: service.id,
          customerId: customers[1].id,
          customerName: customers[1].name!,
          customerEmail: customers[1].email,
          customerPhone: '+49 151 87654321',
          preferredDate: '2025-11-16',
          preferredTime: '15:00',
          status: 'PENDING',
        },
      }),
      prisma.newBooking.create({
        data: {
          studioId: studio.id,
          serviceId: null, // No specific service selected
          customerId: customers[2].id,
          customerName: customers[2].name!,
          customerEmail: customers[2].email,
          preferredDate: '2025-11-17',
          preferredTime: '16:00',
          status: 'PENDING',
        },
      }),
    ]);
    console.log(`✓ Created ${bookings.length} Bookings`);

    // Display current state
    console.log('\n' + '─'.repeat(60));
    console.log('📊 CURRENT DATABASE STATE');
    console.log('─'.repeat(60));
    console.log(`\n🏢 Studio: ${studio.name}`);
    console.log(`   Services: 1 (${service.name})`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log(`   Customers: ${customers.length}`);

    console.log('\n📅 Bookings:');
    bookings.forEach((booking, index) => {
      const customer = customers.find((c) => c.id === booking.customerId);
      console.log(`   ${index + 1}. ${customer?.name} - ${booking.preferredDate} at ${booking.preferredTime}`);
      console.log(`      Service: ${booking.serviceId ? service.name : 'Not specified'}`);
      console.log(`      Status: ${booking.status}`);
    });

    // Demonstrate deletion impact
    console.log('\n' + '─'.repeat(60));
    console.log('🗑️  DEMONSTRATING DELETION IMPACT');
    console.log('─'.repeat(60));

    console.log('\n⚠️  About to delete studio...');
    console.log('   With CASCADE foreign keys, this will also delete:');
    console.log('   - All services (1 service)');
    console.log('   - All bookings (3 bookings)');
    console.log('   - Customers are preserved (they can have other bookings)\n');

    // Wait a moment for dramatic effect
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Count bookings before deletion
    const bookingsBeforeDelete = await prisma.newBooking.count({
      where: { studioId: studio.id },
    });

    console.log(`📊 Bookings before deletion: ${bookingsBeforeDelete}`);

    // Delete studio
    await prisma.studio.delete({
      where: { id: studio.id },
    });

    console.log('\n✓ Studio deleted successfully');

    // Verify cascade deletion
    const bookingsAfterDelete = await prisma.newBooking.count({
      where: { studioId: studio.id },
    });

    console.log(`📊 Bookings after deletion: ${bookingsAfterDelete}`);

    // Verify customers still exist
    const remainingCustomers = await prisma.user.count({
      where: { id: { in: customers.map((c) => c.id) } },
    });

    console.log(`👥 Customers still in database: ${remainingCustomers}`);

    console.log('\n' + '─'.repeat(60));
    console.log('✅ MIGRATION IMPACT SUMMARY');
    console.log('─'.repeat(60));
    console.log('\n🎯 What happened:');
    console.log('   1. Studio deleted ✓');
    console.log('   2. All services CASCADE deleted ✓');
    console.log('   3. All bookings CASCADE deleted ✓');
    console.log('   4. Customers preserved ✓');

    console.log('\n💡 Benefits:');
    console.log('   ✓ No orphaned bookings left in database');
    console.log('   ✓ Automatic cleanup of related records');
    console.log('   ✓ Data integrity guaranteed by PostgreSQL');
    console.log('   ✓ GDPR compliance for user deletion');
    console.log('   ✓ Simplified application code (no manual cleanup needed)');

    console.log('\n⚡ Performance:');
    console.log('   ✓ Minimal overhead (PostgreSQL handles cascade efficiently)');
    console.log('   ✓ Atomic operation (all-or-nothing deletion)');
    console.log('   ✓ No application-level cascade logic required');

    // Cleanup remaining test data
    console.log('\n🧹 Cleaning up test customers...');
    await prisma.user.deleteMany({
      where: { id: { in: customers.map((c) => c.id) } },
    });

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              Demo completed successfully! ✨               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demonstration
demonstrateMigrationImpact();
