/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { MetricCard } from './MetricCard';
import { RevenueChart } from './RevenueChart';
import { BookingsChart } from './BookingsChart';
import { TopServices } from './TopServices';
import { CustomerInsights } from './CustomerInsights';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { EuroIcon, CalendarIcon, UsersIcon, TrendingUpIcon, DownloadIcon, FileTextIcon } from 'lucide-react';
import type { BookingStats, DateRange } from '@/lib/schemas/stats.schema';
import { getBookingStats, exportStats } from '../../actions/stats';

interface StatsClientProps {
  initialStats: BookingStats;
  initialDateRange: DateRange;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last3months', label: 'Last 3 months' },
  { value: 'last12months', label: 'Last 12 months' },
];

export function StatsClient({ initialStats, initialDateRange }: StatsClientProps): React.JSX.Element {
  const t = useTranslations('business.stats');
  const { toast } = useToast();

  const [stats, setStats] = useState<BookingStats>(initialStats);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasData = stats.bookings.total > 0;

  const handleFilterChange = async (newDateRange: DateRange, newServiceId: string | null) => {
    startTransition(async () => {
      try {
        const newStats = await getBookingStats(newDateRange, newServiceId);
        setStats(newStats);
        setDateRange(newDateRange);
        setServiceId(newServiceId);
      } catch (error) {
        toast({
          title: 'Error loading statistics',
          description: 'Failed to fetch updated statistics. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const result = await exportStats(dateRange, serviceId, format);

      if (result.success) {
        toast({
          title: 'Export successful',
          description: `Statistics exported as ${format.toUpperCase()}`,
        });
      } else {
        toast({
          title: 'Export failed',
          description: result.error || 'Failed to export statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting statistics',
        variant: 'destructive',
      });
    }
  };

  if (!hasData) {
    return (
      <EmptyState
        title={t('emptyTitle') || 'No Statistics Available'}
        description={
          t('emptyDescription') || 'Start accepting bookings to see your statistics and insights here.'
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select
          value={dateRange}
          onValueChange={(value) => handleFilterChange(value as DateRange, serviceId)}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={serviceId || 'all'}
          onValueChange={(value) => handleFilterChange(dateRange, value === 'all' ? null : value)}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {stats.services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="gap-2"
          >
            <FileTextIcon className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('revenueTitle') || 'Total Revenue'}
          value={`€${stats.revenue.total.toFixed(2)}`}
          change={stats.revenue.changePercentage}
          icon={EuroIcon}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          subtitle={`€${stats.revenue.averagePerBooking.toFixed(2)} avg per booking`}
        />

        <MetricCard
          title={t('bookingsTitle') || 'Total Bookings'}
          value={stats.bookings.total}
          change={stats.bookings.changePercentage}
          icon={CalendarIcon}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          subtitle={`${stats.bookings.completionRate.toFixed(1)}% completion rate`}
        />

        <MetricCard
          title={t('customersTitle') || 'Total Customers'}
          value={stats.customers.total}
          change={stats.customers.changePercentage}
          icon={UsersIcon}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          subtitle={`${stats.customers.new} new, ${stats.customers.returning} returning`}
        />

        <MetricCard
          title={t('completedTitle') || 'Completed Bookings'}
          value={stats.bookings.completed}
          icon={TrendingUpIcon}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
          subtitle={`${stats.bookings.cancelled} cancelled, ${stats.bookings.noShow} pending`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart
          data={stats.revenue.trend}
          title={t('revenueTrendTitle') || 'Revenue Trend'}
        />
        <BookingsChart
          data={stats.bookings.trend}
          title={t('bookingsTrendTitle') || 'Bookings Over Time'}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopServices
          services={stats.topServices}
          title={t('topServicesTitle') || 'Top Services'}
        />
        <CustomerInsights
          newCustomers={stats.customers.new}
          returningCustomers={stats.customers.returning}
          averageBookingValue={stats.revenue.averagePerBooking}
          title={t('customerInsightsTitle') || 'Customer Insights'}
        />
      </div>
    </div>
  );
}
