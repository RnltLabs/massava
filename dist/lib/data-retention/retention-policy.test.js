"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Retention Policy Tests
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const retention_policy_1 = require("./retention-policy");
(0, node_test_1.describe)('Data Retention Policy', () => {
    (0, node_test_1.describe)('shouldDelete', () => {
        (0, node_test_1.it)('should not delete data within retention period', () => {
            const now = new Date();
            const recentData = {
                createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            };
            const result = (0, retention_policy_1.shouldDelete)(recentData, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, false);
            node_assert_1.default.strictEqual(result.reason, 'Still within retention period');
            node_assert_1.default.ok(result.daysUntilDeletion);
            node_assert_1.default.ok(result.daysUntilDeletion > 0);
        });
        (0, node_test_1.it)('should delete data past retention period', () => {
            const now = new Date();
            const oldData = {
                createdAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000), // 4 years ago
                updatedAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000),
            };
            const result = (0, retention_policy_1.shouldDelete)(oldData, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, true);
            node_assert_1.default.strictEqual(result.reason, 'Retention period expired');
            node_assert_1.default.strictEqual(result.daysUntilDeletion, 0);
        });
        (0, node_test_1.it)('should handle soft-deleted data within grace period', () => {
            const now = new Date();
            const softDeletedData = {
                createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
                deletedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Soft deleted 15 days ago
            };
            const result = (0, retention_policy_1.shouldDelete)(softDeletedData, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, false);
            node_assert_1.default.strictEqual(result.reason, 'Still in grace period');
            node_assert_1.default.ok(result.daysUntilDeletion);
            node_assert_1.default.ok(result.daysUntilDeletion > 0);
        });
        (0, node_test_1.it)('should delete soft-deleted data after grace period', () => {
            const now = new Date();
            const softDeletedData = {
                createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
                deletedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // Soft deleted 35 days ago
            };
            const result = (0, retention_policy_1.shouldDelete)(softDeletedData, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, true);
            node_assert_1.default.strictEqual(result.reason, 'Grace period expired after soft delete');
            node_assert_1.default.strictEqual(result.daysUntilDeletion, 0);
        });
        (0, node_test_1.it)('should use updatedAt for last activity if available', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000), // 4 years ago
                updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Updated 30 days ago
            };
            const result = (0, retention_policy_1.shouldDelete)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, false);
            node_assert_1.default.strictEqual(result.reason, 'Still within retention period');
        });
        (0, node_test_1.it)('should handle health data retention (1 year)', () => {
            const now = new Date();
            const healthData = {
                createdAt: new Date(now.getTime() - 13 * 30 * 24 * 60 * 60 * 1000), // 13 months ago
                updatedAt: new Date(now.getTime() - 13 * 30 * 24 * 60 * 60 * 1000),
            };
            const result = (0, retention_policy_1.shouldDelete)(healthData, 'HEALTH_DATA');
            node_assert_1.default.strictEqual(result.shouldDelete, true);
            node_assert_1.default.strictEqual(result.reason, 'Retention period expired');
        });
        (0, node_test_1.it)('should handle audit log retention (90 days)', () => {
            const now = new Date();
            const auditLog = {
                createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
            };
            const result = (0, retention_policy_1.shouldDelete)(auditLog, 'AUDIT_LOGS');
            node_assert_1.default.strictEqual(result.shouldDelete, true);
            node_assert_1.default.strictEqual(result.reason, 'Retention period expired');
        });
    });
    (0, node_test_1.describe)('shouldWarn', () => {
        (0, node_test_1.it)('should warn users approaching deletion (within 7 days)', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000), // 5 days until deletion
                updatedAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
                deletionScheduledAt: null,
            };
            const result = (0, retention_policy_1.shouldWarn)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result, true);
        });
        (0, node_test_1.it)('should not warn users with plenty of time', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                deletionScheduledAt: null,
            };
            const result = (0, retention_policy_1.shouldWarn)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result, false);
        });
        (0, node_test_1.it)('should not warn users already scheduled for deletion', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT + 5 * 24 * 60 * 60 * 1000),
                deletionScheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
            };
            const result = (0, retention_policy_1.shouldWarn)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result, false);
        });
        (0, node_test_1.it)('should not warn users past deletion time', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT - 10 * 24 * 60 * 60 * 1000), // Past deletion
                updatedAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT - 10 * 24 * 60 * 60 * 1000),
                deletionScheduledAt: null,
            };
            const result = (0, retention_policy_1.shouldWarn)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result, false);
        });
    });
    (0, node_test_1.describe)('Retention Periods', () => {
        (0, node_test_1.it)('should have correct retention periods defined', () => {
            // 3 years for user accounts
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT, 3 * 365 * 24 * 60 * 60 * 1000);
            // 1 year for health data
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.HEALTH_DATA, 1 * 365 * 24 * 60 * 60 * 1000);
            // 3 years for bookings
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.BOOKINGS, 3 * 365 * 24 * 60 * 60 * 1000);
            // 10 years for invoices
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.INVOICES, 10 * 365 * 24 * 60 * 60 * 1000);
            // 90 days for audit logs
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.AUDIT_LOGS, 90 * 24 * 60 * 60 * 1000);
            // 30 days grace period
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.SOFT_DELETE_GRACE, 30 * 24 * 60 * 60 * 1000);
            // 7 days warning period
            node_assert_1.default.strictEqual(retention_policy_1.RETENTION_PERIODS.WARNING_PERIOD, 7 * 24 * 60 * 60 * 1000);
        });
    });
    (0, node_test_1.describe)('Edge Cases', () => {
        (0, node_test_1.it)('should handle data with only createdAt (no updatedAt)', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            };
            const result = (0, retention_policy_1.shouldDelete)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, false);
            node_assert_1.default.ok(result.daysUntilDeletion);
        });
        (0, node_test_1.it)('should handle data exactly at retention boundary', () => {
            const now = new Date();
            const data = {
                createdAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT),
                updatedAt: new Date(now.getTime() - retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT),
            };
            const result = (0, retention_policy_1.shouldDelete)(data, 'USER_ACCOUNT');
            // At exact boundary, should be marked for deletion
            node_assert_1.default.strictEqual(result.shouldDelete, true);
        });
        (0, node_test_1.it)('should calculate days until deletion correctly', () => {
            const now = new Date();
            const daysAgo = 1000; // Some time in the past
            const retentionDays = Math.floor(retention_policy_1.RETENTION_PERIODS.USER_ACCOUNT / (24 * 60 * 60 * 1000));
            const expectedDaysLeft = retentionDays - daysAgo;
            const data = {
                createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
            };
            const result = (0, retention_policy_1.shouldDelete)(data, 'USER_ACCOUNT');
            node_assert_1.default.strictEqual(result.shouldDelete, false);
            node_assert_1.default.ok(result.daysUntilDeletion);
            // Allow some margin for rounding
            node_assert_1.default.ok(Math.abs(result.daysUntilDeletion - expectedDaysLeft) <= 1);
        });
    });
});
