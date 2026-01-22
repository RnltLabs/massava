/**
 * Push Notification Metrics Database Queries
 *
 * Optimized queries for aggregating push notification analytics data.
 * Designed for high-performance analytics across large datasets.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma';
import type {
  PushNotificationMetrics,
  TimeSeriesDataPoint,
  PushMetricsByType,
} from '@/lib/schemas/push-metrics.schema';

/**
 * Options for fetching push notification metrics
 */
export interface FetchPushMetricsOptions {
  startDate: Date;
  endDate: Date;
  studioId?: string;
  userId?: string;
}

/**
 * Get total user count (for opt-in rate calculation)
 */
async function getTotalUserCount(options: FetchPushMetricsOptions): Promise<number> {
  const where: Prisma.UserWhereInput = {
    createdAt: {
      lte: options.endDate,
    },
  };

  // If filtering by studio, only count users with bookings at that studio
  if (options.studioId) {
    where.newBookings = {
      some: {
        studioId: options.studioId,
      },
    };
  }

  return prisma.user.count({ where });
}

/**
 * Get consent metrics (opt-in, opt-out rates)
 */
async function getConsentMetrics(options: FetchPushMetricsOptions) {
  const where: Prisma.PushConsentLogWhereInput = {
    timestamp: {
      gte: options.startDate,
      lte: options.endDate,
    },
  };

  if (options.userId) {
    where.userId = options.userId;
  }

  // Get all consent actions
  const consentLogs = await prisma.pushConsentLog.findMany({
    where,
    select: {
      action: true,
      userId: true,
    },
  });

  // Calculate unique users per action
  const grantedUsers = new Set<string>();
  const revokedUsers = new Set<string>();

  for (const log of consentLogs) {
    if (log.action === 'GRANTED') {
      grantedUsers.add(log.userId);
    } else if (log.action === 'REVOKED') {
      revokedUsers.add(log.userId);
    }
  }

  // Get current active consents (users with push enabled)
  const activeConsentsWhere: Prisma.NotificationPreferenceWhereInput = {
    pushEnabled: true,
  };

  if (options.studioId) {
    // Filter users who have bookings at this studio
    activeConsentsWhere.user = {
      newBookings: {
        some: {
          studioId: options.studioId,
        },
      },
    };
  }

  const activeConsents = await prisma.notificationPreference.count({
    where: activeConsentsWhere,
  });

  return {
    totalConsents: grantedUsers.size,
    totalRevocations: revokedUsers.size,
    activeConsents,
  };
}

/**
 * Get active device metrics
 */
async function getDeviceMetrics(options: FetchPushMetricsOptions) {
  const where: Prisma.DeviceTokenWhereInput = {
    isActive: true,
    lastUsedAt: {
      gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Active in last 90 days
    },
  };

  if (options.studioId) {
    // Filter devices belonging to users with bookings at this studio
    where.user = {
      newBookings: {
        some: {
          studioId: options.studioId,
        },
      },
    };
  }

  const devices = await prisma.deviceToken.groupBy({
    by: ['platform'],
    where,
    _count: {
      id: true,
    },
  });

  const devicesByPlatform = {
    IOS: 0,
    ANDROID: 0,
    WEB: 0,
  };

  for (const device of devices) {
    devicesByPlatform[device.platform as keyof typeof devicesByPlatform] = device._count.id;
  }

  const activeDevices = devices.reduce((sum, d) => sum + d._count.id, 0);

  return {
    activeDevices,
    devicesByPlatform,
  };
}

/**
 * Get notification delivery metrics (overall)
 */
