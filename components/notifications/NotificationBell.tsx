/**
 * Notification Bell Component
 *
 * Displays notification bell icon with unread count badge.
 */

'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { unreadCount, setNotificationCenterOpen } = useNotificationStore();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setNotificationCenterOpen(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={handleClick}
      aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full p-0 text-xs flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
