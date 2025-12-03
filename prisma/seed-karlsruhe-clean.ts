/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Clean Karlsruhe Seed Script
 *
 * Creates realistic test data:
 * - 6 Studios with dedicated owners (1:1 relationship)
 * - Gallery images for each studio (3-5 images)
 * - 3-5 Services per studio
 * - 80-120 TimeSlots per studio (next 14 days, based on opening hours)
 * - 15-20 Demo bookings
 * - 5 Customer test accounts
 * - Reviews with ratings for studios
 *
 * Key principle: Every studio MUST have an owner!
 *
 * Usage:
 *   npm run seed:clean
 */

import { PrismaClient } from '../app/generated/prisma';
import { addDays, addMinutes, setHours, setMinutes, startOfDay, format } from 'date-fns';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_COST = 10;
const PASSWORD = 'Test1234!'; // Same password for all test accounts

// ============================================
// Gallery Images (using Unsplash for realistic spa/massage images)
// ============================================

// High-quality spa/massage images from Unsplash
const GALLERY_IMAGES = [
  // Spa & Wellness images
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', // Spa stones
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', // Massage
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80', // Spa room
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80', // Wellness
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', // Spa setup
  'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80', // Thai massage
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80', // Spa flowers
  'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80', // Treatment room
  'https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=800&q=80', // Hot stones
  'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&q=80', // Wellness space
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80', // Zen spa
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80', // Massage therapy
];

// Review comments templates
const REVIEW_COMMENTS = [
  'Wunderbare Entspannung! Die Therapeutin war sehr professionell und einfühlsam.',
  'Tolle Massage, sehr zu empfehlen. Werde definitiv wiederkommen.',
  'Angenehme Atmosphäre und kompetentes Personal. Hat mir sehr gut geholfen.',
  'Endlich meine Verspannungen losgeworden! Vielen Dank!',
  'Super Service und sehr freundlich. Die Massage war genau richtig.',
  'Professionelle Behandlung in schönem Ambiente. Sehr zufrieden!',
  'Hatte eine Thai-Massage und bin begeistert. Sehr authentisch!',
  'Perfekt zum Abschalten nach einer stressigen Woche.',
  'Die beste Massage, die ich je hatte. Absolut empfehlenswert!',
  'Sehr gutes Preis-Leistungs-Verhältnis. Komme gerne wieder.',
  'Freundlicher Empfang und top Behandlung. Fühle mich wie neugeboren!',
  'Genau das, was ich gebraucht habe. Therapeut hat genau richtig gedrückt.',
  'Schönes Studio, tolle Atmosphäre, professionelle Massage.',
  'Bin sehr zufrieden. Die 90 Minuten haben sich gelohnt!',
  'Kann dieses Studio nur weiterempfehlen. Top!',
];

// ============================================
// Studio & Owner Data
// ============================================

interface StudioOwnerData {
  // Owner info
  ownerName: string;
  ownerEmail: string;

  // Studio info
  studioName: string;
  studioDescription: string;
  studioAddress: string;
  studioPostalCode: string;
  studioPhone: string;
  studioEmail: string;
  latitude: number;
  longitude: number;
  capacity: number;

  // Opening hours
  openingHours: any;

  // Services to create
  services: Array<{
    name: string;
    description: string;
    price: number;
    duration: number;
  }>;
}