async function getDeliveryMetrics(options: FetchPushMetricsOptions) {
  const where: Prisma.NotificationWhereInput = {
    createdAt: {
      gte: options.startDate,
      lte: options.endDate,
    },
    channels: {
      has: 'PUSH',
    },
  };

  if (options.studioId) {
    // Filter notifications for users with bookings at this studio
    where.user = {
      newBookings: {
        some: {
          studioId: options.studioId,
        },
      },
    };
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  // Aggregate counts by status
  const notifications = await prisma.notification.findMany({
    where,
    select: {
      status: true,
      pushDeliveredAt: true,
      pushReadAt: true,
      pushFailedAt: true,
    },
  });

  let totalSent = 0;
  let totalDelivered = 0;
  let totalClicked = 0;
  let totalFailed = 0;

  for (const notification of notifications) {
    totalSent++;

    if (notification.pushDeliveredAt) {
      totalDelivered++;
    }

    if (notification.pushReadAt) {
      totalClicked++;
    }

    if (notification.pushFailedAt) {
      totalFailed++;
    }
  }

  return {
    totalSent,
    totalDelivered,
    totalClicked,
    totalFailed,
  };
}

/**
 * Get notification metrics by type
 */
async function getMetricsByType(
  options: FetchPushMetricsOptions,
): Promise<Record<string, PushMetricsByType>> {
  const where: Prisma.NotificationWhereInput = {
    createdAt: {
      gte: options.startDate,
      lte: options.endDate,
    },
    channels: {
      has: 'PUSH',
    },
  };

  if (options.studioId) {
    where.user = {
      newBookings: {
        some: {
          studioId: options.studioId,
        },
      },
    };
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  const notifications = await prisma.notification.findMany({
    where,
    select: {
      type: true,
      pushDeliveredAt: true,
      pushReadAt: true,
      pushFailedAt: true,
    },
  });

  // Group by type
  const metricsByType: Record<
    string,
    { sent: number; delivered: number; clicked: number; failed: number }
  > = {};

  for (const notification of notifications) {
    const type = notification.type;

    if (!metricsByType[type]) {
      metricsByType[type] = {
        sent: 0,
        delivered: 0,
        clicked: 0,
        failed: 0,
      };
    }

    metricsByType[type].sent++;

    if (notification.pushDeliveredAt) {
      metricsByType[type].delivered++;
    }

    if (notification.pushReadAt) {
      metricsByType[type].clicked++;
    }

    if (notification.pushFailedAt) {
      metricsByType[type].failed++;
    }
  }

  // Calculate rates
  const result: Record<string, PushMetricsByType> = {};

  for (const [type, metrics] of Object.entries(metricsByType)) {
    result[type] = {
      ...metrics,
      deliveryRate: metrics.sent > 0 ? metrics.delivered / metrics.sent : 0,
      clickRate: metrics.delivered > 0 ? metrics.clicked / metrics.delivered : 0,
    };
  }

  return result;
}

/**
 * Get time series data (daily granularity for last 30 days)
 */
async function getTimeSeriesDaily(
  options: FetchPushMetricsOptions,
): Promise<TimeSeriesDataPoint[]> {
  const where: Prisma.NotificationWhereInput = {
    createdAt: {
      gte: options.startDate,
      lte: options.endDate,
    },
    channels: {
      has: 'PUSH',
    },
  };

  if (options.studioId) {
    where.user = {
      newBookings: {
        some: {
          studioId: options.studioId,
        },
      },
    };
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  // Fetch all notifications in range
  const notifications = await prisma.notification.findMany({
    where,
    select: {
      createdAt: true,
      pushDeliveredAt: true,
      pushReadAt: true,
      pushFailedAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Fetch consent logs in range
  const consentWhere: Prisma.PushConsentLogWhereInput = {
    timestamp: {
      gte: options.startDate,
      lte: options.endDate,
    },
  };

  if (options.userId) {
    consentWhere.userId = options.userId;
  }

  const consentLogs = await prisma.pushConsentLog.findMany({
    where: consentWhere,
    select: {
      timestamp: true,
      action: true,
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  // Group by day
  const dailyMetrics = new Map<
    string,
    {
      sent: number;
      delivered: number;
      clicked: number;
      failed: number;
      consentsGranted: number;
      consentsRevoked: number;
    }
  >();

  // Initialize all days in range
  const currentDate = new Date(options.startDate);
  while (currentDate <= options.endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyMetrics.set(dateKey, {
      sent: 0,
      delivered: 0,
      clicked: 0,
      failed: 0,
      consentsGranted: 0,
      consentsRevoked: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Aggregate notifications
  for (const notification of notifications) {
    const dateKey = notification.createdAt.toISOString().split('T')[0];
    const metrics = dailyMetrics.get(dateKey);

    if (metrics) {
      metrics.sent++;

      if (notification.pushDeliveredAt) {
        metrics.delivered++;
      }

      if (notification.pushReadAt) {
        metrics.clicked++;
      }

      if (notification.pushFailedAt) {
        metrics.failed++;
      }
    }
  }

  // Aggregate consent logs
  for (const log of consentLogs) {
    const dateKey = log.timestamp.toISOString().split('T')[0];
    const metrics = dailyMetrics.get(dateKey);

    if (metrics) {
      if (log.action === 'GRANTED') {
        metrics.consentsGranted++;
      } else if (log.action === 'REVOKED') {
        metrics.consentsRevoked++;
      }
    }
  }

  // Convert to array
  const timeSeries: TimeSeriesDataPoint[] = [];

  dailyMetrics.forEach((metrics, dateKey) => {
    timeSeries.push({
      date: new Date(dateKey + 'T00:00:00Z').toISOString(),
      ...metrics,
    });
  });

  return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fetch comprehensive push notification metrics
 */
export async function fetchPushNotificationMetrics(
  options: FetchPushMetricsOptions,
): Promise<PushNotificationMetrics> {
  // Execute all queries in parallel for performance
  const [
    totalUsers,
    consentMetrics,
    deviceMetrics,
    deliveryMetrics,
    metricsByType,
    timeSeriesDaily,
  ] = await Promise.all([
    getTotalUserCount(options),
    getConsentMetrics(options),
    getDeviceMetrics(options),
    getDeliveryMetrics(options),
    getMetricsByType(options),
    getTimeSeriesDaily(options),
  ]);

  // Calculate rates
  const optInRate = totalUsers > 0 ? consentMetrics.activeConsents / totalUsers : 0;
  const deliveryRate =
    deliveryMetrics.totalSent > 0
      ? deliveryMetrics.totalDelivered / deliveryMetrics.totalSent
      : 0;
  const clickRate =
    deliveryMetrics.totalDelivered > 0
      ? deliveryMetrics.totalClicked / deliveryMetrics.totalDelivered
      : 0;
  const optOutRate =
    consentMetrics.totalConsents > 0
      ? consentMetrics.totalRevocations / consentMetrics.totalConsents
      : 0;

  return {
    // Overall metrics
    optInRate,
    deliveryRate,
    clickRate,
    optOutRate,

    // Absolute counts
    totalUsers,
    totalConsents: consentMetrics.totalConsents,
    totalRevocations: consentMetrics.totalRevocations,
    totalSent: deliveryMetrics.totalSent,
    totalDelivered: deliveryMetrics.totalDelivered,
    totalClicked: deliveryMetrics.totalClicked,
    totalFailed: deliveryMetrics.totalFailed,

    // Active devices
    activeDevices: deviceMetrics.activeDevices,
    devicesByPlatform: deviceMetrics.devicesByPlatform,

    // Metrics by type
    byType: metricsByType,

    // Time series
    timeSeriesDaily,

    // Metadata
    generatedAt: new Date().toISOString(),
    periodStart: options.startDate.toISOString(),
    periodEnd: options.endDate.toISOString(),
  };
}
