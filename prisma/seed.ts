/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.newBooking.deleteMany();
  await prisma.studioOwnership.deleteMany();
  await prisma.service.deleteMany();
  await prisma.studio.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('test123', 10);

  // Create studio owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      name: 'Maria Schmidt',
      password: hashedPassword,
      primaryRole: 'STUDIO_OWNER',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created studio owner:', owner.email);

  // Create customer accounts
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'anna.mueller@example.com',
        name: 'Anna Müller',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'thomas.weber@example.com',
        name: 'Thomas Weber',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.fischer@example.com',
        name: 'Sarah Fischer',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'michael.hoffmann@example.com',
        name: 'Michael Hoffmann',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'julia.becker@example.com',
        name: 'Julia Becker',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'markus.klein@example.com',
        name: 'Markus Klein',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.zimmermann@example.com',
        name: 'Lisa Zimmermann',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.schulz@example.com',
        name: 'David Schulz',
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log('✅ Created customers:', customers.length);

  // Create studios with images and coordinates
  const studio1 = await prisma.studio.create({
    data: {
      name: 'Thai Wellness Oase',
      description: 'Traditionelle Thai-Massage in Karlsruhe. Entspannung pur mit erfahrenen Therapeuten aus Thailand.',
      address: 'Kaiserstraße 123',
      city: 'Karlsruhe',
      postalCode: '76133',
      phone: '+49 721 12345678',
      email: 'info@thai-wellness-oase.de',
      website: 'https://thai-wellness-oase.de',
      latitude: 49.0069,
      longitude: 8.4037,
      logoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop',
      ],
      openingHours: {
        monday: '10:00-20:00',
        tuesday: '10:00-20:00',
        wednesday: '10:00-20:00',
        thursday: '10:00-20:00',
        friday: '10:00-20:00',
        saturday: '11:00-19:00',
        sunday: 'Geschlossen',
      },
      services: {
        create: [
          {
            name: 'Thai-Massage 60 Minuten',
            description: 'Klassische Thai-Massage zur Entspannung und Lockerung',
            price: 65.0,
            duration: 60,
          },
          {
            name: 'Thai-Massage 90 Minuten',
            description: 'Ausführliche Thai-Massage für tiefe Entspannung',
            price: 90.0,
            duration: 90,
          },
          {
            name: 'Ölmassage 60 Minuten',
            description: 'Sanfte Ölmassage mit aromatischen Ölen',
            price: 70.0,
            duration: 60,
          },
        ],
      },
    },
  });

  const studio2 = await prisma.studio.create({
    data: {
      name: 'Sabai Massage Studio',
      description: 'Authentische Thai-Massage im Herzen von Karlsruhe. Sabai bedeutet "wohlfühlen" auf Thai.',
      address: 'Waldstraße 45',
      city: 'Karlsruhe',
      postalCode: '76131',
      phone: '+49 721 98765432',
      email: 'kontakt@sabai-massage.de',
      website: 'https://sabai-massage.de',
      latitude: 49.0094,
      longitude: 8.4044,
      logoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
      ],
      openingHours: {
        monday: '09:00-21:00',
        tuesday: '09:00-21:00',
        wednesday: '09:00-21:00',
        thursday: '09:00-21:00',
        friday: '09:00-21:00',
        saturday: '10:00-20:00',
        sunday: '10:00-18:00',
      },
      services: {
        create: [
          {
            name: 'Thai-Massage 60 Minuten',
            description: 'Traditionelle Thai-Massage',
            price: 60.0,
            duration: 60,
          },
          {
            name: 'Thai-Massage 120 Minuten',
            description: 'Premium Thai-Massage mit ausgiebiger Behandlung',
            price: 110.0,
            duration: 120,
          },
          {
            name: 'Fußreflexzonenmassage',
            description: 'Entspannende Fußmassage',
            price: 45.0,
            duration: 45,
          },
          {
            name: 'Rückenmassage',
            description: 'Fokussierte Rückenmassage bei Verspannungen',
            price: 50.0,
            duration: 45,
          },
        ],
      },
    },
  });

  const studio3 = await prisma.studio.create({
    data: {
      name: 'Lotus Spa & Wellness',
      description: 'Modernes Wellness-Studio mit Thai- und klassischen Massagen. Premium-Ambiente und professionelle Therapeuten.',
      address: 'Erzbergerstraße 89',
      city: 'Karlsruhe',
      postalCode: '76133',
      phone: '+49 721 55566677',
      email: 'hello@lotus-spa.de',
      website: 'https://lotus-spa.de',
      latitude: 49.0048,
      longitude: 8.3858,
      logoUrl: 'https://images.unsplash.com/photo-1590487996738-cbe449f39629?w=400&h=400&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
      ],
      openingHours: {
        monday: '10:00-22:00',
        tuesday: '10:00-22:00',
        wednesday: '10:00-22:00',
        thursday: '10:00-22:00',
        friday: '10:00-22:00',
        saturday: '11:00-21:00',
        sunday: '12:00-20:00',
      },
      services: {
        create: [
          {
            name: 'Thai-Massage 75 Minuten',
            description: 'Premium Thai-Massage in luxuriösem Ambiente',
            price: 85.0,
            duration: 75,
          },
          {
            name: 'Aromatherapie-Massage',
            description: 'Entspannung mit ätherischen Ölen',
            price: 95.0,
            duration: 90,
          },
          {
            name: 'Hot Stone Massage',
            description: 'Tiefenentspannung mit heißen Steinen',
            price: 100.0,
            duration: 90,
          },
        ],
      },
    },
  });

  console.log('✅ Created studios with images:', {
    studio1: studio1.name,
    studio2: studio2.name,
    studio3: studio3.name,
  });

  // Create studio ownerships
  await Promise.all([
    prisma.studioOwnership.create({
      data: {
        userId: owner.id,
        studioId: studio1.id,
        canTransfer: true,
        acceptedAt: new Date(),
      },
    }),
    prisma.studioOwnership.create({
      data: {
        userId: owner.id,
        studioId: studio2.id,
        canTransfer: true,
        acceptedAt: new Date(),
      },
    }),
    prisma.studioOwnership.create({
      data: {
        userId: owner.id,
        studioId: studio3.id,
        canTransfer: true,
        acceptedAt: new Date(),
      },
    }),
  ]);

  console.log('✅ Created studio ownerships');

  // Get services for bookings
  const studio1Services = await prisma.service.findMany({ where: { studioId: studio1.id } });
  const studio2Services = await prisma.service.findMany({ where: { studioId: studio2.id } });
  const studio3Services = await prisma.service.findMany({ where: { studioId: studio3.id } });

  // Create past bookings (for reviews)
  const pastDate1 = new Date();
  pastDate1.setDate(pastDate1.getDate() - 5);
  const pastDate2 = new Date();
  pastDate2.setDate(pastDate2.getDate() - 10);
  const pastDate3 = new Date();
  pastDate3.setDate(pastDate3.getDate() - 15);
  const pastDate4 = new Date();
  pastDate4.setDate(pastDate4.getDate() - 20);
  const pastDate5 = new Date();
  pastDate5.setDate(pastDate5.getDate() - 25);

  const bookings = await Promise.all([
    // Studio 1 bookings
    prisma.newBooking.create({
      data: {
        studioId: studio1.id,
        serviceId: studio1Services[0].id,
        customerId: customers[0].id,
        customerName: customers[0].name!,
        customerEmail: customers[0].email,
        preferredDate: pastDate1.toISOString().split('T')[0],
        preferredTime: '14:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate1,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio1.id,
        serviceId: studio1Services[1].id,
        customerId: customers[1].id,
        customerName: customers[1].name!,
        customerEmail: customers[1].email,
        preferredDate: pastDate2.toISOString().split('T')[0],
        preferredTime: '16:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate2,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio1.id,
        serviceId: studio1Services[0].id,
        customerId: customers[2].id,
        customerName: customers[2].name!,
        customerEmail: customers[2].email,
        preferredDate: pastDate3.toISOString().split('T')[0],
        preferredTime: '11:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate3,
        reviewRequestSent: true,
      },
    }),
    // Studio 2 bookings
    prisma.newBooking.create({
      data: {
        studioId: studio2.id,
        serviceId: studio2Services[0].id,
        customerId: customers[3].id,
        customerName: customers[3].name!,
        customerEmail: customers[3].email,
        preferredDate: pastDate1.toISOString().split('T')[0],
        preferredTime: '15:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate1,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio2.id,
        serviceId: studio2Services[1].id,
        customerId: customers[4].id,
        customerName: customers[4].name!,
        customerEmail: customers[4].email,
        preferredDate: pastDate2.toISOString().split('T')[0],
        preferredTime: '10:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate2,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio2.id,
        serviceId: studio2Services[2].id,
        customerId: customers[5].id,
        customerName: customers[5].name!,
        customerEmail: customers[5].email,
        preferredDate: pastDate4.toISOString().split('T')[0],
        preferredTime: '17:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate4,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio2.id,
        serviceId: studio2Services[0].id,
        customerId: customers[6].id,
        customerName: customers[6].name!,
        customerEmail: customers[6].email,
        preferredDate: pastDate5.toISOString().split('T')[0],
        preferredTime: '13:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate5,
        reviewRequestSent: true,
      },
    }),
    // Studio 3 bookings
    prisma.newBooking.create({
      data: {
        studioId: studio3.id,
        serviceId: studio3Services[0].id,
        customerId: customers[7].id,
        customerName: customers[7].name!,
        customerEmail: customers[7].email,
        preferredDate: pastDate1.toISOString().split('T')[0],
        preferredTime: '18:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate1,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio3.id,
        serviceId: studio3Services[1].id,
        customerId: customers[0].id,
        customerName: customers[0].name!,
        customerEmail: customers[0].email,
        preferredDate: pastDate3.toISOString().split('T')[0],
        preferredTime: '14:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate3,
        reviewRequestSent: true,
      },
    }),
    prisma.newBooking.create({
      data: {
        studioId: studio3.id,
        serviceId: studio3Services[2].id,
        customerId: customers[1].id,
        customerName: customers[1].name!,
        customerEmail: customers[1].email,
        preferredDate: pastDate4.toISOString().split('T')[0],
        preferredTime: '19:00',
        status: 'CONFIRMED',
        confirmedAt: pastDate4,
        reviewRequestSent: true,
      },
    }),
  ]);

  console.log('✅ Created bookings:', bookings.length);

  // Create reviews for studios
  const reviews = await Promise.all([
    // Studio 1 reviews (3 reviews, average ~4.7)
    prisma.review.create({
      data: {
        studioId: studio1.id,
        userId: customers[0].id,
        bookingId: bookings[0].id,
        rating: 5,
        comment: 'Absolut fantastisch! Die Therapeutin war super professionell und die Massage war genau das, was ich brauchte. Sehr entspannende Atmosphäre.',
        isVisible: true,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio1.id,
        userId: customers[1].id,
        bookingId: bookings[1].id,
        rating: 5,
        comment: 'Beste Thai-Massage in Karlsruhe! Ich komme definitiv wieder. Das Personal ist sehr freundlich und kompetent.',
        isVisible: true,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio1.id,
        userId: customers[2].id,
        bookingId: bookings[2].id,
        rating: 4,
        comment: 'Sehr gute Massage, nur die Terminvergabe könnte etwas flexibler sein. Ansonsten top!',
        isVisible: true,
      },
    }),
    // Studio 2 reviews (4 reviews, average ~4.5)
    prisma.review.create({
      data: {
        studioId: studio2.id,
        userId: customers[3].id,
        bookingId: bookings[3].id,
        rating: 5,
        comment: 'Hervorragende Thai-Massage! Die Atmosphäre ist wunderschön und das Team sehr professionell. Absolut empfehlenswert!',
        isVisible: true,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio2.id,
        userId: customers[4].id,
        bookingId: bookings[4].id,
        rating: 5,
        comment: 'Die 120-Minuten-Massage war jeden Cent wert. Ich fühlte mich danach wie neugeboren. Sehr zu empfehlen!',
        isVisible: true,
        response: 'Vielen Dank für Ihre positive Bewertung! Es freut uns sehr, dass Sie sich bei uns wohl gefühlt haben. Wir freuen uns auf Ihren nächsten Besuch!',
        respondedAt: new Date(),
        respondedBy: owner.id,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio2.id,
        userId: customers[5].id,
        bookingId: bookings[5].id,
        rating: 4,
        comment: 'Tolle Fußmassage! Sehr entspannend. Nur die Parkplatzsituation ist etwas schwierig.',
        isVisible: true,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio2.id,
        userId: customers[6].id,
        bookingId: bookings[6].id,
        rating: 4,
        comment: 'Gute Massage und angenehmes Ambiente. Komme gerne wieder!',
        isVisible: true,
      },
    }),
    // Studio 3 reviews (3 reviews, average ~4.3)
    prisma.review.create({
      data: {
        studioId: studio3.id,
        userId: customers[7].id,
        bookingId: bookings[7].id,
        rating: 5,
        comment: 'Luxuriöses Ambiente und erstklassige Massage. Die Hot Stone Massage war unglaublich entspannend. Preis-Leistung stimmt absolut!',
        isVisible: true,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio3.id,
        userId: customers[0].id,
        bookingId: bookings[8].id,
        rating: 4,
        comment: 'Sehr schönes Studio mit hochwertiger Ausstattung. Die Aromatherapie-Massage war toll, nur etwas teurer als andere Studios.',
        isVisible: true,
        response: 'Vielen Dank für Ihr Feedback! Wir legen großen Wert auf Qualität und Premium-Service. Wir hoffen, Sie bald wiederzusehen!',
        respondedAt: new Date(),
        respondedBy: owner.id,
      },
    }),
    prisma.review.create({
      data: {
        studioId: studio3.id,
        userId: customers[1].id,
        bookingId: bookings[9].id,
        rating: 4,
        comment: 'Die Hot Stone Massage war fantastisch! Sehr professionelles Team und wunderschöne Räumlichkeiten.',
        isVisible: true,
      },
    }),
  ]);

  console.log('✅ Created reviews:', reviews.length);

  // Calculate and update studio ratings
  const studio1Reviews = reviews.filter(r => r.studioId === studio1.id && r.isVisible);
  const studio1AvgRating = studio1Reviews.reduce((sum, r) => sum + r.rating, 0) / studio1Reviews.length;

  const studio2Reviews = reviews.filter(r => r.studioId === studio2.id && r.isVisible);
  const studio2AvgRating = studio2Reviews.reduce((sum, r) => sum + r.rating, 0) / studio2Reviews.length;

  const studio3Reviews = reviews.filter(r => r.studioId === studio3.id && r.isVisible);
  const studio3AvgRating = studio3Reviews.reduce((sum, r) => sum + r.rating, 0) / studio3Reviews.length;

  await Promise.all([
    prisma.studio.update({
      where: { id: studio1.id },
      data: {
        averageRating: parseFloat(studio1AvgRating.toFixed(2)),
        totalReviews: studio1Reviews.length,
      },
    }),
    prisma.studio.update({
      where: { id: studio2.id },
      data: {
        averageRating: parseFloat(studio2AvgRating.toFixed(2)),
        totalReviews: studio2Reviews.length,
      },
    }),
    prisma.studio.update({
      where: { id: studio3.id },
      data: {
        averageRating: parseFloat(studio3AvgRating.toFixed(2)),
        totalReviews: studio3Reviews.length,
      },
    }),
  ]);

  console.log('✅ Updated studio ratings:', {
    [studio1.name]: `${studio1AvgRating.toFixed(2)} (${studio1Reviews.length} reviews)`,
    [studio2.name]: `${studio2AvgRating.toFixed(2)} (${studio2Reviews.length} reviews)`,
    [studio3.name]: `${studio3AvgRating.toFixed(2)} (${studio3Reviews.length} reviews)`,
  });

  // ========================================
  // PHASE 4: TimeSlot generation DEPRECATED
  // ========================================
  // TimeSlots are now calculated dynamically using calculateAvailableSlots()
  // Static TimeSlot table is kept for backward compatibility but no longer populated
  //
  // To re-enable TimeSlot generation, uncomment the code below and set:
  // FEATURE_DYNAMIC_SLOTS=false
  //
  // console.log('⏰ Creating time slots for next 14 days...');
  //
  // const timeSlots: any[] = [];
  // const studios = [
  //   { studio: studio1, services: studio1Services, hours: { start: 10, end: 20 } },
  //   { studio: studio2, services: studio2Services, hours: { start: 9, end: 21 } },
  //   { studio: studio3, services: studio3Services, hours: { start: 10, end: 22 } },
  // ];
  //
  // // Generate slots for next 14 days
  // for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
  //   const date = new Date();
  //   date.setDate(date.getDate() + dayOffset);
  //   const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  //
  //   // Skip if it's Sunday for Studio 1 (closed on Sundays)
  //   for (const { studio, services, hours } of studios) {
  //     // Studio 1 closed on Sunday
  //     if (studio.id === studio1.id && dayOfWeek === 0) continue;
  //
  //     // Create slots for each service
  //     for (const service of services) {
  //       // Create hourly slots
  //       for (let hour = hours.start; hour < hours.end; hour++) {
  //         const startTime = new Date(date);
  //         startTime.setHours(hour, 0, 0, 0);
  //
  //         const endTime = new Date(startTime);
  //         endTime.setMinutes(service.duration);
  //
  //         // Only create slots if endTime is within business hours
  //         if (endTime.getHours() <= hours.end) {
  //           timeSlots.push({
  //             studioId: studio.id,
  //             serviceId: service.id,
  //             startTime,
  //             endTime,
  //             isAvailable: true,
  //             isBooked: false,
  //           });
  //         }
  //       }
  //     }
  //   }
  // }
  //
  // // Batch create time slots
  // await prisma.timeSlot.createMany({
  //   data: timeSlots,
  // });
  //
  // console.log('✅ Created time slots:', timeSlots.length);

  console.log('ℹ️  TimeSlot generation skipped (using dynamic slots)');

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Users: ${customers.length + 1} (1 owner, ${customers.length} customers)`);
  console.log(`   - Studios: 3 (with images and coordinates)`);
  console.log(`   - Bookings: ${bookings.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
  console.log(`   - TimeSlots: 0 (using dynamic slot calculation)`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Owner: owner@example.com / test123');
  console.log('   Customer: anna.mueller@example.com / test123');
  console.log('');
  console.log('ℹ️  Dynamic Slots: Enabled by default');
  console.log('   To disable: Set FEATURE_DYNAMIC_SLOTS=false');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