const KARLSRUHE_STUDIOS: StudioOwnerData[] = [
  {
    // Owner
    ownerName: 'Maria Schmidt',
    ownerEmail: 'maria.schmidt@siamspa-ka.de',

    // Studio
    studioName: 'Siam Spa Karlsruhe',
    studioDescription: 'Authentische Thai-Massage im Herzen der Innenstadt-West. Traditionelle Techniken treffen auf modernes Ambiente. Unsere erfahrenen Therapeuten aus Thailand sorgen für tiefe Entspannung.',
    studioAddress: 'Kaiserstraße 134',
    studioPostalCode: '76133',
    studioPhone: '+49 721 123 4501',
    studioEmail: 'info@siamspa-ka.de',
    latitude: 49.0094,
    longitude: 8.4044,
    capacity: 2,

    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },

    services: [
      {
        name: 'Thai-Massage 60 Min',
        description: 'Klassische Thai-Massage mit Dehnung und Akupressur. Löst Verspannungen und fördert die Durchblutung.',
        price: 65,
        duration: 60,
      },
      {
        name: 'Thai-Massage 90 Min',
        description: 'Ausführliche Thai-Massage für tiefe Entspannung und Regeneration.',
        price: 90,
        duration: 90,
      },
      {
        name: 'Ölmassage 60 Min',
        description: 'Sanfte Massage mit hochwertigen aromatischen Ölen. Ideal zur Entspannung und Hautpflege.',
        price: 70,
        duration: 60,
      },
      {
        name: 'Fußreflexzonenmassage 45 Min',
        description: 'Gezielte Stimulation der Reflexzonen an den Füßen. Wirkt auf den gesamten Körper.',
        price: 50,
        duration: 45,
      },
    ],
  },

  {
    // Owner
    ownerName: 'Thomas Weber',
    ownerEmail: 'thomas.weber@wellness-oase.de',

    // Studio
    studioName: 'Wellness Oase Durlach',
    studioDescription: 'Ihr Rückzugsort für Entspannung in Durlach. Premium-Wellness mit Hot Stone, Aromatherapie und Deep Tissue Massagen. Luxuriöses Ambiente für besondere Momente.',
    studioAddress: 'Pfinztalstraße 67',
    studioPostalCode: '76227',
    studioPhone: '+49 721 123 4502',
    studioEmail: 'info@wellness-oase-durlach.de',
    latitude: 49.0047,
    longitude: 8.4724,
    capacity: 3,

    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '22:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '11:00', close: '18:00' },
    },

    services: [
      {
        name: 'Hot Stone Massage 90 Min',
        description: 'Tiefenentspannung mit heißen Lavasteinen. Die Wärme dringt tief in die Muskulatur ein.',
        price: 95,
        duration: 90,
      },
      {
        name: 'Aromatherapie-Massage 60 Min',
        description: 'Wellness-Massage mit ätherischen Ölen. Entspannt Körper und Geist durch Duft und Berührung.',
        price: 75,
        duration: 60,
      },
      {
        name: 'Deep Tissue Massage 60 Min',
        description: 'Intensive Tiefengewebsmassage. Ideal bei chronischen Verspannungen und Schmerzen.',
        price: 80,
        duration: 60,
      },
      {
        name: 'Wellness-Paket 120 Min',
        description: 'Kombination aus Aromatherapie und Hot Stone. Pure Entspannung für Körper und Seele.',
        price: 140,
        duration: 120,
      },
    ],
  },

  {
    // Owner
    ownerName: 'Sabine Fischer',
    ownerEmail: 'sabine.fischer@thaimassage-ka.de',

    // Studio
    studioName: 'Thai Massage Mühlburg',
    studioDescription: 'Traditionelle Thai-Massage in Mühlburg. Spezialisiert auf Sport-Massage und Paarbehandlungen. Unsere Therapeuten wurden in Thailand ausgebildet.',
    studioAddress: 'Rheinstraße 45',
    studioPostalCode: '76185',
    studioPhone: '+49 721 123 4503',
    studioEmail: 'info@thaimassage-muehlburg.de',
    latitude: 49.0158,
    longitude: 8.3803,
    capacity: 2,

    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '17:00' },
    },

    services: [
      {
        name: 'Traditional Thai-Massage 90 Min',
        description: 'Authentische Thai-Massage mit Yoga-ähnlichen Dehnungen. Traditionelle Technik aus Thailand.',
        price: 85,
        duration: 90,
      },
      {
        name: 'Sportmassage 60 Min',
        description: 'Intensive Massage für Sportler und aktive Menschen. Fördert die Regeneration nach dem Training.',
        price: 70,
        duration: 60,
      },
      {
        name: 'Paarmassage 90 Min',
        description: 'Gemeinsame Entspannung zu zweit in separaten Kabinen. Perfekt für Paare und Freunde.',
        price: 160,
        duration: 90,
      },
    ],
  },

  {
    // Owner
    ownerName: 'Lisa Hoffmann',
    ownerEmail: 'lisa.hoffmann@bamboo-spa.de',

    // Studio
    studioName: 'Bamboo Spa Südstadt',
    studioDescription: 'Modernes Wellness-Studio in der Südstadt. Von klassischer Massage bis zur Schwedischen Massage - wir bieten ein breites Spektrum für Ihr Wohlbefinden.',
    studioAddress: 'Werderstraße 28',
    studioPostalCode: '76133',
    studioPhone: '+49 721 123 4504',
    studioEmail: 'info@bamboo-spa-suedstadt.de',
    latitude: 48.9918,
    longitude: 8.3986,
    capacity: 2,

    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },

    services: [
      {
        name: 'Schwedische Massage 60 Min',
        description: 'Klassische Massage mit fließenden Bewegungen. Perfekt für Einsteiger und zur allgemeinen Entspannung.',
        price: 65,
        duration: 60,
      },
      {
        name: 'Rückenmassage 45 Min',
        description: 'Fokussierte Behandlung von Rücken, Nacken und Schultern. Löst Verspannungen vom Alltag.',
        price: 55,
        duration: 45,
      },
      {
        name: 'Ganzkörpermassage 90 Min',
        description: 'Umfassende Entspannung von Kopf bis Fuß. Wellness pur für Körper und Geist.',
        price: 90,
        duration: 90,
      },
      {
        name: 'Express-Massage 30 Min',
        description: 'Schnelle Entspannung in der Mittagspause. Fokus auf Problemzonen.',
        price: 40,
        duration: 30,
      },
    ],
  },

  {
    // Owner
    ownerName: 'Michael Schneider',
    ownerEmail: 'michael.schneider@lotus-spa.de',

    // Studio
    studioName: 'Lotus Spa Weststadt',
    studioDescription: 'Premium Wellness-Oase in der Weststadt. Exklusive Behandlungen in luxuriösem Ambiente. Gönnen Sie sich eine Auszeit vom Alltag.',
    studioAddress: 'Kriegsstraße 89',
    studioPostalCode: '76133',
    studioPhone: '+49 721 123 4505',
    studioEmail: 'info@lotus-spa-weststadt.de',
    latitude: 49.0025,
    longitude: 8.3803,
    capacity: 3,

    openingHours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '23:00' },
      saturday: { open: '11:00', close: '21:00' },
      sunday: { open: '12:00', close: '20:00' },
    },

    services: [
      {
        name: 'Luxury Aromatherapie 90 Min',
        description: 'Premium Aromatherapie mit exklusiven ätherischen Ölen. Pure Entspannung für die Sinne.',
        price: 110,
        duration: 90,
      },
      {
        name: 'VIP Hot Stone 120 Min',
        description: 'Exklusive Hot Stone Behandlung mit Gesichtsmassage. Wellness auf höchstem Niveau.',
        price: 150,
        duration: 120,
      },
      {
        name: 'Detox-Massage 60 Min',
        description: 'Entgiftende Massage mit speziellen Ölen. Fördert Lymphfluss und Entschlackung.',
        price: 85,
        duration: 60,
      },
    ],
  },

  {
    // Owner
    ownerName: 'Anna Richter',
    ownerEmail: 'anna.richter@zen-wellness.de',

    // Studio
    studioName: 'Zen Wellness Nordstadt',
    studioDescription: 'Finden Sie Ihre innere Ruhe in unserem Wellness-Tempel in der Nordstadt. Asiatische Massagetechniken vereint mit westlichen Entspannungsmethoden.',
    studioAddress: 'Erzbergerstraße 52',
    studioPostalCode: '76133',
    studioPhone: '+49 721 123 4506',
    studioEmail: 'info@zen-wellness-nordstadt.de',
    latitude: 49.0194,
    longitude: 8.4103,
    capacity: 2,

    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '19:00' },
      sunday: { open: '11:00', close: '18:00' },
    },

    services: [
      {
        name: 'Zen Thai-Massage 60 Min',
        description: 'Harmonisierende Thai-Massage für Balance von Körper und Geist.',
        price: 68,
        duration: 60,
      },
      {
        name: 'Meditation & Massage 90 Min',
        description: 'Kombination aus geführter Meditation und sanfter Massage. Ganzheitliche Entspannung.',
        price: 95,
        duration: 90,
      },
      {
        name: 'Akupressur-Massage 60 Min',
        description: 'Traditionelle chinesische Akupressur. Aktiviert Energiefluss und löst Blockaden.',
        price: 75,
        duration: 60,
      },
      {
        name: 'Chakra-Balance 75 Min',
        description: 'Energiearbeit und Massage zur Harmonisierung der Chakren.',
        price: 85,
        duration: 75,
      },
    ],
  },
];

