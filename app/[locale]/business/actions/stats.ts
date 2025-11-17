/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { auth } from '@/auth';
import type { DateRange, BookingStats } from '@/lib/schemas/stats.schema';
import { BookingStatus } from '@/app/generated/prisma';
import { subDays, subMonths, startOfDay, endOfDay, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

/**
 * Get date range boundaries based on filter
 */
function getDateRange(range: DateRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;

  switch (range) {
    case 'last7days':
      start = startOfDay(subDays(end, 6));
      break;
    case 'last30days':
      start = startOfDay(subDays(end, 29));
      break;
    case 'last3months':
      start = startOfDay(subMonths(end, 3));
      break;
    case 'last12months':
      start = startOfDay(subMonths(end, 12));
      break;
    default:
      start = startOfDay(subDays(end, 29));
  }

  return { start, end };
}

/**
 * Get interval type for grouping based on date range
 */
function getIntervalType(range: DateRange): 'day' | 'week' | 'month' {
  switch (range) {
    case 'last7days':
    case 'last30days':
      return 'day';
    case 'last3months':
      return 'week';
    case 'last12months':
      return 'month';
    default:
      return 'day';
  }
}

/**
 * Format date based on interval type
 */
function formatDateForInterval(date: Date, interval: 'day' | 'week' | 'month'): string {
  switch (interval) {
    case 'day':
      return format(date, 'MMM dd');
    case 'week':
      return format(date, 'MMM dd');
    case 'month':
      return format(date, 'MMM yyyy');
    default:
      return format(date, 'MMM dd');
  }
}

/**
 * Get booking statistics for the specified date range
 */
export async function getBookingStats(
  dateRange: DateRange = 'last30days',
  serviceId: string | null = null
): Promise<BookingStats> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    // Get user's studio through ownership
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        ownedStudios: {
          select: {
            studioId: true,
          },
          take: 1,
        },
      },
    });

    if (!user || user.ownedStudios.length === 0) {
      throw new Error('Studio not found');
    }

    const studioId = user.ownedStudios[0].studioId;

    const { start, end } = getDateRange(dateRange);
    const intervalType = getIntervalType(dateRange);

    // Build where clause
    const whereClause = {
      studioId,
      createdAt: {
        gte: start,
        lte: end,
      },
      ...(serviceId && { serviceId }),
    };

    // Fetch bookings in date range
    const bookings = await prisma.newBooking.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get previous period bookings for comparison
    const previousPeriodStart = new Date(start);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (end.getTime() - start.getTime()));

    const previousBookings = await prisma.newBooking.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: previousPeriodStart,
          lt: start,
        },
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    // Calculate metrics
    const completedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED);
    const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);

    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0);
    const avgRevenuePerBooking = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
    const completionRate = bookings.length > 0 ? (completedBookings.length / bookings.length) * 100 : 0;

    // Previous period calculations
    const previousTotalRevenue = previousBookings
      .filter(b => b.status === BookingStatus.CONFIRMED)
      .reduce((sum, b) => sum + (b.service?.price || 0), 0);

    const revenueChange = previousTotalRevenue > 0
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : 0;

    const bookingsChange = previousBookings.length > 0
      ? ((bookings.length - previousBookings.length) / previousBookings.length) * 100
      : 0;

    // Calculate unique customers
    const uniqueCustomerEmails = new Set(bookings.map(b => b.customerEmail));
    const totalCustomers = uniqueCustomerEmails.size;

    // Get customers from previous period to determine new vs returning
    const previousCustomers = await prisma.newBooking.findMany({
      where: {
        studioId,
        createdAt: {
          lt: start,
        },
      },
      select: {
        customerEmail: true,
      },
      distinct: ['customerEmail'],
    });

    const previousCustomerEmails = new Set(previousCustomers.map(c => c.customerEmail));
    const newCustomers = Array.from(uniqueCustomerEmails).filter(email => !previousCustomerEmails.has(email)).length;
    const returningCustomers = totalCustomers - newCustomers;

    const previousPeriodCustomers = await prisma.newBooking.findMany({
      where: {
        studioId,
        createdAt: {
          gte: previousPeriodStart,
          lt: start,
        },
      },
      select: {
        customerEmail: true,
      },
      distinct: ['customerEmail'],
    });

    const customersChange = previousPeriodCustomers.length > 0
      ? ((totalCustomers - previousPeriodCustomers.length) / previousPeriodCustomers.length) * 100
      : 0;

    // Generate trend data
    let dateIntervals: Date[];
    switch (intervalType) {
      case 'day':
        dateIntervals = eachDayOfInterval({ start, end });
        break;
      case 'week':
        dateIntervals = eachWeekOfInterval({ start, end });
        break;
      case 'month':
        dateIntervals = eachMonthOfInterval({ start, end });
        break;
    }

    const revenueTrend = dateIntervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => {
        const bookingDate = format(b.createdAt, 'yyyy-MM-dd');
        return bookingDate === dateStr && b.status === BookingStatus.CONFIRMED;
      });
      const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0);

      return {
        date: formatDateForInterval(date, intervalType),
        amount: dayRevenue,
      };
    });

    const bookingsTrend = dateIntervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => format(b.createdAt, 'yyyy-MM-dd') === dateStr);

      return {
        date: formatDateForInterval(date, intervalType),
        completed: dayBookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
        cancelled: dayBookings.filter(b => b.status === BookingStatus.CANCELLED).length,
        noShow: dayBookings.filter(b => b.status === BookingStatus.PENDING).length, // Treating pending as "pending/no-show"
      };
    });

    // Calculate top services
    const serviceStats = new Map<string, { name: string; bookings: number; revenue: number }>();

    bookings.forEach(booking => {
      if (!booking.service) return;

      const current = serviceStats.get(booking.service.id) || {
        name: booking.service.name,
        bookings: 0,
        revenue: 0,
      };

      current.bookings += 1;
      if (booking.status === BookingStatus.CONFIRMED) {
        current.revenue += booking.service.price;
      }

      serviceStats.set(booking.service.id, current);
    });

    const topServices = Array.from(serviceStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        bookings: stats.bookings,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get all services for filter
    const services = await prisma.service.findMany({
      where: {
        studioId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      revenue: {
        total: totalRevenue,
        changePercentage: revenueChange,
        averagePerBooking: avgRevenuePerBooking,
        trend: revenueTrend,
      },
      bookings: {
        total: bookings.length,
        completed: completedBookings.length,
        cancelled: cancelledBookings.length,
        noShow: pendingBookings.length, // Using pending as "no-show" equivalent
        completionRate,
        changePercentage: bookingsChange,
        trend: bookingsTrend,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomers,
        changePercentage: customersChange,
      },
      topServices,
      services,
    };
  } catch (error) {
    logger.error('Error fetching booking stats', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Export statistics data
 * TODO: Implement actual CSV/PDF generation
 */
export async function exportStats(
  dateRange: DateRange,
  serviceId: string | null,
  format: 'csv' | 'pdf'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Implement CSV/PDF generation
    // For now, just return success
    logger.info('Export stats requested', { dateRange, serviceId, format, userEmail: session.user.email });

    return { success: true };
  } catch (error) {
    logger.error('Error exporting stats', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { success: false, error: 'Failed to export statistics' };
  }
}
