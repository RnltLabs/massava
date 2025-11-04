/**
 * Test Data Seeder for Karlsruhe Studios
 *
 * Creates comprehensive test data for development and testing:
 * - 3 massage studios in Karlsruhe (different districts)
 * - Studio owners (with credentials)
 * - 5 test customers
 * - Services for each studio
 * - Time slots for next 30 days
 * - Test bookings (some with encrypted health data)
 *
 * Usage:
 *   npm run db:seed:test
 *
 * WARNING: This will DELETE all existing data!
 */

import { PrismaClient, UserType, BookingStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import { addDays, addMinutes, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

// Test password (same for all test accounts): Test1234!
const TEST_PASSWORD = 'Test1234!'
const SALT_ROUNDS = 10

// ============================================================================
// Studio Data
// ============================================================================

const STUDIOS = [
  {
    name: 'Siam Spa Karlsruhe',
    description: 'Traditionelle Thai-Massage im Herzen von Karlsruhe. Entspannen Sie bei authentischen Massagen in ruhiger Atmosphäre.',
    address: 'Kaiserstraße 134',
    city: 'Karlsruhe',
    postalCode: '76133',
    phone: '+49 721 12345678',
    email: 'info@siamspa-ka.de',
    website: 'https://siamspa-karlsruhe.de',
    lat: 49.0069,
    lng: 8.4037,
    district: 'Innenstadt-West',
    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
    owner: {
      name: 'Maria Schmidt',
      email: 'maria.schmidt@siamspa-ka.de',
      phone: '+49 151 11111111',
    },
    services: [
      {
        name: 'Thai Massage Klassisch',
        description: 'Traditionelle thailändische Massage mit sanften Dehnungen und Druckpunktmassage. Löst Verspannungen und steigert das Wohlbefinden.',
        duration: 90,
        price: 60,
        category: 'MASSAGE',
      },
      {
        name: 'Ölmassage',
        description: 'Entspannende Ganzkörpermassage mit aromatischen Ölen. Perfekt zum Abschalten und Regenerieren.',
        duration: 60,
        price: 50,
        category: 'MASSAGE',
      },
      {
        name: 'Fußreflexzonenmassage',
        description: 'Gezielte Druckpunktmassage der Füße zur Aktivierung der Selbstheilungskräfte.',
        duration: 45,
        price: 35,
        category: 'MASSAGE',
      },
    ],
  },
  {
    name: 'Wellness Oase Durlach',
    description: 'Ihre Wellness-Oase in Durlach. Genießen Sie Hot Stone Massagen, Aromatherapie und mehr in entspannter Atmosphäre.',
    address: 'Pfinztalstraße 67',
    city: 'Karlsruhe',
    postalCode: '76227',
    phone: '+49 721 23456789',
    email: 'kontakt@wellness-oase-durlach.de',
    website: 'https://wellness-oase-durlach.de',
    lat: 48.9989,
    lng: 8.4724,
    district: 'Durlach',
    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
    owner: {
      name: 'Thomas Weber',
      email: 'thomas.weber@wellness-oase.de',
      phone: '+49 152 22222222',
    },
    services: [
      {
        name: 'Hot Stone Massage',
        description: 'Tiefenwirksame Massage mit erhitzten Basaltsteinen. Löst Muskelverspannungen und fördert die Durchblutung.',
        duration: 90,
        price: 75,
        category: 'MASSAGE',
      },
      {
        name: 'Aromatherapie Massage',
        description: 'Ganzheitliche Massage mit ätherischen Ölen zur Entspannung von Körper und Geist.',
        duration: 75,
        price: 60,
        category: 'MASSAGE',
      },
      {
        name: 'Deep Tissue Massage',
        description: 'Intensive Tiefengewebsmassage für Sportler und bei chronischen Verspannungen.',
        duration: 60,
        price: 65,
        category: 'MASSAGE',
      },
    ],
  },
  {
    name: 'Thai Massage Mühlburg',
    description: 'Authentische Thai-Massage in Mühlburg. Vom Einzeltermin bis zur Paarmassage – bei uns finden Sie die perfekte Entspannung.',
    address: 'Rheinstraße 45',
    city: 'Karlsruhe',
    postalCode: '76185',
    phone: '+49 721 34567890',
    email: 'info@thaimassage-muehlburg.de',
    website: 'https://thaimassage-muehlburg.de',
    lat: 49.0037,
    lng: 8.3714,
    district: 'Mühlburg',
    openingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
    owner: {
      name: 'Sabine Fischer',
      email: 'sabine.fischer@thaimassage-ka.de',
      phone: '+49 153 33333333',
    },
    services: [
      {
        name: 'Traditional Thai Massage',
        description: 'Traditionelle 2-stündige Thai-Massage. Das komplette Programm für tiefe Entspannung.',
        duration: 120,
        price: 70,
        category: 'MASSAGE',
      },
      {
        name: 'Paarmassage',
        description: 'Entspannung zu zweit. Genießen Sie eine Massage gemeinsam mit Ihrem Partner in separatem Raum.',
        duration: 90,
        price: 140,
        category: 'MASSAGE',
      },
      {
        name: 'Sport-Massage',
        description: 'Gezielte Massage für Sportler zur Regeneration und Vorbeugung von Verletzungen.',
        duration: 60,
        price: 55,
        category: 'MASSAGE',
      },
    ],
  },
]

// ============================================================================
// Customer Data
// ============================================================================

const CUSTOMERS = [
  {
    name: 'Anna Müller',
    email: 'anna.mueller@example.com',
    phone: '+49 151 12345678',
  },
  {
    name: 'Max Schmidt',
    email: 'max.schmidt@example.com',
    phone: '+49 152 23456789',
  },
  {
    name: 'Lisa Wagner',
    email: 'lisa.wagner@example.com',
    phone: '+49 153 34567890',
  },
  {
    name: 'Tom Becker',
    email: 'tom.becker@example.com',
    phone: '+49 154 45678901',
  },
  {
    name: 'Sarah Hoffmann',
    email: 'sarah.hoffmann@example.com',
    phone: '+49 155 56789012',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

function generateTimeSlots(startDate: Date, days: number): Date[] {
  const slots: Date[] = []
  const timeSlots = [
    { hour: 10, minute: 0 },
    { hour: 11, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 14, minute: 30 },
    { hour: 16, minute: 0 },
    { hour: 17, minute: 30 },
    { hour: 19, minute: 0 }, // Only Mon-Fri
  ]

  for (let day = 0; day < days; day++) {
    const currentDate = addDays(startDate, day)
    const dayOfWeek = currentDate.getDay()

    // Skip Sunday (0)
    if (dayOfWeek === 0) continue

    // Saturday: shorter hours (no 19:00 slot)
    const availableSlots = dayOfWeek === 6 ? timeSlots.slice(0, 5) : timeSlots

    availableSlots.forEach(({ hour, minute }) => {
      const slot = setMinutes(setHours(currentDate, hour), minute)
      slots.push(slot)
    })
  }

  return slots
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function shouldIncludeHealthData(): boolean {
  return Math.random() > 0.5 // 50% chance
}

const HEALTH_DATA_SAMPLES = [
  'Ich habe Rückenschmerzen im unteren Bereich',
  'Verspannungen im Nacken- und Schulterbereich',
  'Bitte keine zu starke Massage wegen Bandscheibenvorfall',
  'Knieschmerzen beim Sport',
  'Migräne-Probleme, bitte sanften Druck',
]

// ============================================================================
// Seeder Main Function
// ============================================================================

async function main() {
  console.log('🌱 Starting Karlsruhe test data seeding...\n')

  try {
    // ========================================================================
    // STEP 1: Clear existing data
    // ========================================================================
    console.log('🗑️  Clearing existing data...')

    await prisma.booking.deleteMany()
    await prisma.timeSlot.deleteMany()
    await prisma.service.deleteMany()
    await prisma.studio.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Existing data cleared\n')

    // ========================================================================
    // STEP 2: Create studio owners
    // ========================================================================
    console.log('👥 Creating studio owners...')

    const hashedPassword = await hashPassword(TEST_PASSWORD)

    const studioOwnersData = STUDIOS.map(studio => ({
      name: studio.owner.name,
      email: studio.owner.email,
      password: hashedPassword,
      phone: studio.owner.phone,
      userType: UserType.STUDIO_OWNER,
      emailVerified: new Date(), // Auto-verify test accounts
    }))

    const createdOwners = await Promise.all(
      studioOwnersData.map(owner => prisma.user.create({ data: owner }))
    )

    console.log(`✅ Created ${createdOwners.length} studio owners`)
    createdOwners.forEach(owner => {
      console.log(`   - ${owner.name} (${owner.email})`)
    })
    console.log()

    // ========================================================================
    // STEP 3: Create customers
    // ========================================================================
    console.log('👤 Creating customers...')

    const customersData = CUSTOMERS.map(customer => ({
      name: customer.name,
      email: customer.email,
      password: hashedPassword,
      phone: customer.phone,
      userType: UserType.CUSTOMER,
      emailVerified: new Date(),
    }))

    const createdCustomers = await Promise.all(
      customersData.map(customer => prisma.user.create({ data: customer }))
    )

    console.log(`✅ Created ${createdCustomers.length} customers`)
    createdCustomers.forEach(customer => {
      console.log(`   - ${customer.name} (${customer.email})`)
    })
    console.log()

    // ========================================================================
    // STEP 4: Create studios with services
    // ========================================================================
    console.log('🏢 Creating studios with services...')

    const createdStudios = []

    for (let i = 0; i < STUDIOS.length; i++) {
      const studioData = STUDIOS[i]
      const owner = createdOwners[i]

      const studio = await prisma.studio.create({
        data: {
          name: studioData.name,
          description: studioData.description,
          address: studioData.address,
          city: studioData.city,
          postalCode: studioData.postalCode,
          phone: studioData.phone,
          email: studioData.email,
          website: studioData.website,
          lat: studioData.lat,
          lng: studioData.lng,
          openingHours: JSON.stringify(studioData.openingHours),
          userId: owner.id,
          verified: true, // Auto-verify test studios
          services: {
            create: studioData.services.map(service => ({
              name: service.name,
              description: service.description,
              duration: service.duration,
              price: service.price,
              category: service.category,
            })),
          },
        },
        include: {
          services: true,
        },
      })

      createdStudios.push(studio)

      console.log(`✅ Created studio: ${studio.name}`)
      console.log(`   Address: ${studio.address}, ${studio.postalCode} ${studio.city}`)
      console.log(`   Services: ${studio.services.length}`)
      studio.services.forEach(service => {
        console.log(`     - ${service.name} (${service.duration}min, €${service.price})`)
      })
      console.log()
    }

    // ========================================================================
    // STEP 5: Create time slots (next 30 days)
    // ========================================================================
    console.log('📅 Creating time slots for next 30 days...')

    const today = new Date()
    const allTimeSlots = generateTimeSlots(today, 30)

    let totalSlotsCreated = 0

    for (const studio of createdStudios) {
      const slots = await Promise.all(
        allTimeSlots.map(startTime => {
          // Calculate end time based on first service duration (assume 90min slots)
          const endTime = addMinutes(startTime, 90)

          return prisma.timeSlot.create({
            data: {
              studioId: studio.id,
              startTime,
              endTime,
              available: true,
            },
          })
        })
      )

      totalSlotsCreated += slots.length
    }

    console.log(`✅ Created ${totalSlotsCreated} time slots (${allTimeSlots.length} per studio)`)
    console.log()

    // ========================================================================
    // STEP 6: Create test bookings
    // ========================================================================
    console.log('📝 Creating test bookings...')

    const bookingStatuses: BookingStatus[] = [
      'CONFIRMED',
      'CONFIRMED',
      'CONFIRMED',
      'CONFIRMED',
      'CONFIRMED', // 5 confirmed
      'PENDING',
      'PENDING',
      'PENDING', // 3 pending
      'CANCELLED',
      'CANCELLED', // 2 cancelled
    ]

    const createdBookings = []

    for (let i = 0; i < 10; i++) {
      const studio = getRandomElement(createdStudios)
      const service = getRandomElement(studio.services)
      const customer = getRandomElement(createdCustomers)
      const status = bookingStatuses[i]

      // Get a random available time slot for this studio
      const availableSlots = await prisma.timeSlot.findMany({
        where: {
          studioId: studio.id,
          available: true,
          startTime: {
            gte: new Date(), // Future slots only
          },
        },
        take: 10,
      })

      if (availableSlots.length === 0) continue

      const timeSlot = getRandomElement(availableSlots)

      // Create booking
      const includeHealthData = shouldIncludeHealthData()
      const message = includeHealthData ? getRandomElement(HEALTH_DATA_SAMPLES) : undefined

      const booking = await prisma.booking.create({
        data: {
          studioId: studio.id,
          serviceId: service.id,
          slotId: timeSlot.id,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          message,
          explicitHealthConsent: includeHealthData,
          status,
        },
      })

      // Mark slot as unavailable if booking is confirmed
      if (status === 'CONFIRMED') {
        await prisma.timeSlot.update({
          where: { id: timeSlot.id },
          data: { available: false },
        })
      }

      createdBookings.push(booking)

      console.log(`✅ Booking ${i + 1}/10: ${customer.name} → ${studio.name}`)
      console.log(`   Service: ${service.name}`)
      console.log(`   Status: ${status}`)
      console.log(`   Time: ${timeSlot.startTime.toLocaleString('de-DE')}`)
      if (message) {
        console.log(`   Health Data: ${message.substring(0, 50)}...`)
      }
      console.log()
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('═'.repeat(80))
    console.log('                      SEEDING COMPLETED SUCCESSFULLY!')
    console.log('═'.repeat(80))
    console.log()
    console.log('📊 Summary:')
    console.log(`   Studios: ${createdStudios.length}`)
    console.log(`   Services: ${createdStudios.reduce((sum, s) => sum + s.services.length, 0)}`)
    console.log(`   Studio Owners: ${createdOwners.length}`)
    console.log(`   Customers: ${createdCustomers.length}`)
    console.log(`   Time Slots: ${totalSlotsCreated}`)
    console.log(`   Bookings: ${createdBookings.length}`)
    console.log()
    console.log('🔑 Test Login Credentials:')
    console.log()
    console.log('   STUDIO OWNERS:')
    createdOwners.forEach(owner => {
      console.log(`   - ${owner.email} / ${TEST_PASSWORD}`)
    })
    console.log()
    console.log('   CUSTOMERS:')
    createdCustomers.forEach(customer => {
      console.log(`   - ${customer.email} / ${TEST_PASSWORD}`)
    })
    console.log()
    console.log('🌐 Test URLs:')
    console.log('   Customer Portal: http://localhost:3000')
    console.log('   Business Portal: http://localhost:3000/business')
    console.log('   Sign In: http://localhost:3000/auth/signin')
    console.log()
    console.log('✅ Ready for testing!')
    console.log('═'.repeat(80))

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seeder
main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