// ============================================
// Customer Test Accounts
// ============================================

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

const CUSTOMERS: CustomerData[] = [
  {
    name: 'Anna Müller',
    email: 'anna.mueller@example.com',
    phone: '+49 721 555 1001',
  },
  {
    name: 'Max Schmidt',
    email: 'max.schmidt@example.com',
    phone: '+49 721 555 1002',
  },
  {
    name: 'Lisa Wagner',
    email: 'lisa.wagner@example.com',
    phone: '+49 721 555 1003',
  },
  {
    name: 'Tom Becker',
    email: 'tom.becker@example.com',
    phone: '+49 721 555 1004',
  },
  {
    name: 'Sarah Hoffmann',
    email: 'sarah.hoffmann@example.com',
    phone: '+49 721 555 1005',
  },
];

// ============================================
// Utility Functions
// ============================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function isWithinOpeningHours(date: Date, openingHours: any): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  const hours = openingHours[dayName];

  if (!hours || hours.closed) {
    return false;
  }

  const timeStr = format(date, 'HH:mm');
  return timeStr >= hours.open && timeStr < hours.close;
}

function isLunchBreak(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Lunch break: 12:30 - 13:30
  return (hours === 12 && minutes >= 30) || (hours === 13 && minutes < 30);
}

// ============================================
// Main Seed Functions
// ============================================

