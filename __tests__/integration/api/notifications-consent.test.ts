/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Push Notification Consent API Integration Tests
 *
 * Tests the complete flow of the consent API endpoints including:
 * - POST /api/notifications/consent (create consent log)
 * - GET /api/notifications/consent (retrieve consent history)
 * - GET /api/notifications/consent/status (get current status)
 *
 * GDPR Compliance Testing:
 * - Proof of consent capture (IP, User-Agent)
 * - Granular category consents
 * - Consent versioning
 * - Audit trail maintenance
 */

import { NextRequest, NextResponse } from "next/server";
import {
  POST as createConsentLog,
  GET as getConsentHistory,
} from "@/app/api/notifications/consent/route";
import { GET as getConsentStatus } from "@/app/api/notifications/consent/status/route";
import { prisma } from "@/lib/prisma";
import { ConsentAction } from "@/app/generated/prisma";

// ============================================
// Mocks
// ============================================

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    pushConsentLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ============================================
// Test Data
// ============================================

const mockUserId = "user-123";
const mockConsentLog = {
  id: "consent-log-123",
  userId: mockUserId,
  action: ConsentAction.GRANTED,
  consentVersion: "1.0",
  categories: {
    bookings: true,
    cancellations: true,
    reminders: true,
    marketing: false,
  },
  method: "browser_prompt",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0",
  deviceInfo: {
    platform: "WEB",
    browser: "Chrome",
  },
  previousState: null,
  triggeredBy: "user",
  notes: null,
  timestamp: new Date("2025-12-04T12:00:00Z"),
};

const mockPreferences = {
  id: "pref-123",
  userId: mockUserId,
  pushEnabled: true,
  pushBookings: true,
  pushCancellations: true,
  pushReminders: true,
  pushMarketing: false,
  emailEnabled: true,
  emailBookings: true,
  emailCancellations: true,
  emailReminders: true,
  emailMarketing: false,
  inAppEnabled: true,
  emailDigestEnabled: false,
  digestFrequency: "DAILY" as const,
  digestTime: null,
  language: "en",
  typePreferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// Helper Functions
// ============================================

const createMockRequest = (
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): NextRequest => {
  const req = new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.168.1.1",
      "user-agent": "Mozilla/5.0 (Test)",
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  return req;
};

const mockAuth = (authenticated = true) => {
  const { auth } = require("@/auth");
  if (authenticated) {
    auth.mockResolvedValue({
      user: { id: mockUserId, email: "test@example.com" },
    });
  } else {
    auth.mockResolvedValue(null);
  }
};

// ============================================
// Tests: POST /api/notifications/consent
// ============================================

describe("POST /api/notifications/consent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create consent log for GRANTED action", async () => {
    mockAuth(true);

    const requestBody = {
      action: "GRANTED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "browser_prompt",
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue(mockConsentLog);
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.consentId).toBe(mockConsentLog.id);
    expect(data.log).toMatchObject({
      id: mockConsentLog.id,
      userId: mockUserId,
      action: "GRANTED",
      categories: requestBody.categories,
    });

    // Verify consent log was created with IP and User-Agent
    expect(prisma.pushConsentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockUserId,
        action: "GRANTED",
        categories: requestBody.categories,
        consentVersion: "1.0",
        method: "browser_prompt",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Test)",
        triggeredBy: "user",
      }),
    });

    // Verify preferences were updated
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        pushEnabled: true,
        pushBookings: true,
        pushCancellations: true,
        pushReminders: true,
        pushMarketing: false,
      },
      create: expect.objectContaining({
        userId: mockUserId,
        pushEnabled: true,
        pushBookings: true,
        pushCancellations: true,
        pushReminders: true,
        pushMarketing: false,
      }),
    });
  });

  it("should disable push notifications for REVOKED action", async () => {
    mockAuth(true);

    const requestBody = {
      action: "REVOKED",
      categories: {
        bookings: false,
        cancellations: false,
        reminders: false,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "settings_toggle",
    };

    const revokedLog = {
      ...mockConsentLog,
      action: ConsentAction.REVOKED,
      categories: requestBody.categories,
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue(revokedLog);
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
      ...mockPreferences,
      pushEnabled: false,
    });

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify preferences were disabled
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      update: {
        pushEnabled: false,
        pushBookings: false,
        pushCancellations: false,
        pushReminders: false,
        pushMarketing: false,
      },
      create: expect.objectContaining({
        userId: mockUserId,
        pushEnabled: false,
      }),
    });
  });

  it("should update specific categories for CATEGORIES_CHANGED action", async () => {
    mockAuth(true);

    const requestBody = {
      action: "CATEGORIES_CHANGED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: false, // Changed
        marketing: true, // Changed
      },
      consentVersion: "1.0",
      method: "settings_toggle",
      previousState: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
    };

    const updatedLog = {
      ...mockConsentLog,
      action: ConsentAction.CATEGORIES_CHANGED,
      categories: requestBody.categories,
      previousState: requestBody.previousState,
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue(updatedLog);
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.log.previousState).toEqual(requestBody.previousState);
  });

  it("should reject request without authentication", async () => {
    mockAuth(false);

    const requestBody = {
      action: "GRANTED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "browser_prompt",
    };

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject invalid request body", async () => {
    mockAuth(true);

    const invalidBody = {
      action: "INVALID_ACTION",
      categories: {
        bookings: "not-a-boolean", // Invalid type
      },
      // Missing required fields
    };

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      invalidBody
    );

    const response = await createConsentLog(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request");
    expect(data.details).toBeDefined();
  });

  it("should include device info if provided", async () => {
    mockAuth(true);

    const requestBody = {
      action: "GRANTED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "browser_prompt",
      deviceInfo: {
        platform: "IOS",
        model: "iPhone 14",
        osVersion: "17.1",
        appVersion: "1.2.3",
      },
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue({
      ...mockConsentLog,
      deviceInfo: requestBody.deviceInfo,
    });
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.pushConsentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deviceInfo: requestBody.deviceInfo,
      }),
    });
  });
});

