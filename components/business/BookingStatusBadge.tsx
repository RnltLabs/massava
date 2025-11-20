/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/app/generated/prisma';
import { cn } from '@/lib/utils';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps): React.JSX.Element {
  const statusConfig = {
    [BookingStatus.PENDING]: {
      label: 'Ausstehend',
      variant: 'warning' as const,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    [BookingStatus.CONFIRMED]: {
      label: 'Bestätigt',
      variant: 'success' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    [BookingStatus.CANCELLED]: {
      label: 'Storniert',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