async function clearDatabase(): Promise<void> {
  console.log('🧹 Clearing database...\n');

  // Delete all data in correct order (respecting foreign keys)
  await prisma.review.deleteMany({});
  await prisma.newBooking.deleteMany({});
  await prisma.blockedTime.deleteMany({});
  await prisma.timeSlot.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.studioOwnership.deleteMany({});
  await prisma.studio.deleteMany({});

  // Delete test users (keep only production users if any)
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: '@example.com' } },
        { email: { contains: '@siamspa-ka.de' } },
        { email: { contains: '@wellness-oase.de' } },
        { email: { contains: '@thaimassage-ka.de' } },
        { email: { contains: '@bamboo-spa.de' } },
        { email: { contains: '@lotus-spa.de' } },
        { email: { contains: '@zen-wellness.de' } },
      ],
    },
  });

  console.log('   ✅ Database cleared\n');
}

async function createCustomers(): Promise<Map<string, string>> {
  console.log('👥 Creating customer accounts...\n');

  const hashedPassword = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const customerMap = new Map<string, string>();

  for (const customer of CUSTOMERS) {
    const user = await prisma.user.create({
      data: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        password: hashedPassword,
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
        isActive: true,
      },
    });

    customerMap.set(customer.email, user.id);
    console.log(`   ✅ ${customer.name} (${customer.email})`);
  }

  console.log();
  return customerMap;
}

