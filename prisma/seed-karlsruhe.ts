/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Karlsruhe Test Data Seed Script
 *
 * Creates realistic test data for local development and testing:
 * - 6-8 Studios in different Karlsruhe districts
 * - 3-5 Services per studio (matching SERVICE_TYPES)
 * - 50-100 TimeSlots per studio (next 14 days)
 * - 10-15 Demo bookings
 * - 5-10 BlockedTimes
 *
 * Usage:
 *   npm run seed:karlsruhe
 */

import { PrismaClient } from '../app/generated/prisma';
import { addDays, addMinutes, setHours, setMinutes, startOfDay, format } from 'date-fns';
import { SERVICE_TYPES } from '../lib/constants/serviceTypes';

const prisma = new PrismaClient();

// ============================================
// Karlsruhe Location Data
// ============================================

interface Location {
  name: string;
  lat: number;
  lng: number;
  streets: string[];
}

const KARLSRUHE_LOCATIONS: Location[] = [
  {
    name: 'Innenstadt',
    lat: 49.0094,
    lng: 8.4044,
    streets: ['Kaiserstraße', 'Waldstraße', 'Karlstraße', 'Erbprinzenstraße', 'Ritterstraße'],
  },
  {
    name: 'Durlach',
    lat: 49.0047,
    lng: 8.4724,
    streets: ['Pfinztalstraße', 'Zunftstraße', 'Amthausstraße', 'Weiherhofstraße'],
  },
  {
    name: 'Mühlburg',
    lat: 49.0158,
    lng: 8.3803,
    streets: ['Rheinstraße', 'Windthorststraße', 'Daxlander Straße', 'Weinbrennerstraße'],
  },
  {
    name: 'Südstadt',
    lat: 48.9918,
    lng: 8.3986,
    streets: ['Werderstraße', 'Beiertheimer Allee', 'Mathystraße', 'Augartenstraße'],
  },
  {
    name: 'Weststadt',
    lat: 49.0025,
    lng: 8.3803,
    streets: ['Kriegsstraße', 'Hertzstraße', 'Brauerstraße', 'Nancystraße'],
  },
  {
    name: 'Nordstadt',
    lat: 49.0194,
    lng: 8.4103,
    streets: ['Erzbergerstraße', 'Yorckstraße', 'Moltkestraße', 'Händelstraße'],
  },
];

// ============================================
// Studio Templates
// ============================================

interface StudioTemplate {
  name: string;
  descriptionTemplate: string;
  emailDomain: string;
  capacity: number;
  openingHours: any;
}

