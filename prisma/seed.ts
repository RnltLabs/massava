/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test studio owner
  const hashedPassword = await bcrypt.hash('test123', 10);
  const owner = await prisma.studioOwner.create({
    data: {
      email: 'owner@example.com',
      name: 'Test Studio Owner',
      password: hashedPassword,
    },
  });

  console.log('✅ Created test owner:', owner.email);

  // Create test studios in Karlsruhe
  const studio1 = await prisma.studio.create({
    data: {
      ownerId: owner.id,
      name: 'Thai Wellness Oase',
      description: 'Traditionelle Thai-Massage in Karlsruhe. Entspannung pur mit erfahrenen Therapeuten.',
      address: 'Kaiserstraße 123',
      city: 'Karlsruhe',
      postalCode: '76133',
      phone: '+49 721 12345678',
      email: 'info@thai-wellness-oase.de',
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
      ownerId: owner.id,
      name: 'Sabai Massage Studio',
      description: 'Authentische Thai-Massage im Herzen von Karlsruhe. Sabai bedeutet "wohlfühlen" auf Thai.',
      address: 'Waldstraße 45',
      city: 'Karlsruhe',
      postalCode: '76131',
      phone: '+49 721 98765432',
      email: 'kontakt@sabai-massage.de',
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
      ownerId: owner.id,
      name: 'Lotus Spa & Wellness',
      description: 'Modernes Wellness-Studio mit Thai- und klassischen Massagen. Premium-Ambiente und professionelle Therapeuten.',
      address: 'Erzbergerstraße 89',
      city: 'Karlsruhe',
      postalCode: '76133',
      phone: '+49 721 55566677',
      email: 'hello@lotus-spa.de',
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

  console.log('✅ Created studios:', {
    studio1: studio1.name,
    studio2: studio2.name,
    studio3: studio3.name,
  });

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
