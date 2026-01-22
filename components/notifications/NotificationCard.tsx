/**
 * Notification Card Component
 *
 * Displays a single notification in a card format.
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, Calendar, CreditCard, Star, Shield, Settings, Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notification-store';

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    priority: string;
    actionUrl?: string;
    createdAt: string;
    inAppSeenAt?: string | null;
  };
  onClick?: () => void;
}

function getIconForType(type: string): React.ElementType {
  if (type.includes('BOOKING')) return Calendar;
  if (type.includes('PAYMENT')) return CreditCard;
  if (type.includes('REVIEW')) return Star;
  if (type.includes('ACCOUNT') || type.includes('SECURITY')) return Shield;
  if (type.includes('SYSTEM')) return Settings;
  if (type.includes('PROMOTION') || type.includes('ANNOUNCEMENT')) return Megaphone;
  return Bell;
}

// Currently unused, kept for future use
// function getPriorityColor(priority: string): string {
//   switch (priority) {
//     case 'URGENT':
//       return 'bg-destructive/10 text-destructive';
//     case 'HIGH':
//       return 'bg-primary/10 text-primary';
//     default:
//       return 'bg-muted text-muted-foreground';
//   }
// }

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const { markAsRead } = useNotificationStore();
  const isUnread = !notification.inAppSeenAt;

  const Icon = getIconForType(notification.type);

  const handleClick = () => {
    if (isUnread) {
      markAsRead(notification.id);
    }
    onClick?.();
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-colors hover:bg-accent/50',
        isUnread && 'border-l-4 border-l-primary bg-primary/5'
      )}
      onClick={handleClick}
      data-testid="notification-card"
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn('truncate text-sm', isUnread && 'font-semibold')}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {notification.body}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {isUnread && (
                <Badge variant="default" className="text-xs">
                  Neu
                </Badge>
              )}
              {notification.priority === 'URGENT' && (
                <Badge variant="destructive" className="text-xs">
                  Dringend
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
