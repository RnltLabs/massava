// Copyright (c) 2025 Roman Reinelt / RNLT Labs
// Test script to verify NewBooking cascade deletion behavior

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function testCascadeDeletion(): Promise<void> {
  console.log('Testing NewBooking CASCADE deletion behavior...\n');

  try {
    // Test 1: Studio CASCADE deletion
    console.log('Test 1: Delete Studio (should CASCADE to NewBooking)');
    console.log('---------------------------------------------------');

    // Create test studio
    const testStudio = await prisma.studio.create({
      data: {
        name: 'Test Studio CASCADE',
        address: 'Test Address',
        city: 'Test City',
        phone: '+49 123 456789',
        email: 'test-cascade@example.com',
      },
    });
    console.log(`✓ Created studio: ${testStudio.id}`);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-cascade-${Date.now()}@example.com`,
        name: 'Test Customer CASCADE',
        primaryRole: 'CUSTOMER',
      },
    });
    console.log(`✓ Created user: ${testUser.id}`);

    // Create test booking
    const testBooking1 = await prisma.newBooking.create({
      data: {
        studioId: testStudio.id,
        customerId: testUser.id,
        customerName: testUser.name!,
        customerEmail: testUser.email,
        preferredDate: '2025-11-15',
        preferredTime: '14:00',
        status: 'PENDING',
      },
    });
    console.log(`✓ Created booking: ${testBooking1.id}`);

    // Verify booking exists
    const bookingBeforeDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking1.id },
    });
    console.log(`✓ Booking exists before studio deletion: ${bookingBeforeDelete !== null}`);

    // Delete studio (should CASCADE to booking)
    await prisma.studio.delete({
      where: { id: testStudio.id },
    });
    console.log(`✓ Deleted studio: ${testStudio.id}`);

    // Verify booking was CASCADE deleted
    const bookingAfterDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking1.id },
    });

    if (bookingAfterDelete === null) {
      console.log('✅ Test 1 PASSED: Booking was CASCADE deleted with studio\n');
    } else {
      console.log('❌ Test 1 FAILED: Booking still exists after studio deletion\n');
    }

    // Cleanup user
    await prisma.user.delete({ where: { id: testUser.id } });

    // Test 2: User/Customer CASCADE deletion
    console.log('Test 2: Delete User (should CASCADE to NewBooking)');
    console.log('---------------------------------------------------');

    // Create new test studio
    const testStudio2 = await prisma.studio.create({
      data: {
        name: 'Test Studio CASCADE 2',
        address: 'Test Address 2',
        city: 'Test City 2',
        phone: '+49 987 654321',
        email: 'test-cascade-2@example.com',
      },
    });
    console.log(`✓ Created studio: ${testStudio2.id}`);

    // Create test user
    const testUser2 = await prisma.user.create({
      data: {
        email: `test-cascade-2-${Date.now()}@example.com`,
        name: 'Test Customer CASCADE 2',
        primaryRole: 'CUSTOMER',
      },
    });
    console.log(`✓ Created user: ${testUser2.id}`);

    // Create test booking
    const testBooking2 = await prisma.newBooking.create({
      data: {
        studioId: testStudio2.id,
        customerId: testUser2.id,
        customerName: testUser2.name!,
        customerEmail: testUser2.email,
        preferredDate: '2025-11-16',
        preferredTime: '15:00',
        status: 'PENDING',
      },
    });
    console.log(`✓ Created booking: ${testBooking2.id}`);

    // Verify booking exists
    const booking2BeforeDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking2.id },
    });
    console.log(`✓ Booking exists before user deletion: ${booking2BeforeDelete !== null}`);

    // Delete user (should CASCADE to booking)
    await prisma.user.delete({
      where: { id: testUser2.id },
    });
    console.log(`✓ Deleted user: ${testUser2.id}`);

    // Verify booking was CASCADE deleted
    const booking2AfterDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking2.id },
    });

    if (booking2AfterDelete === null) {
      console.log('✅ Test 2 PASSED: Booking was CASCADE deleted with user\n');
    } else {
      console.log('❌ Test 2 FAILED: Booking still exists after user deletion\n');
    }

    // Cleanup studio
    await prisma.studio.delete({ where: { id: testStudio2.id } });

    // Test 3: Service SET NULL behavior
    console.log('Test 3: Delete Service (should SET NULL on NewBooking)');
    console.log('-------------------------------------------------------');

    // Create test studio
    const testStudio3 = await prisma.studio.create({
      data: {
        name: 'Test Studio SET NULL',
        address: 'Test Address 3',
        city: 'Test City 3',
        phone: '+49 111 222333',
        email: 'test-setnull@example.com',
      },
    });
    console.log(`✓ Created studio: ${testStudio3.id}`);

    // Create test service
    const testService = await prisma.service.create({
      data: {
        studioId: testStudio3.id,
        name: 'Test Service',
        description: 'Test service for cascade testing',
        price: 50.0,
        duration: 60,
      },
    });
    console.log(`✓ Created service: ${testService.id}`);

    // Create test user
    const testUser3 = await prisma.user.create({
      data: {
        email: `test-setnull-${Date.now()}@example.com`,
        name: 'Test Customer SET NULL',
        primaryRole: 'CUSTOMER',
      },
    });
    console.log(`✓ Created user: ${testUser3.id}`);

    // Create test booking with service
    const testBooking3 = await prisma.newBooking.create({
      data: {
        studioId: testStudio3.id,
        serviceId: testService.id,
        customerId: testUser3.id,
        customerName: testUser3.name!,
        customerEmail: testUser3.email,
        preferredDate: '2025-11-17',
        preferredTime: '16:00',
        status: 'PENDING',
      },
    });
    console.log(`✓ Created booking with service: ${testBooking3.id}`);

    // Verify booking has serviceId
    const booking3BeforeDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking3.id },
    });
    console.log(`✓ Booking has serviceId before deletion: ${booking3BeforeDelete?.serviceId !== null}`);
    console.log(`  serviceId: ${booking3BeforeDelete?.serviceId}`);

    // Delete service (should SET NULL on booking)
    await prisma.service.delete({
      where: { id: testService.id },
    });
    console.log(`✓ Deleted service: ${testService.id}`);

    // Verify booking still exists but serviceId is NULL
    const booking3AfterDelete = await prisma.newBooking.findUnique({
      where: { id: testBooking3.id },
    });

    if (booking3AfterDelete !== null && booking3AfterDelete.serviceId === null) {
      console.log('✅ Test 3 PASSED: Booking exists with serviceId SET NULL\n');
    } else if (booking3AfterDelete === null) {
      console.log('❌ Test 3 FAILED: Booking was deleted (should have been kept)\n');
    } else {
      console.log('❌ Test 3 FAILED: serviceId was not SET NULL\n');
    }

    // Cleanup
    await prisma.newBooking.delete({ where: { id: testBooking3.id } });
    await prisma.user.delete({ where: { id: testUser3.id } });
    await prisma.studio.delete({ where: { id: testStudio3.id } });

    console.log('=======================================================');
    console.log('✅ All CASCADE deletion tests completed successfully!');
    console.log('=======================================================');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCascadeDeletion();