const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    name: 'Thai Wellness Oase',
    descriptionTemplate: 'Authentische Thai-Massage in {district}. Erfahrene Therapeuten sorgen für tiefe Entspannung und Regeneration. Traditionelle Techniken treffen auf modernes Ambiente.',
    emailDomain: 'thai-wellness-oase.de',
    capacity: 2,
    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
  },
  {
    name: 'Bamboo Spa Karlsruhe',
    descriptionTemplate: 'Exklusive Wellness-Massagen im Herzen von {district}. Lassen Sie den Alltag hinter sich und genießen Sie professionelle Behandlungen in ruhiger Atmosphäre.',
    emailDomain: 'bamboo-spa-ka.de',
    capacity: 3,
    openingHours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '10:00', close: '19:00' },
      sunday: { open: '11:00', close: '17:00' },
    },
  },
  {
    name: 'Sabai Massage Studio',
    descriptionTemplate: 'Sabai bedeutet "Wohlfühlen" auf Thai – und genau das ist unser Versprechen. Professionelle Thai-Massage in {district} mit zertifizierten Therapeuten.',
    emailDomain: 'sabai-massage.de',
    capacity: 2,
    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
  },
  {
    name: 'Lotus Spa & Wellness',
    descriptionTemplate: 'Premium-Wellness in {district}. Hochwertige Massagen und Spa-Behandlungen in luxuriösem Ambiente. Perfekt für besondere Momente der Entspannung.',
    emailDomain: 'lotus-spa-karlsruhe.de',
    capacity: 3,
    openingHours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '11:00', close: '21:00' },
      sunday: { open: '12:00', close: '20:00' },
    },
  },
  {
    name: 'Entspannung Pur',
    descriptionTemplate: 'Ihr Studio für ganzheitliche Entspannung in {district}. Von klassischer Massage bis zur Hot Stone-Behandlung bieten wir ein breites Spektrum an Wellness-Angeboten.',
    emailDomain: 'entspannung-pur-ka.de',
    capacity: 2,
    openingHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { closed: true },
    },
  },
  {
    name: 'Siam Massage Karlsruhe',
    descriptionTemplate: 'Traditionelle Thai-Massage auf höchstem Niveau in {district}. Unsere Therapeuten wurden in Thailand ausgebildet und bringen jahrelange Erfahrung mit.',
    emailDomain: 'siam-massage-ka.de',
    capacity: 1,
    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '11:00', close: '17:00' },
    },
  },
  {
    name: 'Zen Wellness & Spa',
    descriptionTemplate: 'Finden Sie Ihre innere Ruhe in unserem Wellness-Tempel in {district}. Asiatische Massagetechniken und westliche Entspannungsmethoden vereint unter einem Dach.',
    emailDomain: 'zen-wellness-ka.de',
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
  },
  {
    name: 'Golden Touch Massage',
    descriptionTemplate: 'Professionelle Massagen für Körper und Seele in {district}. Sportmassagen, Wellness-Behandlungen und therapeutische Anwendungen von erfahrenen Therapeuten.',
    emailDomain: 'golden-touch-ka.de',
    capacity: 2,
    openingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { closed: true },
    },
  },
];

// ============================================
// Service Templates
// ============================================

interface ServiceTemplate {
  nameTemplate: string;
  descriptionTemplate: string;
  serviceType: string;
  durationOptions: number[];
  priceRange: { min: number; max: number };
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    nameTemplate: 'Traditionelle Thai-Massage',
    descriptionTemplate: 'Klassische Thai-Massage mit Dehnung und Akupressur. Löst Verspannungen und fördert die Durchblutung.',
    serviceType: SERVICE_TYPES.TRADITIONAL_THAI,
    durationOptions: [60, 90, 120],
    priceRange: { min: 55, max: 75 },
  },
  {
    nameTemplate: 'Thai-Massage',
    descriptionTemplate: 'Authentische Thai-Massage zur Entspannung und Regeneration. Traditionelle Techniken für Ihr Wohlbefinden.',
    serviceType: SERVICE_TYPES.THAI,
    durationOptions: [60, 90],
    priceRange: { min: 50, max: 70 },
  },
  {
    nameTemplate: 'Entspannende Ölmassage',
    descriptionTemplate: 'Sanfte Massage mit hochwertigen Ölen. Ideal zur Entspannung und Hautpflege.',
    serviceType: SERVICE_TYPES.OIL,
    durationOptions: [60, 90],
    priceRange: { min: 60, max: 85 },
  },
  {
    nameTemplate: 'Sportmassage',
    descriptionTemplate: 'Intensive Massage für Sportler und aktive Menschen. Löst tiefe Verspannungen und fördert die Regeneration.',
    serviceType: SERVICE_TYPES.SPORT,
    durationOptions: [45, 60],
    priceRange: { min: 50, max: 70 },
  },
  {
    nameTemplate: 'Hot Stone Massage',
    descriptionTemplate: 'Tiefenentspannung mit heißen Lavasteinen. Die Wärme dringt tief in die Muskulatur ein.',
    serviceType: SERVICE_TYPES.HOT_STONE,
    durationOptions: [90],
    priceRange: { min: 80, max: 100 },
  },
  {
    nameTemplate: 'Aromatherapie-Massage',
    descriptionTemplate: 'Wellness-Massage mit ätherischen Ölen. Entspannt Körper und Geist durch Duft und Berührung.',
    serviceType: SERVICE_TYPES.AROMATHERAPY,
    durationOptions: [60, 90],
    priceRange: { min: 65, max: 90 },
  },
  {
    nameTemplate: 'Fußreflexzonenmassage',
    descriptionTemplate: 'Gezielte Stimulation der Reflexzonen an den Füßen. Wirkt auf den gesamten Körper.',
    serviceType: SERVICE_TYPES.REFLEXOLOGY,
    durationOptions: [45],
    priceRange: { min: 45, max: 60 },
  },
  {
    nameTemplate: 'Schwedische Massage',
    descriptionTemplate: 'Klassische Massage mit fließenden Bewegungen. Perfekt für Einsteiger und zur allgemeinen Entspannung.',
    serviceType: SERVICE_TYPES.SWEDISH,
    durationOptions: [60],
    priceRange: { min: 55, max: 70 },
  },
  {
    nameTemplate: 'Wellness-Massage',
    descriptionTemplate: 'Ganzheitliche Entspannungsmassage für Körper und Seele. Individuell auf Ihre Bedürfnisse abgestimmt.',
    serviceType: SERVICE_TYPES.WELLNESS,
    durationOptions: [60, 90],
    priceRange: { min: 60, max: 80 },
  },
  {
    nameTemplate: 'Deep Tissue Massage',
    descriptionTemplate: 'Intensive Tiefengewebsmassage. Ideal bei chronischen Verspannungen und Schmerzen.',
    serviceType: SERVICE_TYPES.DEEP_TISSUE,
    durationOptions: [60, 90],
    priceRange: { min: 70, max: 95 },
  },
];

