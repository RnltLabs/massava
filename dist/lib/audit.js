"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Audit Logging for GDPR Compliance
 * Implements STRATEGY.md Section 4.1 (Audit Log)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.getUserAuditLogs = getUserAuditLogs;
exports.getResourceAuditLogs = getResourceAuditLogs;
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
exports.exportUserAuditLogs = exportUserAuditLogs;
const prisma_1 = require("@/lib/prisma");
/**
 * Anonymize IP address by hashing the last octet
 * GDPR Art. 32 - Security of processing
 */
function anonymizeIP(ip) {
    if (!ip)
        return 'unknown';
    // For IPv4: Replace last octet with 0
    if (ip.includes('.')) {
        const parts = ip.split('.');
        parts[3] = '0';
        return parts.join('.');
    }
    // For IPv6: Keep first 64 bits, zero the rest
    if (ip.includes(':')) {
        const parts = ip.split(':');
        return parts.slice(0, 4).join(':') + '::';
    }
    return 'unknown';
}
/**
 * Create an audit log entry
 */
async function createAuditLog({ userId, action, resource, resourceId, metadata, request, }) {
    try {
        const ipAddress = request
            ? anonymizeIP(request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown')
            : undefined;
        const userAgent = request
            ? request.headers.get('user-agent') || undefined
            : undefined;
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: userId || undefined,
                action,
                resource,
                resourceId,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
                ipAddress,
                userAgent,
            },
        });
    }
    catch (error) {
        // Don't throw on audit log failure - just log the error
        console.error('Failed to create audit log:', error);
    }
}
/**
 * Get audit logs for a specific user
 */
async function getUserAuditLogs(userId, limit = 50) {
    return prisma_1.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            metadata: true,
            createdAt: true,
            // Exclude ipAddress and userAgent for privacy
        },
    });
}
/**
 * Get audit logs for a specific resource
 */
async function getResourceAuditLogs(resource, resourceId, limit = 50) {
    return prisma_1.prisma.auditLog.findMany({
        where: { resource, resourceId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
}
/**
 * Clean up old audit logs (GDPR retention policy)
 * Keep logs for 3 years, then delete
 */
async function cleanupOldAuditLogs() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const result = await prisma_1.prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: threeYearsAgo,
            },
        },
    });
    return result.count;
}
/**
 * Export audit logs for GDPR data export request
 */
async function exportUserAuditLogs(userId) {
    return prisma_1.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            metadata: true,
            createdAt: true,
            // Include anonymized IP for transparency
            ipAddress: true,
        },
    });
}
