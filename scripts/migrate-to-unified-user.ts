/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Migration: Separate Tables → Unified User Model
 * Migrates StudioOwner and Customer to User with RBAC
 *
 * CRITICAL: This is a one-way migration. Back up database before running.
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-unified-user.ts
 */

import { PrismaClient, UserRole } from '@/app/generated/prisma';

const prisma = new PrismaClient();

interface MigrationStats {
  studioOwnersMigrated: number;
  customersMigrated: number;
  studioOwnershipCreated: number;
  bookingsUpdated: number;
  errors: string[];
}

/**
 * Main migration function
 */
async function migrateToUnifiedUser(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    studioOwnersMigrated: 0,
    customersMigrated: 0,
    studioOwnershipCreated: 0,
    bookingsUpdated: 0,
    errors: [],
  };

  console.log('🚀 Starting migration to unified User model...\n');

  try {
    await prisma.$transaction(
      async (tx) => {
        // ============================================
        // Step 1: Migrate StudioOwners to Users
        // ============================================
        console.log('📋 Step 1: Migrating StudioOwners to Users...');

        const studioOwners = await tx.studioOwner.findMany({
          include: {
            studios: true,
            accounts: true,
            sessions: true,
          },
        });

        console.log(`   Found ${studioOwners.length} studio owners to migrate`);

        for (const owner of studioOwners) {
          try {
            // Create User from StudioOwner
            const user = await tx.user.create({
              data: {
                id: owner.id, // Keep same ID for foreign key compatibility
                email: owner.email,
                emailVerified: owner.emailVerified,
                password: owner.password,
                name: owner.name,
                image: owner.image,
                primaryRole: UserRole.STUDIO_OWNER,
                isActive: true,
                isSuspended: false,
              },
            });

            // Create UserRoleAssignment
            await tx.userRoleAssignment.create({
              data: {
                userId: user.id,
                role: UserRole.STUDIO_OWNER,
                grantedBy: 'SYSTEM_MIGRATION',
                grantedAt: new Date(),
              },
            });

            // Create StudioOwnership records
            for (const studio of owner.studios) {
              await tx.studioOwnership.create({
                data: {
                  userId: user.id,
                  studioId: studio.id,
                  isPrimary: true,
                  canTransfer: true,
                  invitedBy: 'SYSTEM_MIGRATION',
                  acceptedAt: new Date(),
                },
              });
              stats.studioOwnershipCreated++;
            }

            // Migrate OAuth accounts
            for (const account of owner.accounts) {
              await tx.newAccount.create({
                data: {
                  userId: user.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }

            // Migrate sessions
            for (const session of owner.sessions) {
              await tx.newSession.create({
                data: {
                  userId: user.id,
                  sessionToken: session.sessionToken,
                  expires: session.expires,
                },
              });
            }

            stats.studioOwnersMigrated++;
            console.log(`   ✅ Migrated: ${owner.email}`);
          } catch (error) {
            const errorMsg = `Failed to migrate StudioOwner ${owner.email}: ${error}`;
            console.error(`   ❌ ${errorMsg}`);
            stats.errors.push(errorMsg);
          }
        }

        console.log(
          `   ✅ Step 1 complete: ${stats.studioOwnersMigrated}/${studioOwners.length} migrated\n`
        );

        // ============================================
        // Step 2: Migrate Customers to Users
        // ============================================
        console.log('📋 Step 2: Migrating Customers to Users...');

        const customers = await tx.customer.findMany({
          include: {
            bookings: true,
            favorites: true,
          },
        });

        console.log(`   Found ${customers.length} customers to migrate`);

        for (const customer of customers) {
          try {
            // Check if email already exists (customer might also be studio owner)
            const existingUser = await tx.user.findUnique({
              where: { email: customer.email },
            });

            if (existingUser) {
              console.log(
                `   ⚠️  User already exists: ${customer.email} (adding CUSTOMER role)`
              );

              // Add CUSTOMER role to existing user
              await tx.userRoleAssignment.create({
                data: {
                  userId: existingUser.id,
                  role: UserRole.CUSTOMER,
                  grantedBy: 'SYSTEM_MIGRATION',
                  grantedAt: new Date(),
                },
              });

              // Update bookings to reference existing user
              await tx.newBooking.updateMany({
                where: { customerEmail: customer.email },
                data: { customerId: existingUser.id },
              });

              stats.customersMigrated++;
              continue;
            }

            // Create User from Customer
            const user = await tx.user.create({
              data: {
                id: customer.id, // Keep same ID for foreign key compatibility
                email: customer.email,
                emailVerified: customer.emailVerified,
                password: customer.password,
                name: customer.name,
                phone: customer.phone,
                image: customer.image,
                primaryRole: UserRole.CUSTOMER,
                isActive: true,
                isSuspended: false,
              },
            });

            // Create UserRoleAssignment
            await tx.userRoleAssignment.create({
              data: {
                userId: user.id,
                role: UserRole.CUSTOMER,
                grantedBy: 'SYSTEM_MIGRATION',
                grantedAt: new Date(),
              },
            });

            stats.customersMigrated++;
            console.log(`   ✅ Migrated: ${customer.email}`);
          } catch (error) {
            const errorMsg = `Failed to migrate Customer ${customer.email}: ${error}`;
            console.error(`   ❌ ${errorMsg}`);
            stats.errors.push(errorMsg);
          }
        }

        console.log(
          `   ✅ Step 2 complete: ${stats.customersMigrated}/${customers.length} migrated\n`
        );

        // ============================================
        // Step 3: Migrate Bookings to NewBooking
        // ============================================
        console.log('📋 Step 3: Migrating Bookings to NewBooking...');

        const bookings = await tx.booking.findMany();
        console.log(`   Found ${bookings.length} bookings to migrate`);

        for (const booking of bookings) {
          try {
            // Get customer user ID
            const customer = await tx.user.findUnique({
              where: { email: booking.customerEmail },
            });

            if (!customer) {
              // Create passwordless user for booking if not exists
              const newCustomer = await tx.user.create({
                data: {
                  email: booking.customerEmail,
                  name: booking.customerName,
                  phone: booking.customerPhone,
                  password: null, // Passwordless account
                  primaryRole: UserRole.CUSTOMER,
                  isActive: true,
                },
              });

              await tx.userRoleAssignment.create({
                data: {
                  userId: newCustomer.id,
                  role: UserRole.CUSTOMER,
                  grantedBy: 'SYSTEM_MIGRATION',
                },
              });

              // Create NewBooking
              await tx.newBooking.create({
                data: {
                  id: booking.id,
                  studioId: booking.studioId,
                  serviceId: booking.serviceId,
                  customerId: newCustomer.id,
                  customerName: booking.customerName,
                  customerEmail: booking.customerEmail,
                  customerPhone: booking.customerPhone,
                  preferredDate: booking.preferredDate,
                  preferredTime: booking.preferredTime,
                  message: booking.message,
                  explicitHealthConsent: booking.explicitHealthConsent,
                  healthConsentGivenAt: booking.healthConsentGivenAt,
                  healthConsentText: booking.healthConsentText,
                  healthConsentWithdrawnAt: booking.healthConsentWithdrawnAt,
                  status: booking.status,
                  createdAt: booking.createdAt,
                  updatedAt: booking.updatedAt,
                },
              });
            } else {
              // Create NewBooking with existing customer
              await tx.newBooking.create({
                data: {
                  id: booking.id,
                  studioId: booking.studioId,
                  serviceId: booking.serviceId,
                  customerId: customer.id,
                  customerName: booking.customerName,
                  customerEmail: booking.customerEmail,
                  customerPhone: booking.customerPhone,
                  preferredDate: booking.preferredDate,
                  preferredTime: booking.preferredTime,
                  message: booking.message,
                  explicitHealthConsent: booking.explicitHealthConsent,
                  healthConsentGivenAt: booking.healthConsentGivenAt,
                  healthConsentText: booking.healthConsentText,
                  healthConsentWithdrawnAt: booking.healthConsentWithdrawnAt,
                  status: booking.status,
                  createdAt: booking.createdAt,
                  updatedAt: booking.updatedAt,
                },
              });
            }

            stats.bookingsUpdated++;

            if (stats.bookingsUpdated % 10 === 0) {
              console.log(`   📦 Migrated ${stats.bookingsUpdated} bookings...`);
            }
          } catch (error) {
            const errorMsg = `Failed to migrate Booking ${booking.id}: ${error}`;
            console.error(`   ❌ ${errorMsg}`);
            stats.errors.push(errorMsg);
          }
        }

        console.log(
          `   ✅ Step 3 complete: ${stats.bookingsUpdated}/${bookings.length} migrated\n`
        );

        // ============================================
        // Step 4: Verification Checks
        // ============================================
        console.log('🔍 Step 4: Running verification checks...');

        const userCount = await tx.user.count();
        const roleAssignmentCount = await tx.userRoleAssignment.count();
        const studioOwnershipCount = await tx.studioOwnership.count();
        const newBookingCount = await tx.newBooking.count();

        console.log(`   Users created: ${userCount}`);
        console.log(`   Role assignments created: ${roleAssignmentCount}`);
        console.log(`   Studio ownerships created: ${studioOwnershipCount}`);
        console.log(`   New bookings created: ${newBookingCount}`);

        // Verify no orphaned bookings
        const orphanedBookings = await tx.newBooking.count({
          where: {
            customer: null,
          },
        });

        if (orphanedBookings > 0) {
          throw new Error(`Found ${orphanedBookings} orphaned bookings without customer`);
        }

        console.log('   ✅ All verification checks passed\n');
      },
      {
        timeout: 300000, // 5 minutes timeout for large datasets
      }
    );

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Final Statistics:');
    console.log(`   Studio Owners migrated: ${stats.studioOwnersMigrated}`);
    console.log(`   Customers migrated: ${stats.customersMigrated}`);
    console.log(`   Studio ownerships created: ${stats.studioOwnershipCreated}`);
    console.log(`   Bookings migrated: ${stats.bookingsUpdated}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach((error) => console.log(`   - ${error}`));
    }

    console.log('\n⚠️  NEXT STEPS:');
    console.log('   1. Test the application thoroughly');
    console.log('   2. Verify all user data is accessible');
    console.log('   3. Update auth.ts to use User model');
    console.log('   4. Update API routes to use User model');
    console.log('   5. After testing, drop old tables:');
    console.log('      - studio_owners');
    console.log('      - customers');
    console.log('      - bookings');
    console.log('      - accounts');
    console.log('      - sessions');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔄 Transaction rolled back - database unchanged');
    throw error;
  }

  return stats;
}

/**
 * Run migration
 */
async function main() {
  console.log('⚠️  WARNING: This migration will modify your database');
  console.log('⚠️  Make sure you have a backup before proceeding\n');

  try {
    const stats = await migrateToUnifiedUser();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { migrateToUnifiedUser };