// ============================================
// Demo Customer Names
// ============================================

const CUSTOMER_NAMES = [
  { firstName: 'Max', lastName: 'Müller' },
  { firstName: 'Anna', lastName: 'Schmidt' },
  { firstName: 'Thomas', lastName: 'Wagner' },
  { firstName: 'Julia', lastName: 'Becker' },
  { firstName: 'Michael', lastName: 'Fischer' },
  { firstName: 'Sarah', lastName: 'Weber' },
  { firstName: 'Daniel', lastName: 'Meyer' },
  { firstName: 'Laura', lastName: 'Hoffmann' },
  { firstName: 'Markus', lastName: 'Schneider' },
  { firstName: 'Lisa', lastName: 'Koch' },
  { firstName: 'Stefan', lastName: 'Richter' },
  { firstName: 'Nina', lastName: 'Klein' },
  { firstName: 'Patrick', lastName: 'Wolf' },
  { firstName: 'Sophie', lastName: 'Schröder' },
  { firstName: 'Alexander', lastName: 'Neumann' },
];

const BOOKING_MESSAGES = [
  'Bitte warmes Öl verwenden.',
  'Erste Massage - bin etwas nervös.',
  'Fokus bitte auf Schultern und Nacken.',
  'Mittlerer Druck bevorzugt.',
  'Keine starken Düfte bitte, bin empfindlich.',
  null, // Some bookings without message
  'Kann 5 Minuten früher kommen.',
  'Habe Rückenprobleme, bitte vorsichtig sein.',
  null,
  'Freue mich auf die Massage!',
];