async function createStudiosWithOwners(): Promise<Map<string, { studioId: string; serviceIds: string[] }>> {
  console.log('🏢 Creating studios with owners...\n');

  const hashedPassword = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const studioMap = new Map<string, { studioId: string; serviceIds: string[] }>();

  for (const data of KARLSRUHE_STUDIOS) {
    // 1. Create Owner
    const owner = await prisma.user.create({
      data: {
        email: data.ownerEmail,
        name: data.ownerName,
        password: hashedPassword,
        primaryRole: 'STUDIO_OWNER',
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // 2. Create Studio with gallery images
    // Select 3-5 random images for this studio
    const imageCount = randomInt(3, 5);
    const shuffledImages = [...GALLERY_IMAGES].sort(() => Math.random() - 0.5);
    const studioImages = shuffledImages.slice(0, imageCount);

    const studio = await prisma.studio.create({
      data: {
        name: data.studioName,
        description: data.studioDescription,
        address: data.studioAddress,
        city: 'Karlsruhe',
        postalCode: data.studioPostalCode,
        phone: data.studioPhone,
        email: data.studioEmail,
        latitude: data.latitude,
        longitude: data.longitude,
        openingHours: data.openingHours,
        capacity: data.capacity,
        galleryImages: studioImages,
        // Initial rating will be updated after reviews are created
        averageRating: null,
        totalReviews: 0,
      },
    });

    // 3. Link Owner to Studio
    await prisma.studioOwnership.create({
      data: {
        userId: owner.id,
        studioId: studio.id,
      },
    });

    // 4. Create Services
    const serviceIds: string[] = [];
    for (const serviceData of data.services) {
      const service = await prisma.service.create({
        data: {
          studioId: studio.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
        },
      });
      serviceIds.push(service.id);
    }

    studioMap.set(studio.id, { studioId: studio.id, serviceIds });

    console.log(`   ✅ ${data.studioName}`);
    console.log(`      Owner: ${data.ownerName} (${data.ownerEmail})`);
    console.log(`      Services: ${data.services.length}`);
    console.log();
  }

  return studioMap;
}

async function generateTimeSlots(
  studioMap: Map<string, { studioId: string; serviceIds: string[] }>
): Promise<string[]> {
  console.log('📅 Generating time slots...\n');

  const bookedSlotIds: string[] = [];
  const today = startOfDay(new Date());

  for (const [studioId, data] of studioMap) {
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio || !studio.openingHours || data.serviceIds.length === 0) {
      continue;
    }

    let totalSlots = 0;
    let availableSlots = 0;
    let bookedSlots = 0;

    // Generate slots for past 7 days (for completed bookings/reviews) and next 14 days
    for (let dayOffset = -7; dayOffset < 14; dayOffset++) {
      const currentDay = addDays(today, dayOffset);
      const isPastDay = dayOffset < 0;

      // 30-minute intervals
      const slotInterval = 30;

      // Generate slots from 8:00 to 22:00
      for (let hour = 8; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const slotStart = setMinutes(setHours(currentDay, hour), minute);
          const slotEnd = addMinutes(slotStart, slotInterval);

          // Skip if outside opening hours
          if (!isWithinOpeningHours(slotStart, studio.openingHours)) {
            continue;
          }

          // Skip lunch break
          if (isLunchBreak(slotStart)) {
            continue;
          }

          // Randomly select service
          const serviceId = randomElement(data.serviceIds);

          // For past days: 60% booked (for reviews), 40% available (not used)
          // For future days: 70% available, 30% booked
          let isBooked: boolean;
          let isAvailable: boolean;

          if (isPastDay) {
            isBooked = Math.random() < 0.6; // 60% booked for past
            isAvailable = false; // Past slots are not available
          } else {
            isBooked = Math.random() < 0.3; // 30% booked for future
            isAvailable = !isBooked;
          }

          const slot = await prisma.timeSlot.create({
            data: {
              studioId,
              serviceId,
              startTime: slotStart,
              endTime: slotEnd,
              isAvailable,
              isBooked,
            },
          });

          totalSlots++;

          if (isBooked) {
            bookedSlotIds.push(slot.id);
            bookedSlots++;
          } else {
            availableSlots++;
          }
        }
      }
    }

    console.log(
      `   ✅ ${studio.name}: ${totalSlots} slots (${availableSlots} available, ${bookedSlots} booked)`
    );
  }

  console.log();
  return bookedSlotIds;
}

async function createBookings(
  bookedSlotIds: string[],
  customerMap: Map<string, string>
): Promise<string[]> {
  console.log('📝 Creating demo bookings...\n');

  const customerIds = Array.from(customerMap.values());

  // Group booked slots by studio to ensure even distribution
  const slotsByStudio = new Map<string, string[]>();
  for (const slotId of bookedSlotIds) {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
      select: { studioId: true },
    });
    if (slot) {
      const existing = slotsByStudio.get(slot.studioId) || [];
      existing.push(slotId);
      slotsByStudio.set(slot.studioId, existing);
    }
  }

  // Select ~3-4 bookings per studio (ensuring past bookings for reviews)
  const selectedSlotIds: string[] = [];
  for (const [studioId, slots] of slotsByStudio) {
    // Separate past and future slots
    const pastSlots: string[] = [];
    const futureSlots: string[] = [];

    for (const slotId of slots) {
      const slot = await prisma.timeSlot.findUnique({
        where: { id: slotId },
        select: { startTime: true },
      });
      if (slot) {
        if (slot.startTime < new Date()) {
          pastSlots.push(slotId);
        } else {
          futureSlots.push(slotId);
        }
      }
    }

    // Take 3-4 past bookings (for reviews) and 1-2 future bookings per studio
    const shuffledPast = pastSlots.sort(() => Math.random() - 0.5);
    const shuffledFuture = futureSlots.sort(() => Math.random() - 0.5);

    selectedSlotIds.push(...shuffledPast.slice(0, randomInt(3, 4)));
    selectedSlotIds.push(...shuffledFuture.slice(0, randomInt(1, 2)));
  }

  const createdBookingIds: string[] = [];

  for (const slotId of selectedSlotIds) {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
      include: { service: true },
    });

    if (!slot || !slot.service) continue;

    const customerId = randomElement(customerIds);
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) continue;

    // Create booking - past bookings should be CONFIRMED (completed)
    const isPast = slot.startTime < new Date();
    const status = isPast ? 'CONFIRMED' : (Math.random() < 0.8 ? 'CONFIRMED' : 'PENDING');

    const booking = await prisma.newBooking.create({
      data: {
        studioId: slot.studioId,
        serviceId: slot.serviceId,
        customerId: customer.id,
        customerName: customer.name || '',
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        preferredDateTime: slot.startTime,
        status,
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
      },
    });

    createdBookingIds.push(booking.id);
  }

  console.log(`   ✅ Created ${createdBookingIds.length} bookings\n`);
  return createdBookingIds;
}

