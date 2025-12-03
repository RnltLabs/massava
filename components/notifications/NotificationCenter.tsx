/**
 * Notification Center Component
 *
 * Displays the notification center as a sheet (desktop) or drawer (mobile).
 */

'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Settings, CheckCheck, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationCard } from './NotificationCard';
import { NotificationBell } from './NotificationBell';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationCenter() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    notifications,
    isNotificationCenterOpen,
    setNotificationCenterOpen,
    markAllAsRead,
    unreadCount,
    isLoading,
    fetchNotifications,
    error,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.inAppSeenAt;
    return true;
  });

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (notification.actionUrl) {
      setNotificationCenterOpen(false);
      window.location.href = notification.actionUrl;
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Actions bar */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Alle gelesen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNotifications()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
            Aktualisieren
          </Button>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/settings/notifications">
            <Settings className="h-4 w-4 mr-1" />
            Einstellungen
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="unread">
            Ungelesen {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 mt-4">
          {error && (
            <div className="text-center py-4 text-destructive text-sm">
              {error}
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-320px)]">
            <div className="space-y-2 pr-4">
              {isLoading && notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Laden...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTab === 'unread'
                    ? 'Keine ungelesenen Benachrichtigungen'
                    : 'Keine Benachrichtigungen'}
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Use Sheet for both desktop and mobile (mobile uses bottom sheet style)
  return (
    <>
      <NotificationBell onClick={() => setNotificationCenterOpen(true)} />
      <Sheet
        open={isNotificationCenterOpen}
        onOpenChange={setNotificationCenterOpen}
      >
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            isMobile ? 'h-[85vh] rounded-t-xl' : 'w-[400px] sm:w-[440px]'
          )}
        >
          <SheetHeader>
            <SheetTitle>Benachrichtigungen</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