const BLOCKED_REASONS = [
  'Mittagspause',
  'Teammeeting',
  'Fortbildung',
  'Wartung',
  'Privat',
  'Inventur',
  'Reinigung',
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

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhoneNumber(): string {
  const area = randomInt(100, 999);
  const first = randomInt(100, 999);
  const second = randomInt(100, 999);
  return `+49 721 ${area} ${first} ${second}`;
}

function isWithinOpeningHours(
  date: Date,
  openingHours: any
): boolean {
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
  return (hours === 12 && minutes >= 0) || (hours === 13 && minutes === 0);
}

// ============================================
// Main Seed Functions
// ============================================

async function clearExistingData(): Promise<void> {
  console.log('🧹 Clearing existing test data...');

  // Delete test studios (only Karlsruhe test data)
  const testStudios = await prisma.studio.findMany({
    where: {
      city: 'Karlsruhe',
    },
  });

  for (const studio of testStudios) {
    // Cascade delete will handle related records
    await prisma.studio.delete({
      where: { id: studio.id },
    });
  }

  console.log(`   Deleted ${testStudios.length} test studios`);
}

async function seedStudios(): Promise<string[]> {
  console.log('🏢 Creating studios...');

  const studioIds: string[] = [];
  const studioCount = randomInt(6, 8);
  const selectedTemplates = randomElements(STUDIO_TEMPLATES, studioCount);

  for (let i = 0; i < studioCount; i++) {
    const template = selectedTemplates[i];
    const location = KARLSRUHE_LOCATIONS[i % KARLSRUHE_LOCATIONS.length];
    const street = randomElement(location.streets);
    const houseNumber = randomInt(1, 150);

    const studio = await prisma.studio.create({
      data: {
        name: template.name,
        description: template.descriptionTemplate.replace('{district}', location.name),
        address: `${street} ${houseNumber}`,
        city: 'Karlsruhe',
        postalCode: `761${randomInt(30, 39)}`,
        phone: generatePhoneNumber(),
        email: `info@${template.emailDomain}`,
        latitude: location.lat + (Math.random() - 0.5) * 0.01, // Small variation
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        openingHours: template.openingHours,
        capacity: template.capacity,
      },
    });

    studioIds.push(studio.id);
    console.log(`   ✅ ${studio.name} (${location.name})`);
  }

  return studioIds;
}

async function seedServices(studioIds: string[]): Promise<Map<string, string[]>> {
  console.log('💆 Creating services...');

  const studioServicesMap = new Map<string, string[]>();

  for (const studioId of studioIds) {
    const serviceCount = randomInt(3, 5);
    const selectedTemplates = randomElements(SERVICE_TEMPLATES, serviceCount);
    const serviceIds: string[] = [];

    for (const template of selectedTemplates) {
      const duration = randomElement(template.durationOptions);
      const price = randomInt(template.priceRange.min, template.priceRange.max);

      const service = await prisma.service.create({
        data: {
          studioId,
          name: `${template.nameTemplate} ${duration} Min`,
          description: template.descriptionTemplate,
          price,
          duration,
        },
      });

      serviceIds.push(service.id);
    }

    studioServicesMap.set(studioId, serviceIds);
    console.log(`   ✅ Studio ${studioIds.indexOf(studioId) + 1}: ${serviceCount} services`);
  }

  return studioServicesMap;
}

async function seedTimeSlots(
  studioIds: string[],
  studioServicesMap: Map<string, string[]>
): Promise<{ bookedSlotIds: string[]; blockedSlotIds: string[] }> {
  console.log('📅 Creating time slots...');

  const bookedSlotIds: string[] = [];
  const blockedSlotIds: string[] = [];
  const today = startOfDay(new Date());

  for (const studioId of studioIds) {
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio || !studio.openingHours) continue;

    const serviceIds = studioServicesMap.get(studioId) || [];
    if (serviceIds.length === 0) continue;

    let totalSlots = 0;
    let availableSlots = 0;
    let bookedSlots = 0;
    let blockedSlots = 0;

    // Generate slots for next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const currentDay = addDays(today, dayOffset);

      // Determine slot interval (30 or 60 minutes)
      const slotInterval = randomElement([30, 60]);

      // Generate slots from opening to closing time
      for (let hour = 8; hour < 21; hour++) {
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
          const serviceId = randomElement(serviceIds);

          // Determine slot status (60% available, 20% booked, 20% blocked)
          const rand = Math.random();
          let isAvailable = true;
          let isBooked = false;

          if (rand < 0.2) {
            // 20% blocked
            isAvailable = false;
            isBooked = false;
            blockedSlots++;
          } else if (rand < 0.4) {
            // 20% booked
            isAvailable = false;
            isBooked = true;
            bookedSlots++;
          } else {
            // 60% available
            availableSlots++;
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
          } else if (!isAvailable) {
            blockedSlotIds.push(slot.id);
          }
        }
      }
    }

    console.log(
      `   ✅ Studio ${studioIds.indexOf(studioId) + 1}: ${totalSlots} slots (${availableSlots} available, ${bookedSlots} booked, ${blockedSlots} blocked)`
    );
  }

  return { bookedSlotIds, blockedSlotIds };
}

