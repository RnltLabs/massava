/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, DollarSignIcon, AlertCircleIcon } from 'lucide-react';
import { BookingStatus } from '@/app/generated/prisma';

interface DashboardStatsProps {
  userEmail: string;
}

interface StatsData {
  todayBookings: number;
  weekBookings: number;
  monthRevenue: number;
  pendingBookings: number;
}

async function getStatsData(userEmail: string): Promise<StatsData> {
  // Get user's studio via User->StudioOwnership->Studio path
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  if (!user || user.ownedStudios.length === 0) {
    return {
      todayBookings: 0,
      weekBookings: 0,
      monthRevenue: 0,
      pendingBookings: 0,
    };
  }

  const studioId = user.ownedStudios[0].studioId;

  // Get date ranges
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's bookings
  const todayBookings = await prisma.newBooking.count({
    where: {
      studioId,
      createdAt: {
        gte: today,
      },
    },
  });

  // This week's bookings
  const weekBookings = await prisma.newBooking.count({
    where: {
      studioId,
      createdAt: {
        gte: weekAgo,
      },
    },
  });

  // Pending bookings
  const pendingBookings = await prisma.newBooking.count({
    where: {
      studioId,
      status: BookingStatus.PENDING,
    },
  });

  // Month revenue (placeholder - will be calculated from actual booking prices)
  const monthBookings = await prisma.newBooking.count({
    where: {
      studioId,
      status: BookingStatus.CONFIRMED,
      createdAt: {
        gte: monthStart,
      },
    },
  });

  // Placeholder revenue calculation (€80 average per booking)
  const monthRevenue = monthBookings * 80;

  return {
    todayBookings,
    weekBookings,
    monthRevenue,
    pendingBookings,
  };
}

export async function DashboardStats({ userEmail }: DashboardStatsProps): Promise<React.JSX.Element> {
  const stats = await getStatsData(userEmail);

  const statCards = [
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: CalendarIcon,
      description: 'New bookings today',
    },
    {
      title: "This Week's Bookings",
      value: stats.weekBookings,
      icon: ClockIcon,
      description: 'Last 7 days',
    },
    {
      title: 'Monthly Revenue',
      value: `€${stats.monthRevenue.toLocaleString()}`,
      icon: DollarSignIcon,
      description: 'This month',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: AlertCircleIcon,
      description: 'Awaiting confirmation',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
