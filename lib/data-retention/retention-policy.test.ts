/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Retention Policy Tests
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  shouldDelete,
  shouldWarn,
  RETENTION_PERIODS,
  type DataType,
} from './retention-policy';

describe('Data Retention Policy', () => {
  describe('shouldDelete', () => {
    it('should not delete data within retention period', () => {
      const now = new Date();
      const recentData = {
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };

      const result = shouldDelete(recentData, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, false);
      assert.strictEqual(result.reason, 'Still within retention period');
      assert.ok(result.daysUntilDeletion);
      assert.ok(result.daysUntilDeletion > 0);
    });

    it('should delete data past retention period', () => {
      const now = new Date();
      const oldData = {
        createdAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000), // 4 years ago
        updatedAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000),
      };

      const result = shouldDelete(oldData, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, true);
      assert.strictEqual(result.reason, 'Retention period expired');
      assert.strictEqual(result.daysUntilDeletion, 0);
    });

    it('should handle soft-deleted data within grace period', () => {
      const now = new Date();
      const softDeletedData = {
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        deletedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Soft deleted 15 days ago
      };

      const result = shouldDelete(softDeletedData, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, false);
      assert.strictEqual(result.reason, 'Still in grace period');
      assert.ok(result.daysUntilDeletion);
      assert.ok(result.daysUntilDeletion > 0);
    });

    it('should delete soft-deleted data after grace period', () => {
      const now = new Date();
      const softDeletedData = {
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        deletedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // Soft deleted 35 days ago
      };

      const result = shouldDelete(softDeletedData, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, true);
      assert.strictEqual(result.reason, 'Grace period expired after soft delete');
      assert.strictEqual(result.daysUntilDeletion, 0);
    });

    it('should use updatedAt for last activity if available', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000), // 4 years ago
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Updated 30 days ago
      };

      const result = shouldDelete(data, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, false);
      assert.strictEqual(result.reason, 'Still within retention period');
    });

    it('should handle health data retention (1 year)', () => {
      const now = new Date();
      const healthData = {
        createdAt: new Date(now.getTime() - 13 * 30 * 24 * 60 * 60 * 1000), // 13 months ago
        updatedAt: new Date(now.getTime() - 13 * 30 * 24 * 60 * 60 * 1000),
      };

      const result = shouldDelete(healthData, 'HEALTH_DATA');

      assert.strictEqual(result.shouldDelete, true);
      assert.strictEqual(result.reason, 'Retention period expired');
    });

    it('should handle audit log retention (90 days)', () => {
      const now = new Date();
      const auditLog = {
        createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
      };

      const result = shouldDelete(auditLog, 'AUDIT_LOGS');

      assert.strictEqual(result.shouldDelete, true);
      assert.strictEqual(result.reason, 'Retention period expired');
    });
  });

  describe('shouldWarn', () => {
    it('should warn users approaching deletion (within 7 days)', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000), // 5 days until deletion
        updatedAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
        deletionScheduledAt: null,
      };

      const result = shouldWarn(data, 'USER_ACCOUNT');

      assert.strictEqual(result, true);
    });

    it('should not warn users with plenty of time', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        deletionScheduledAt: null,
      };

      const result = shouldWarn(data, 'USER_ACCOUNT');

      assert.strictEqual(result, false);
    });

    it('should not warn users already scheduled for deletion', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
        deletionScheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      };

      const result = shouldWarn(data, 'USER_ACCOUNT');

      assert.strictEqual(result, false);
    });

    it('should not warn users past deletion time', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT - 10 * 24 * 60 * 60 * 1000), // Past deletion
        updatedAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT - 10 * 24 * 60 * 60 * 1000),
        deletionScheduledAt: null,
      };

      const result = shouldWarn(data, 'USER_ACCOUNT');

      assert.strictEqual(result, false);
    });
  });

  describe('Retention Periods', () => {
    it('should have correct retention periods defined', () => {
      // 3 years for user accounts
      assert.strictEqual(
        RETENTION_PERIODS.USER_ACCOUNT,
        3 * 365 * 24 * 60 * 60 * 1000
      );

      // 1 year for health data
      assert.strictEqual(
        RETENTION_PERIODS.HEALTH_DATA,
        1 * 365 * 24 * 60 * 60 * 1000
      );

      // 3 years for bookings
      assert.strictEqual(
        RETENTION_PERIODS.BOOKINGS,
        3 * 365 * 24 * 60 * 60 * 1000
      );

      // 10 years for invoices
      assert.strictEqual(
        RETENTION_PERIODS.INVOICES,
        10 * 365 * 24 * 60 * 60 * 1000
      );

      // 90 days for audit logs
      assert.strictEqual(
        RETENTION_PERIODS.AUDIT_LOGS,
        90 * 24 * 60 * 60 * 1000
      );

      // 30 days grace period
      assert.strictEqual(
        RETENTION_PERIODS.SOFT_DELETE_GRACE,
        30 * 24 * 60 * 60 * 1000
      );

      // 7 days warning period
      assert.strictEqual(
        RETENTION_PERIODS.WARNING_PERIOD,
        7 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with only createdAt (no updatedAt)', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      };

      const result = shouldDelete(data, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, false);
      assert.ok(result.daysUntilDeletion);
    });

    it('should handle data exactly at retention boundary', () => {
      const now = new Date();
      const data = {
        createdAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT),
        updatedAt: new Date(now.getTime() - RETENTION_PERIODS.USER_ACCOUNT),
      };

      const result = shouldDelete(data, 'USER_ACCOUNT');

      // At exact boundary, should be marked for deletion
      assert.strictEqual(result.shouldDelete, true);
    });

    it('should calculate days until deletion correctly', () => {
      const now = new Date();
      const daysAgo = 1000; // Some time in the past
      const retentionDays = Math.floor(RETENTION_PERIODS.USER_ACCOUNT / (24 * 60 * 60 * 1000));
      const expectedDaysLeft = retentionDays - daysAgo;

      const data = {
        createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      };

      const result = shouldDelete(data, 'USER_ACCOUNT');

      assert.strictEqual(result.shouldDelete, false);
      assert.ok(result.daysUntilDeletion);
      // Allow some margin for rounding
      assert.ok(Math.abs(result.daysUntilDeletion - expectedDaysLeft) <= 1);
    });
  });
});
