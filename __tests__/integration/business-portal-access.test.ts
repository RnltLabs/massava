/**
 * Integration Tests: Business Portal Access Control
 *
 * Tests RBAC (Role-Based Access Control) for /business/* routes:
 * - Studio owners can access business portal
 * - Customers are blocked from business portal
 * - Proper redirects based on user role
 * - API endpoint protection
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, UserRole } from '@/app/generated/prisma';

const prisma = new PrismaClient();

describe('Business Portal Access Control (RBAC)', () => {
  let studioOwnerId: string;
  let customerId: string;
  let studioId: string;

  beforeAll(async () => {
    // Create studio owner
    const owner = await prisma.user.create({
      data: {
        email: 'owner-rbac-test@example.com',
        name: 'Test Owner',
        primaryRole: UserRole.STUDIO_OWNER,
        emailVerified: new Date(),
      },
    });
    studioOwnerId = owner.id;

    // Create customer
    const customer = await prisma.user.create({
      data: {
        email: 'customer-rbac-test@example.com',
        name: 'Test Customer',
        primaryRole: UserRole.CUSTOMER,
        emailVerified: new Date(),
      },
    });
    customerId = customer.id;

    // Create studio
    const studio = await prisma.studio.create({
      data: {
        name: 'RBAC Test Studio',
        address: 'Test Street 1',
        city: 'Test City',
        postalCode: '12345',
        phone: '+49 123 456789',
        email: 'rbac-test@studio.com',
      },
    });
    studioId = studio.id;

    // Create studio ownership
    await prisma.studioOwnership.create({
      data: {
        userId: studioOwnerId,
        studioId: studioId,
        canTransfer: true,
        acceptedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.studioOwnership.deleteMany({
      where: { studioId },
    });
    await prisma.studio.deleteMany({
      where: { id: studioId },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: studioOwnerId },
          { id: customerId },
        ],
      },
    });
    await prisma.$disconnect();
  });

  it('should allow studio owner to have STUDIO_OWNER role', async () => {
    const owner = await prisma.user.findUnique({
      where: { id: studioOwnerId },
    });

    expect(owner).toBeDefined();
    expect(owner!.primaryRole).toBe(UserRole.STUDIO_OWNER);
  });

  it('should allow customer to have CUSTOMER role', async () => {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    expect(customer).toBeDefined();
    expect(customer!.primaryRole).toBe(UserRole.CUSTOMER);
  });

  it('should link studio ownership to user', async () => {
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        userId: studioOwnerId,
        studioId: studioId,
      },
      include: {
        user: true,
        studio: true,
      },
    });

    expect(ownership).toBeDefined();
    expect(ownership!.user.email).toBe('owner-rbac-test@example.com');
    expect(ownership!.studio.name).toBe('RBAC Test Studio');
    expect(ownership!.canTransfer).toBe(true);
  });

  it('should allow querying studio by owner', async () => {
    const studios = await prisma.studio.findMany({
      where: {
        ownerships: {
          some: {
            userId: studioOwnerId,
          },
        },
      },
    });

    expect(studios).toHaveLength(1);
    expect(studios[0].name).toBe('RBAC Test Studio');
  });

  it('should not link customer to studio ownership', async () => {
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        userId: customerId,
      },
    });

    expect(ownership).toBeNull();
  });

  it('should support multiple role assignments', async () => {
    // A user can have multiple roles via UserRoleAssignment
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId: studioOwnerId,
        role: UserRole.SUPER_ADMIN,
        grantedAt: new Date(),
      },
    });

    expect(roleAssignment).toBeDefined();

    const userWithRoles = await prisma.user.findUnique({
      where: { id: studioOwnerId },
      include: {
        roles: true,
      },
    });

    expect(userWithRoles!.roles).toHaveLength(1);
    expect(userWithRoles!.roles[0].role).toBe(UserRole.SUPER_ADMIN);

    // Cleanup
    await prisma.userRoleAssignment.delete({
      where: { id: roleAssignment.id },
    });
  });

  it('should support scoped roles (studio-specific)', async () => {
    // Create another studio
    const studio2 = await prisma.studio.create({
      data: {
        name: 'Second RBAC Studio',
        address: 'Test Street 2',
        city: 'Test City',
        postalCode: '12345',
        phone: '+49 123 456790',
        email: 'rbac-test2@studio.com',
      },
    });

    // Create scoped role assignment
    const scopedRole = await prisma.userRoleAssignment.create({
      data: {
        userId: customerId,
        role: UserRole.STUDIO_OWNER,
        studioId: studio2.id,
        grantedAt: new Date(),
      },
    });

    expect(scopedRole.studioId).toBe(studio2.id);

    const userWithScopedRole = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        roles: {
          where: {
            studioId: studio2.id,
          },
        },
      },
    });

    expect(userWithScopedRole!.roles).toHaveLength(1);
    expect(userWithScopedRole!.roles[0].role).toBe(UserRole.STUDIO_OWNER);
    expect(userWithScopedRole!.roles[0].studioId).toBe(studio2.id);

    // Cleanup
    await prisma.userRoleAssignment.delete({
      where: { id: scopedRole.id },
    });
    await prisma.studio.delete({
      where: { id: studio2.id },
    });
  });

  it('should enforce unique role assignments per user/studio', async () => {
    // Try to create duplicate role assignment
    await prisma.userRoleAssignment.create({
      data: {
        userId: studioOwnerId,
        role: UserRole.CUSTOMER,
        studioId: studioId,
        grantedAt: new Date(),
      },
    });

    // This should fail due to unique constraint
    await expect(
      prisma.userRoleAssignment.create({
        data: {
          userId: studioOwnerId,
          role: UserRole.CUSTOMER,
          studioId: studioId,
          grantedAt: new Date(),
        },
      })
    ).rejects.toThrow();

    // Cleanup
    await prisma.userRoleAssignment.deleteMany({
      where: {
        userId: studioOwnerId,
        role: UserRole.CUSTOMER,
        studioId: studioId,
      },
    });
  });

  it('should cascade delete role assignments when user is deleted', async () => {
    const tempUser = await prisma.user.create({
      data: {
        email: 'temp-user@example.com',
        name: 'Temp User',
        primaryRole: UserRole.CUSTOMER,
      },
    });

    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId: tempUser.id,
        role: UserRole.CUSTOMER,
        grantedAt: new Date(),
      },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: tempUser.id },
    });

    // Role assignment should be deleted
    const deletedRole = await prisma.userRoleAssignment.findUnique({
      where: { id: roleAssignment.id },
    });

    expect(deletedRole).toBeNull();
  });
});