async function seedBookings(bookedSlotIds: string[]): Promise<void> {
  console.log('📝 Creating bookings...');

  // Create 10-15 bookings from booked slots
  const bookingCount = Math.min(randomInt(10, 15), bookedSlotIds.length);
  const selectedSlotIds = randomElements(bookedSlotIds, bookingCount);

  for (const slotId of selectedSlotIds) {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
      include: { service: true },
    });

    if (!slot || !slot.service) continue;

    const customer = randomElement(CUSTOMER_NAMES);
    const customerName = `${customer.firstName} ${customer.lastName}`;
    const customerEmail = `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@example.com`;
    const customerPhone = generatePhoneNumber();
    const message = randomElement(BOOKING_MESSAGES);

    await prisma.newBooking.create({
      data: {
        studioId: slot.studioId,
        serviceId: slot.serviceId,
        customerName,
        customerEmail,
        customerPhone,
        preferredDateTime: slot.startTime,
        message,
        status: randomElement(['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING']), // 75% confirmed
        explicitHealthConsent: false,
      },
    });

    // Link booking to slot
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: { bookingId: slotId }, // Use slotId as bookingId for simplicity
    });
  }

  console.log(`   ✅ Created ${bookingCount} bookings`);
}

async function seedBlockedTimes(blockedSlotIds: string[]): Promise<void> {
  console.log('🚫 Creating blocked times...');

  // Create 5-10 blocked time ranges from blocked slots
  const blockCount = Math.min(randomInt(5, 10), blockedSlotIds.length);
  const selectedSlotIds = randomElements(blockedSlotIds, blockCount);

  for (const slotId of selectedSlotIds) {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) continue;

    const reason = randomElement(BLOCKED_REASONS);
    const isAllDay = Math.random() < 0.2; // 20% chance of all-day block

    await prisma.blockedTime.create({
      data: {
        studioId: slot.studioId,
        startTime: slot.startTime,
        endTime: isAllDay ? addDays(slot.startTime, 1) : slot.endTime,
        reason,
        isAllDay,
      },
    });
  }

  console.log(`   ✅ Created ${blockCount} blocked times`);
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🌱 Seeding Karlsruhe test data...\n');

  try {
    await clearExistingData();
    console.log('');

    const studioIds = await seedStudios();
    console.log('');

    const studioServicesMap = await seedServices(studioIds);
    console.log('');

    const { bookedSlotIds, blockedSlotIds } = await seedTimeSlots(studioIds, studioServicesMap);
    console.log('');

    await seedBookings(bookedSlotIds);
    console.log('');

    await seedBlockedTimes(blockedSlotIds);
    console.log('');

    console.log('✅ Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   Studios: ${studioIds.length}`);
    console.log(`   Bookings: ${Math.min(randomInt(10, 15), bookedSlotIds.length)}`);
    console.log(`   Blocked Times: ${Math.min(randomInt(5, 10), blockedSlotIds.length)}`);
    console.log('\n🧪 Test the data:');
    console.log('   1. Visit: http://localhost:3000');
    console.log('   2. Search for: Karlsruhe (Radius: 20km)');
    console.log('   3. You should see 6-8 studios with available time slots\n');
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