// ============================================
// Tests: GET /api/notifications/consent
// ============================================

describe("GET /api/notifications/consent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return consent history and current status", async () => {
    mockAuth(true);

    const consentLogs = [
      mockConsentLog,
      {
        ...mockConsentLog,
        id: "consent-log-456",
        action: ConsentAction.CATEGORIES_CHANGED,
        timestamp: new Date("2025-12-03T12:00:00Z"),
      },
    ];

    (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue(consentLogs);
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent"
    );

    const response = await getConsentHistory();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(2);
    expect(data.logs[0].id).toBe(mockConsentLog.id);
    expect(data.currentStatus).toMatchObject({
      hasConsented: true,
      categories: mockConsentLog.categories,
      consentVersion: mockConsentLog.consentVersion,
    });

    // Verify only last 10 logs are fetched
    expect(prisma.pushConsentLog.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { timestamp: "desc" },
      take: 10,
    });
  });

  it("should return empty history for new users", async () => {
    mockAuth(true);

    (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent"
    );

    const response = await getConsentHistory();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(0);
    expect(data.currentStatus).toMatchObject({
      hasConsented: false,
      categories: null,
      consentVersion: null,
      lastUpdated: null,
    });
  });

  it("should reject request without authentication", async () => {
    mockAuth(false);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent"
    );

    const response = await getConsentHistory();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });
});

// ============================================
// Tests: GET /api/notifications/consent/status
// ============================================

describe("GET /api/notifications/consent/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return current consent status", async () => {
    mockAuth(true);

    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);
    (prisma.pushConsentLog.findFirst as jest.Mock).mockResolvedValue(mockConsentLog);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent/status"
    );

    const response = await getConsentStatus();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      hasConsented: true,
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      lastUpdated: mockConsentLog.timestamp.toISOString(),
    });

    // Verify only most recent log is fetched
    expect(prisma.pushConsentLog.findFirst).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { timestamp: "desc" },
    });
  });

  it("should return no consent status for users without consent", async () => {
    mockAuth(true);

    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
      ...mockPreferences,
      pushEnabled: false,
    });
    (prisma.pushConsentLog.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent/status"
    );

    const response = await getConsentStatus();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      hasConsented: false,
      categories: null,
      consentVersion: null,
      lastUpdated: null,
    });
  });

  it("should reject request without authentication", async () => {
    mockAuth(false);

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/notifications/consent/status"
    );

    const response = await getConsentStatus();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });
});

// ============================================
// GDPR Compliance Tests
// ============================================

describe("GDPR Compliance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should capture IP address as proof of consent", async () => {
    mockAuth(true);

    const requestBody = {
      action: "GRANTED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "browser_prompt",
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue(mockConsentLog);
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody,
      {
        "x-forwarded-for": "203.0.113.1, 198.51.100.1", // Test proxied IP
      }
    );

    await createConsentLog(request);

    // Should capture first IP from X-Forwarded-For
    expect(prisma.pushConsentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: "203.0.113.1",
      }),
    });
  });

  it("should capture User-Agent as proof of consent", async () => {
    mockAuth(true);

    const requestBody = {
      action: "GRANTED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "1.0",
      method: "browser_prompt",
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue(mockConsentLog);
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const customUserAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15";

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody,
      {
        "user-agent": customUserAgent,
      }
    );

    await createConsentLog(request);

    expect(prisma.pushConsentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userAgent: customUserAgent,
      }),
    });
  });

  it("should support consent versioning", async () => {
    mockAuth(true);

    const requestBody = {
      action: "UPDATED",
      categories: {
        bookings: true,
        cancellations: true,
        reminders: true,
        marketing: false,
      },
      consentVersion: "2.0", // New version
      method: "settings_toggle",
    };

    (prisma.pushConsentLog.create as jest.Mock).mockResolvedValue({
      ...mockConsentLog,
      consentVersion: "2.0",
    });
    (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences);

    const request = createMockRequest(
      "POST",
      "http://localhost:3000/api/notifications/consent",
      requestBody
    );

    const response = await createConsentLog(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.log.consentVersion).toBe("2.0");
  });
});
