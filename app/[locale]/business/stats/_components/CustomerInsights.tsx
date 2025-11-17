/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CustomerInsightsProps {
  newCustomers: number;
  returningCustomers: number;
  averageBookingValue: number;
  title?: string;
}

const COLORS = {
  new: '#3b82f6',
  returning: '#10b981',
};

export function CustomerInsights({
  newCustomers,
  returningCustomers,
  averageBookingValue,
  title = 'Customer Insights',
}: CustomerInsightsProps): React.JSX.Element {
  const data = [
    { name: 'New Customers', value: newCustomers },
    { name: 'Returning Customers', value: returningCustomers },
  ];

  const totalCustomers = newCustomers + returningCustomers;

  if (totalCustomers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No customer data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS.new : COLORS.returning}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Average Booking Value</p>
              <p className="text-lg font-semibold text-gray-900">
                €{averageBookingValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
