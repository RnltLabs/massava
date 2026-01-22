/**
 * Seed-if-empty Script
 *
 * Prüft ob die Datenbank korrekt geseeded ist:
 * - Test-User existieren
 * - Studios existieren
 * - StudioOwnerships sind korrekt verknüpft
 *
 * Verwendung: npm run seed:if-empty
 */

import { PrismaClient } from '../app/generated/prisma'
import { execSync } from 'child_process'

// Erwartete Test-Accounts aus seed.ts
const EXPECTED_TEST_OWNERS = [
  'maria.schmidt@thai-wellness-oase.de',
  'sabine.meyer@sabai-massage.de',
  'petra.wagner@lotus-spa.de',
]

async function main(): Promise<void> {
  const prisma = new PrismaClient()

  try {
    // Prüfe ob die Test-Owner existieren UND Studios besitzen
    const ownersWithStudios = await prisma.user.findMany({
      where: {
        email: { in: EXPECTED_TEST_OWNERS },
      },
      include: {
        ownedStudios: {
          include: {
            studio: true,
          },
        },
      },
    })

    const validOwners = ownersWithStudios.filter(
      (owner) => owner.ownedStudios.length > 0
    )

    if (validOwners.length < EXPECTED_TEST_OWNERS.length) {
      const missingCount = EXPECTED_TEST_OWNERS.length - validOwners.length
      console.log(`⚠️  ${missingCount} Test-Owner ohne Studio gefunden`)
      console.log('📭 Datenbank ist nicht korrekt konfiguriert - starte Seeding...\n')

      await prisma.$disconnect()

      // Führe seed.ts aus
      execSync('npx tsx prisma/seed.ts', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })

      console.log('\n✅ Seeding abgeschlossen!')
    } else {
      console.log(`✅ Datenbank OK - ${validOwners.length} Test-Owner mit Studios:`)
      validOwners.forEach((owner) => {
        const studioNames = owner.ownedStudios.map((so) => so.studio.name).join(', ')
        console.log(`   • ${owner.email} → ${studioNames}`)
      })
      await prisma.$disconnect()
    }
  } catch (error) {
    await prisma.$disconnect()
    console.error('❌ Fehler:', error)
    process.exit(1)
  }
}

main()