async function createReviews(
  bookingIds: string[],
  customerMap: Map<string, string>
): Promise<void> {
  console.log('⭐ Creating reviews...\n');

  // Get all past confirmed bookings (they can have reviews)
  const completedBookings = await prisma.newBooking.findMany({
    where: {
      id: { in: bookingIds },
      status: 'CONFIRMED',
      preferredDateTime: { lt: new Date() }, // Only past bookings
    },
    include: {
      studio: true,
    },
  });

  // Group by studio to ensure all studios get reviews
  const bookingsByStudio = new Map<string, typeof completedBookings>();
  for (const booking of completedBookings) {
    const existing = bookingsByStudio.get(booking.studioId) || [];
    existing.push(booking);
    bookingsByStudio.set(booking.studioId, existing);
  }

  // For studios without past bookings, create additional bookings
  const allStudios = await prisma.studio.findMany({ select: { id: true, name: true } });
  const customerIds = Array.from(customerMap.values());

  for (const studio of allStudios) {
    if (!bookingsByStudio.has(studio.id) || bookingsByStudio.get(studio.id)!.length === 0) {
      // Find past booked slots for this studio
      const pastBookedSlots = await prisma.timeSlot.findMany({
        where: {
          studioId: studio.id,
          isBooked: true,
          startTime: { lt: new Date() },
        },
        include: { service: true },
        take: 3,
      });

      for (const slot of pastBookedSlots) {
        if (!slot.service) continue;

        const customerId = randomElement(customerIds);
        const customer = await prisma.user.findUnique({
          where: { id: customerId },
        });

        if (!customer) continue;

        const booking = await prisma.newBooking.create({
          data: {
            studioId: studio.id,
            serviceId: slot.serviceId,
            customerId: customer.id,
            customerName: customer.name || '',
            customerEmail: customer.email,
            customerPhone: customer.phone || '',
            preferredDateTime: slot.startTime,
            status: 'CONFIRMED',
            explicitHealthConsent: true,
            healthConsentGivenAt: new Date(),
          },
          include: { studio: true },
        });

        const existing = bookingsByStudio.get(studio.id) || [];
        existing.push(booking);
        bookingsByStudio.set(studio.id, existing);
      }
    }
  }

  // Create reviews for each studio
  const bookingsToReview: typeof completedBookings = [];
  for (const [studioId, studioBookings] of bookingsByStudio) {
    // Take 60-80% of bookings per studio
    const count = Math.max(1, Math.floor(studioBookings.length * (0.6 + Math.random() * 0.2)));
    bookingsToReview.push(...studioBookings.slice(0, count));
  }

  // Track ratings per studio for average calculation
  const studioRatings: Map<string, number[]> = new Map();

  for (const booking of bookingsToReview) {
    if (!booking.customerId) continue;

    // Generate rating (weighted towards positive reviews: 4-5 stars more common)
    const ratingRand = Math.random();
    let rating: number;
    if (ratingRand < 0.05) {
      rating = 2; // 5% chance of 2 stars
    } else if (ratingRand < 0.15) {
      rating = 3; // 10% chance of 3 stars
    } else if (ratingRand < 0.45) {
      rating = 4; // 30% chance of 4 stars
    } else {
      rating = 5; // 55% chance of 5 stars
    }

    const comment = randomElement(REVIEW_COMMENTS);

    // Create review (with a past date)
    const reviewDate = new Date(booking.preferredDateTime);
    reviewDate.setDate(reviewDate.getDate() + randomInt(1, 7)); // 1-7 days after booking

    await prisma.review.create({
      data: {
        studioId: booking.studioId,
        userId: booking.customerId,
        bookingId: booking.id,
        rating,
        comment,
        isVisible: true,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      },
    });

    // Track for average calculation
    if (!studioRatings.has(booking.studioId)) {
      studioRatings.set(booking.studioId, []);
    }
    studioRatings.get(booking.studioId)!.push(rating);
  }

  // Update studio average ratings
  for (const [studioId, ratings] of studioRatings) {
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: ratings.length,
      },
    });
  }

  console.log(`   ✅ Created ${bookingsToReview.length} reviews\n`);
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🌱 Seeding Clean Karlsruhe Data...\n');
  console.log('═'.repeat(60));
  console.log();

  try {
    await clearDatabase();

    const customerMap = await createCustomers();

    const studioMap = await createStudiosWithOwners();

    const bookedSlotIds = await generateTimeSlots(studioMap);

    const bookingIds = await createBookings(bookedSlotIds, customerMap);

    await createReviews(bookingIds, customerMap);

    // Get final review counts
    const totalReviews = await prisma.review.count();
    const studios = await prisma.studio.findMany({
      select: { name: true, averageRating: true, totalReviews: true, galleryImages: true },
    });

    console.log('═'.repeat(60));
    console.log('\n✅ Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   Studios: ${KARLSRUHE_STUDIOS.length}`);
    console.log(`   Studio Owners: ${KARLSRUHE_STUDIOS.length}`);
    console.log(`   Customers: ${CUSTOMERS.length}`);
    console.log(`   Bookings: ~20`);
    console.log(`   Reviews: ${totalReviews}`);
    console.log();
    console.log('🖼️  Gallery Images:');
    studios.forEach((s) => {
      const imageCount = Array.isArray(s.galleryImages) ? s.galleryImages.length : 0;
      console.log(`   ${s.name}: ${imageCount} images`);
    });
    console.log();
    console.log('⭐ Studio Ratings:');
    studios.forEach((s) => {
      const rating = s.averageRating ? `${s.averageRating.toFixed(1)} ⭐ (${s.totalReviews} reviews)` : 'No reviews yet';
      console.log(`   ${s.name}: ${rating}`);
    });
    console.log();
    console.log('🔑 All accounts use password: Test1234!');
    console.log();
    console.log('👥 Studio Owners:');
    KARLSRUHE_STUDIOS.forEach((studio, i) => {
      console.log(`   ${i + 1}. ${studio.ownerName} - ${studio.ownerEmail}`);
      console.log(`      Studio: ${studio.studioName}`);
    });
    console.log();
    console.log('🧪 Test the application:');
    console.log('   1. Visit: http://localhost:3000');
    console.log('   2. Login as: maria.schmidt@siamspa-ka.de');
    console.log('   3. Should redirect to: /business');
    console.log();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
