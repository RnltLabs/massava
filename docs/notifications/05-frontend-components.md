# Frontend Components

## Overview

This document covers:
1. Zustand notification store
2. SSE client hook
3. UI components (Banner, Center, Card, Bell, Settings)
4. Push registration hook

**CRITICAL:** All components must match Massava's existing design. Before implementing, analyze:
- `tailwind.config.ts` for colors and theme
- `components/ui/` for existing shadcn components
- Existing pages for layout patterns

## 1. Zustand Store

```typescript
// stores/notification-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  inAppSeenAt?: string;
}

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Banner queue
  bannerQueue: Notification[];
  currentBanner: Notification | null;

  // UI state
  isNotificationCenterOpen: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;

  // Banner actions
  showBanner: (notification: Notification) => void;
  dismissBanner: () => void;

  // UI actions
  setNotificationCenterOpen: (open: boolean) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      bannerQueue: [],
      currentBanner: null,
      isNotificationCenterOpen: false,

      // Actions
      setNotifications: (notifications) => set({ notifications }),

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Show banner for high priority
        if (['URGENT', 'HIGH'].includes(notification.priority)) {
          get().showBanner(notification);
        }
      },

      markAsRead: async (id) => {
        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'READ', inAppSeenAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        // API call
        try {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
          });
        } catch (error) {
          console.error('Failed to mark as read:', error);
          // Revert on error
          get().fetchUnreadCount();
        }
      },

      markAllAsRead: async () => {
        const previousCount = get().unreadCount;

        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            status: 'READ',
            inAppSeenAt: n.inAppSeenAt ?? new Date().toISOString(),
          })),
          unreadCount: 0,
        }));

        try {
          await fetch('/api/notifications/read-all', { method: 'POST' });
        } catch (error) {
          console.error('Failed to mark all as read:', error);
          set({ unreadCount: previousCount });
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      showBanner: (notification) => {
        set((state) => {
          if (state.currentBanner) {
            // Queue if banner already showing
            return { bannerQueue: [...state.bannerQueue, notification] };
          }
          return { currentBanner: notification };
        });
      },

      dismissBanner: () => {
        set((state) => {
          const [next, ...rest] = state.bannerQueue;
          return {
            currentBanner: next ?? null,
            bannerQueue: rest,
          };
        });
      },

      setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/notifications?limit=50');
          const data = await response.json();
          set({ notifications: data.items, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load notifications', isLoading: false });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await fetch('/api/notifications/unread-count');
          const data = await response.json();
          set({ unreadCount: data.count });
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist certain fields
        unreadCount: state.unreadCount,
      }),
    }
  )
);
```

## 2. SSE Hook

```typescript
// hooks/useNotificationSSE.ts

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useSession } from 'next-auth/react';

export function useNotificationSSE() {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addNotification, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!session?.user) return;

    // Don't reconnect if already connected
    if (eventSourceRef.current) return;

    const connect = () => {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'notification':
              addNotification(data.data);
              break;
            case 'badge_update':
              setUnreadCount(data.data.count);
              break;
            case 'connected':
              console.log('SSE stream ready');
              break;
          }
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Reconnect after delay
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [session?.user, addNotification, setUnreadCount]);
}
```

## 3. Notification Provider

```typescript
// components/notifications/NotificationProvider.tsx

'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { useSession } from 'next-auth/react';
import { NotificationBanner } from './NotificationBanner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { fetchNotifications, fetchUnreadCount, currentBanner } = useNotificationStore();

  // Connect to SSE
  useNotificationSSE();

  // Initial fetch
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [session?.user, fetchNotifications, fetchUnreadCount]);

  return (
    <>
      {children}
      {currentBanner && <NotificationBanner notification={currentBanner} />}
    </>
  );
}
```

## 4. UI Components

### NotificationBell

```typescript
// components/notifications/NotificationBell.tsx

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
```

### NotificationBanner

```typescript
// components/notifications/NotificationBanner.tsx

'use client';

import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
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

export function NotificationBanner({ notification }: NotificationBannerProps) {
  const { dismissBanner, markAsRead } = useNotificationStore();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss for non-urgent notifications
  useEffect(() => {
    if (notification.priority !== 'URGENT' && notification.priority !== 'HIGH') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification.priority]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(dismissBanner, 300);
  };

  const handleAction = (action: string) => {
    markAsRead(notification.id);

    if (action === 'view' && notification.actionUrl) {
      window.location.href = notification.actionUrl;
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
        return [
          { label: 'Anzeigen', action: 'view', variant: 'default' as const },
        ];
    }
  };

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
                'relative shadow-lg',
                notification.priority === 'URGENT' && 'border-destructive bg-destructive/10',
                notification.priority === 'HIGH' && 'border-primary bg-primary/10',
                notification.priority === 'NORMAL' && 'border-border',
              )}
            >
              <Bell className="h-4 w-4" />
              <AlertTitle className="font-semibold">{notification.title}</AlertTitle>
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                  <div className="flex gap-2 shrink-0">
                    {getActions().map((action) => (
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
```

### NotificationCard

