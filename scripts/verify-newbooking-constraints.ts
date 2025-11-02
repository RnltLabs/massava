// Copyright (c) 2025 Roman Reinelt / RNLT Labs
// Script to verify NewBooking foreign key constraints in database

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function verifyConstraints(): Promise<void> {
  console.log('Verifying NewBooking foreign key constraints in database...\n');

  try {
    // Query database for foreign key constraints
    const constraints = await prisma.$queryRaw<Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      delete_rule: string;
      update_rule: string;
    }>>`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'new_bookings'
      ORDER BY tc.constraint_name;
    `;

    console.log('Foreign Key Constraints on new_bookings table:');
    console.log('================================================\n');

    constraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint.constraint_name}`);
      console.log(`   Column: ${constraint.column_name}`);
      console.log(`   References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      console.log(`   ON DELETE: ${constraint.delete_rule}`);
      console.log(`   ON UPDATE: ${constraint.update_rule}`);
      console.log();
    });

    // Verify expected constraints
    const expectedConstraints = [
      {
        name: 'new_bookings_customerId_fkey',
        column: 'customerId',
        references: 'users',
        deleteRule: 'CASCADE',
      },
      {
        name: 'new_bookings_serviceId_fkey',
        column: 'serviceId',
        references: 'services',
        deleteRule: 'SET NULL',
      },
      {
        name: 'new_bookings_studioId_fkey',
        column: 'studioId',
        references: 'studios',
        deleteRule: 'CASCADE',
      },
    ];

    console.log('Verification Results:');
    console.log('=====================\n');

    let allPassed = true;

    expectedConstraints.forEach((expected) => {
      const actual = constraints.find((c) => c.constraint_name === expected.name);

      if (!actual) {
        console.log(`❌ MISSING: ${expected.name}`);
        allPassed = false;
        return;
      }

      const correctColumn = actual.column_name === expected.column;
      const correctTable = actual.foreign_table_name === expected.references;
      const correctDelete = actual.delete_rule === expected.deleteRule;

      if (correctColumn && correctTable && correctDelete) {
        console.log(`✅ PASSED: ${expected.name}`);
        console.log(`   ${expected.column} -> ${expected.references}.id [ON DELETE ${expected.deleteRule}]`);
      } else {
        console.log(`❌ FAILED: ${expected.name}`);
        if (!correctColumn) {
          console.log(`   Expected column: ${expected.column}, got: ${actual.column_name}`);
        }
        if (!correctTable) {
          console.log(`   Expected table: ${expected.references}, got: ${actual.foreign_table_name}`);
        }
        if (!correctDelete) {
          console.log(`   Expected delete rule: ${expected.deleteRule}, got: ${actual.delete_rule}`);
        }
        allPassed = false;
      }
      console.log();
    });

    // Check indexes
    const indexes = await prisma.$queryRaw<Array<{
      indexname: string;
      indexdef: string;
    }>>`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'new_bookings'
        AND schemaname = 'public'
      ORDER BY indexname;
    `;

    console.log('\nIndexes on new_bookings table:');
    console.log('==============================\n');

    indexes.forEach((idx) => {
      console.log(`- ${idx.indexname}`);
      console.log(`  ${idx.indexdef}`);
      console.log();
    });

    // Verify serviceId index
    const serviceIdIndex = indexes.find((idx) => idx.indexname === 'new_bookings_serviceId_idx');
    if (serviceIdIndex) {
      console.log('✅ serviceId index exists');
    } else {
      console.log('❌ serviceId index missing');
      allPassed = false;
    }

    console.log('\n================================================');
    if (allPassed) {
      console.log('✅ All foreign key constraints are correctly configured!');
    } else {
      console.log('❌ Some constraints are missing or misconfigured!');
      process.exit(1);
    }
    console.log('================================================\n');

  } catch (error) {
    console.error('Error verifying constraints:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConstraints();
