/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BookingsTrend } from '@/lib/schemas/stats.schema';

interface BookingsChartProps {
  data: BookingsTrend[];
  title?: string;
}

export function BookingsChart({ data, title = 'Bookings Over Time' }: BookingsChartProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="circle"
            />
            <Bar
              dataKey="completed"
              fill="#10b981"
              name="Completed"
              radius={[4, 4, 0, 0]}
              stackId="bookings"
            />
            <Bar
              dataKey="cancelled"
              fill="#ef4444"
              name="Cancelled"
              radius={[4, 4, 0, 0]}
              stackId="bookings"
            />
            <Bar
              dataKey="noShow"
              fill="#f59e0b"
              name="Pending"
              radius={[4, 4, 0, 0]}
              stackId="bookings"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