```typescript
// components/notifications/NotificationCard.tsx

'use client';

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, Calendar, CreditCard, Star, Shield, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    inAppSeenAt?: string;
  };
  onClick?: () => void;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  BOOKING: Calendar,
  PAYMENT: CreditCard,
  REVIEW: Star,
  SECURITY: Shield,
  SYSTEM: Settings,
};

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const { markAsRead } = useNotificationStore();
  const isUnread = !notification.inAppSeenAt;

  const getIconForType = (type: string) => {
    if (type.includes('BOOKING')) return Calendar;
    if (type.includes('PAYMENT')) return CreditCard;
    if (type.includes('REVIEW')) return Star;
    if (type.includes('ACCOUNT')) return Shield;
    if (type.includes('SYSTEM')) return Settings;
    return Bell;
  };

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
        'p-4 cursor-pointer transition-colors hover:bg-accent',
        isUnread && 'border-primary bg-primary/5'
      )}
      onClick={handleClick}
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
              <p className={cn('truncate', isUnread && 'font-semibold')}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.body}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </p>
            </div>
            {isUnread && (
              <Badge variant="secondary" className="shrink-0">
                Neu
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

### NotificationCenter

```typescript
// components/notifications/NotificationCenter.tsx

'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationCard } from './NotificationCard';
import { NotificationBell } from './NotificationBell';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Link from 'next/link';

export function NotificationCenter() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    notifications,
    isNotificationCenterOpen,
    setNotificationCenterOpen,
    markAllAsRead,
    unreadCount,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.inAppSeenAt;
    return true;
  });

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Alle gelesen
          </Button>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/notifications">
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="unread">
            Ungelesen {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[calc(100vh-200px)] md:h-[calc(100vh-250px)]">
            <div className="space-y-2 pr-4">
              {filteredNotifications.length === 0 ? (
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
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );

  if (isMobile) {
    return (
      <>
        <NotificationBell onClick={() => setNotificationCenterOpen(true)} />
        <Drawer
          open={isNotificationCenterOpen}
          onOpenChange={setNotificationCenterOpen}
        >
          <DrawerContent className="h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Benachrichtigungen</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">{content}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <NotificationBell onClick={() => setNotificationCenterOpen(true)} />
      <Sheet
        open={isNotificationCenterOpen}
        onOpenChange={setNotificationCenterOpen}
      >
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Benachrichtigungen</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### NotificationSettings

```typescript
// components/notifications/NotificationSettings.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const formSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
  emailDigestEnabled: z.boolean(),
  digestFrequency: z.enum(['DAILY', 'WEEKLY']),
});

type FormValues = z.infer<typeof formSchema>;

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      emailDigestEnabled: false,
      digestFrequency: 'DAILY',
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        const data = await response.json();
        form.reset(data);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error();

      toast.success('Einstellungen gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (isLoading) {
    return <div>Laden...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungskanäle</CardTitle>
            <CardDescription>
              Wähle, wie du Benachrichtigungen erhalten möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pushEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Push-Benachrichtigungen</FormLabel>
                    <FormDescription>
                      Benachrichtigungen auf deinem Gerät
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>E-Mail-Benachrichtigungen</FormLabel>
                    <FormDescription>
                      Wichtige Updates per E-Mail
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="inAppEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>In-App-Benachrichtigungen</FormLabel>
                    <FormDescription>
                      Benachrichtigungen innerhalb der App
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ruhezeiten</CardTitle>
            <CardDescription>
              Pausiere nicht-dringende Benachrichtigungen während bestimmter Zeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Ruhezeiten aktivieren</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('quietHoursEnabled') && (
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Von</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Bis</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Zusammenfassung</CardTitle>
            <CardDescription>
              Erhalte eine Zusammenfassung statt einzelner E-Mails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="emailDigestEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Zusammenfassung aktivieren</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('emailDigestEnabled') && (
              <FormField
                control={form.control}
                name="digestFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Häufigkeit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Täglich</SelectItem>
                        <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </Form>
  );
}
```

## 5. Push Registration Hook

```typescript
// hooks/usePushRegistration.ts

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { requestPushPermission } from '@/lib/firebase/firebase-client';

export function usePushRegistration() {
  const { data: session } = useSession();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const register = async (): Promise<boolean> => {
    if (!session?.user || !isSupported) return false;

    try {
      const token = await requestPushPermission();
      if (!token) return false;

      // Register token with backend
      await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: 'WEB',
          deviceName: navigator.userAgent,
        }),
      });

      setIsRegistered(true);
      return true;
    } catch (error) {
      console.error('Push registration failed:', error);
      return false;
    }
  };

  return { isSupported, isRegistered, register };
}
```

## 6. Integration

Add NotificationProvider to root layout:

```typescript
// app/[locale]/layout.tsx (example)

import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <NotificationProvider>
            <Header>
              <NotificationCenter />
            </Header>
            {children}
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Dependencies to Install

```bash
npm install zustand
```

Note: `framer-motion` is already installed.

## Verification Checklist

- [ ] Notification bell shows correct unread count
- [ ] SSE receives real-time notifications
- [ ] Banner appears for urgent notifications
- [ ] Notification center opens/closes correctly
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Settings form saves correctly
- [ ] Mobile drawer works
- [ ] Desktop sheet works
