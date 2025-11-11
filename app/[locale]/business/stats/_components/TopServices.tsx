/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TopService } from '@/lib/schemas/stats.schema';

interface TopServicesProps {
  services: TopService[];
  title?: string;
}

export function TopServices({ services, title = 'Top Services' }: TopServicesProps): React.JSX.Element {
  const maxRevenue = Math.max(...services.map(s => s.revenue), 1);

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No service data available</p>
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
          {services.map((service) => {
            const percentage = (service.revenue / maxRevenue) * 100;

            return (
              <div key={service.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.bookings} bookings</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    €{service.revenue.toFixed(2)}
                  </p>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
