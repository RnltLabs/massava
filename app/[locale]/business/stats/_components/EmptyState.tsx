/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3Icon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'No Statistics Available',
  description = 'Start accepting bookings to see your statistics and insights here.',
}: EmptyStateProps): React.JSX.Element {
  return (
    <Card>
      <CardContent className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <BarChart3Icon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 max-w-md">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
