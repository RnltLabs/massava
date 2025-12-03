/**
 * Notification Banner Component
 *
 * Displays a slide-down banner for high-priority notifications.
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Bell, Calendar, CreditCard, Star, Shield, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBannerProps {
  notification: {
    id: string;
    title: string;
    body: string;
    priority: string;
    type: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  };
}

function getIconForType(type: string): React.ElementType {
  if (type.includes('BOOKING')) return Calendar;
  if (type.includes('PAYMENT')) return CreditCard;
  if (type.includes('REVIEW')) return Star;
  if (type.includes('ACCOUNT') || type.includes('SECURITY')) return Shield;
  if (type.includes('SYSTEM')) return Settings;
  return Bell;
}

export function NotificationBanner({ notification }: NotificationBannerProps) {
  const { dismissBanner, markAsRead } = useNotificationStore();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss for non-urgent notifications after 10 seconds
  useEffect(() => {
    if (notification.priority !== 'URGENT') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(dismissBanner, 300);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification.priority, dismissBanner]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(dismissBanner, 300);
  };

  const handleAction = (action: string) => {
    markAsRead(notification.id);

    if (action === 'view' && notification.actionUrl) {
      window.location.href = notification.actionUrl;
    } else if (action === 'confirm' && notification.actionUrl) {
      window.location.href = notification.actionUrl + '?action=confirm';
    }

    handleDismiss();
  };

  // Get action buttons based on notification type
  const getActions = () => {
    switch (notification.type) {
      case 'BOOKING_REQUEST_RECEIVED':
        return [
          { label: 'Bestätigen', action: 'confirm', variant: 'default' as const },
          { label: 'Details', action: 'view', variant: 'outline' as const },
        ];
      case 'BOOKING_REMINDER_CUSTOMER':
      case 'BOOKING_REMINDER_STUDIO':
        return [
          { label: 'Termin anzeigen', action: 'view', variant: 'default' as const },
        ];
      default:
        return notification.actionUrl
          ? [{ label: 'Anzeigen', action: 'view', variant: 'default' as const }]
          : [];
    }
  };

  const Icon = getIconForType(notification.type);
  const actions = getActions();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-16 left-0 right-0 z-50 px-4"
        >
          <div className="container mx-auto max-w-2xl">
            <Alert
              className={cn(
                'relative shadow-lg border-2',
                notification.priority === 'URGENT' && 'border-destructive bg-destructive/5',
                notification.priority === 'HIGH' && 'border-primary bg-primary/5',
                notification.priority === 'NORMAL' && 'border-border'
              )}
            >
              <Icon className="h-4 w-4" />
              <AlertTitle className="font-semibold pr-8">{notification.title}</AlertTitle>
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                  {actions.length > 0 && (
                    <div className="flex gap-2 shrink-0">
                      {actions.map((action) => (
                        <Button
                          key={action.action}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleAction(action.action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Schließen</span>
              </Button>
            </Alert>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
