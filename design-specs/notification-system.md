# Design Specification: Notification System for Massava

## Overview
Comprehensive in-app and push notification system for Massava booking platform, supporting both Studio Owners and Customers with real-time updates, actionable notifications, and granular control over notification preferences.

## User Personas & Goals

### Studio Owner
- **Primary Goal**: Never miss a booking request
- **Secondary Goals**: Manage bookings efficiently, stay informed about business metrics
- **Pain Points**: Context switching between tasks, missed opportunities

### Customer
- **Primary Goal**: Stay informed about booking status
- **Secondary Goals**: Never miss appointments, discover studio updates
- **Pain Points**: Uncertainty about booking status, forgetting appointments

## Notification Architecture

### Three-Tier System
1. **Transient Notifications** (Toasts) - Non-critical updates
2. **Persistent Banners** - Action-required notifications
3. **Notification Center** - Full history and management

### Notification Channels
- **In-App**: Always available when app is open
- **Push**: Mobile app/PWA when app is backgrounded
- **Email**: Backup channel, digest options

## User Flows

### Flow 1: Studio Owner - New Booking Request

```
Entry Point: Working in app OR app closed

1. New booking request received
   ├─ App Open: Banner slides down from top
   │   └─ Shows: Customer name, service, time, "Confirm/Decline" buttons
   └─ App Closed: Push notification
       └─ Tap opens app → Shows booking details

2. Studio owner sees banner
   ├─ Option A: Quick action from banner
   │   ├─ Tap "Confirm" → Loading state → Success toast
   │   └─ Tap "Decline" → Confirmation dialog → Success toast
   ├─ Option B: Tap banner for details
   │   └─ Opens booking detail sheet/page
   └─ Option C: Dismiss (X)
       └─ Notification moves to notification center (unread)

3. If no action taken within 5 minutes
   └─ Banner auto-minimizes to bell icon badge

Exit Points:
- Booking confirmed → Customer notified
- Booking declined → Customer notified
- Deferred → Remains in notification center
```

### Flow 2: Customer - Appointment Reminder

```
Entry Point: 15 minutes before appointment

1. Reminder triggered
   ├─ App Open: Toast notification appears
   │   └─ "Appointment in 15 minutes at [Studio Name]"
   └─ App Closed: Push notification
       └─ Shows time and studio location

2. Customer taps notification
   └─ Opens booking detail page
       ├─ Shows: Studio location, service details, contact
       └─ Actions: Get directions, Call studio, Cancel

3. Optional: Snooze reminder
   └─ Snooze for 5 minutes → Reminder repeats

Exit Points:
- Acknowledged → No further reminders
- Ignored → No action (silent fail)
```

### Flow 3: Notification Settings Management

```
Entry Point: Profile → Settings → Notifications

1. User lands on Notification Settings
   └─ Sees categories: Bookings, Payments, Updates

2. User expands category (e.g., Bookings)
   └─ Shows toggles for each notification type:
       ├─ New booking (Studio only)
       ├─ Booking confirmed (Customer only)
       ├─ Booking cancelled
       └─ Appointment reminders

3. User configures channel per type
   └─ For each type, choose:
       ├─ In-App: On/Off
       ├─ Push: On/Off
       └─ Email: Instant/Daily/Weekly/Off

4. User sets quiet hours (optional)
   └─ Time picker: Start time → End time
       └─ Applies to non-urgent notifications only

Exit Points:
- Save changes → Toast confirmation
- Cancel → Discard changes dialog
```

## Wireframes

### Desktop Layout - Notification Banner

```
┌─────────────────────────────────────────────────────────────┐
│ NavigationHeader                                            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ <div className="fixed top-16 left-0 right-0 z-40">         │
│   <div className="container mx-auto px-4">                 │
│     <Alert className="border-primary bg-primary/10">       │
│       <Bell className="h-4 w-4" />                         │
│       <AlertTitle>New Booking Request</AlertTitle>         │
│       <AlertDescription className="flex items-center       │
│                         justify-between">                  │
│         <div>                                              │
│           <p>John Doe • Sleeve Tattoo • Tomorrow 2pm</p>   │
│           <p className="text-sm text-muted-foreground">    │
│             2 minutes ago                                  │
│           </p>                                             │
│         </div>                                            │
│         <div className="flex gap-2">                      │
│           <Button size="sm" variant="outline">            │
│             Decline                                        │
│           </Button>                                        │
│           <Button size="sm">Confirm</Button>              │
│         </div>                                            │
│       </AlertDescription>                                  │
│       <Button                                              │
│         className="absolute top-2 right-2"                 │
│         size="icon"                                        │
│         variant="ghost"                                    │
│         onClick={dismiss}                                  │
│       >                                                    │
│         <X className="h-4 w-4" />                         │
│       </Button>                                           │
│     </Alert>                                              │
│   </div>                                                  │
│ </div>                                                     │
└─────────────────────────────────────────────────────────────┘
[Main Content Area]
```

### Mobile Layout - Notification Banner

```
┌─────────────────────┐
│ Header              │
│ ┌─────────────────┐ │
│ │ 🔔 3            │ │
│ └─────────────────┘ │
└─────────────────────┘
┌─────────────────────┐
│ Notification Banner │
│ ┌─────────────────┐ │
│ │ 🔔 New Booking  │ │
│ │ John Doe        │ │
│ │ Tomorrow 2pm    │ │
│ │                 │ │
│ │ [Decline][OK]   │ │
│ └─────────────────┘ │
└─────────────────────┘
[Main Content]
```

### Notification Center - Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ <Sheet>                                                      │
│   <SheetTrigger asChild>                                    │
│     <Button variant="ghost" size="icon" className=          │
│             "relative">                                     │
│       <Bell className="h-5 w-5" />                         │
│       {unreadCount > 0 && (                                │
│         <Badge className="absolute -top-1 -right-1          │
│                 h-5 w-5 rounded-full p-0">                 │
│           {unreadCount}                                     │
│         </Badge>                                            │
│       )}                                                    │
│     </Button>                                               │
│   </SheetTrigger>                                           │
│   <SheetContent className="w-[400px] sm:w-[540px]">        │
│     <SheetHeader>                                           │
│       <SheetTitle>Notifications</SheetTitle>               │
│       <div className="flex items-center gap-2">            │
│         <Button variant="ghost" size="sm">                 │
│           Mark all read                                     │
│         </Button>                                           │
│         <Button variant="ghost" size="sm">                 │
│           Settings                                          │
│         </Button>                                           │
│       </div>                                                │
│     </SheetHeader>                                          │
│     <Tabs defaultValue="all" className="mt-4">             │
│       <TabsList className="grid w-full grid-cols-3">       │
│         <TabsTrigger value="all">All</TabsTrigger>         │
│         <TabsTrigger value="unread">                       │
│           Unread (3)                                        │
│         </TabsTrigger>                                      │
│         <TabsTrigger value="bookings">                     │
│           Bookings                                          │
│         </TabsTrigger>                                      │
│       </TabsList>                                           │
│       <TabsContent value="all">                            │
│         <ScrollArea className="h-[calc(100vh-200px)]">     │
│           <div className="space-y-2">                      │
│             {/* Notification Cards */}                      │
│             <Card className="p-4 hover:bg-accent           │
│                   cursor-pointer">                          │
│               <div className="flex gap-3">                 │
│                 <Avatar className="h-10 w-10">             │
│                   <AvatarFallback>JD</AvatarFallback>      │
│                 </Avatar>                                   │
│                 <div className="flex-1">                   │
│                   <div className="flex items-start         │
│                         justify-between">                   │
│                     <div>                                  │
│                       <p className="font-medium">          │
│                         New Booking Request                 │
│                       </p>                                 │
│                       <p className="text-sm                │
│                          text-muted-foreground">           │
│                         John Doe • Sleeve Tattoo            │
│                       </p>                                 │
│                       <p className="text-xs                │
│                          text-muted-foreground mt-1">      │
│                         2 minutes ago                       │
│                       </p>                                 │
│                     </div>                                 │
│                     <Badge variant="secondary">            │
│                       Unread                                │
│                     </Badge>                               │
│                   </div>                                   │
│                   <div className="flex gap-2 mt-3">        │
│                     <Button size="sm" variant="outline">   │
│                       Decline                               │
│                     </Button>                              │
│                     <Button size="sm">                     │
│                       Confirm                               │
│                     </Button>                              │
│                   </div>                                   │
│                 </div>                                     │
│               </div>                                       │
│             </Card>                                        │
│             {/* More notification cards... */}             │
│           </div>                                           │
│         </ScrollArea>                                      │
│       </TabsContent>                                       │
│     </Tabs>                                                │
│   </SheetContent>                                           │
│ </Sheet>                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Mobile - Notification Center (Full Screen)

```
┌─────────────────────┐
│ ← Notifications     │
│ ─────────────────── │
│ [All][Unread(3)]    │
│ [Bookings]          │
│ ─────────────────── │
│ ┌─────────────────┐ │
│ │ 🔔 New Booking  │ │
│ │ John Doe        │ │
│ │ 2 min ago   NEW │ │
│ │ [Decline] [OK]  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ ✓ Confirmed     │ │
│ │ Your booking... │ │
│ │ 1 hour ago      │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ 💰 Payment      │ │
│ │ €150 received   │ │
│ │ Yesterday       │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Notification Settings Page

```
┌─────────────────────────────────────────────────────────────┐
│ <div className="container max-w-2xl py-8">                  │
│   <div className="space-y-6">                              │
│     <div>                                                  │
│       <h1 className="text-3xl font-bold">                 │
│         Notification Settings                              │
│       </h1>                                               │
│       <p className="text-muted-foreground">               │
│         Choose how you want to be notified                │
│       </p>                                                │
│     </div>                                                │
│                                                            │
│     <Card>                                                │
│       <CardHeader>                                        │
│         <CardTitle>Booking Notifications</CardTitle>      │
│       </CardHeader>                                       │
│       <CardContent className="space-y-4">                │
│         {/* For Studio Owners */}                         │
│         <div className="space-y-4">                       │
│           <div className="flex items-center               │
│                 justify-between">                         │
│             <div>                                         │
│               <Label>New Booking Requests</Label>         │
│               <p className="text-sm text-muted-           │
│                  foreground">                             │
│                 When customers request appointments        │
│               </p>                                        │
│             </div>                                        │
│             <div className="flex gap-2">                  │
│               <div className="flex items-center gap-1">   │
│                 <Smartphone className="h-4 w-4" />        │
│                 <Switch defaultChecked />                  │
│               </div>                                       │
│               <div className="flex items-center gap-1">   │
│                 <Bell className="h-4 w-4" />              │
│                 <Switch defaultChecked />                  │
│               </div>                                       │
│               <div className="flex items-center gap-1">   │
│                 <Mail className="h-4 w-4" />              │
│                 <Select defaultValue="instant">           │
│                   <SelectTrigger className="h-8 w-24">    │
│                     <SelectValue />                        │
│                   </SelectTrigger>                        │
│                   <SelectContent>                         │
│                     <SelectItem value="instant">          │
│                       Instant                              │
│                     </SelectItem>                         │
│                     <SelectItem value="daily">            │
│                       Daily                                │
│                     </SelectItem>                         │
│                     <SelectItem value="off">Off</SelectItem>│
│                   </SelectContent>                         │
│                 </Select>                                  │
│               </div>                                       │
│             </div>                                        │
│           </div>                                          │
│                                                            │
│           <Separator />                                    │
│                                                            │
│           <div className="flex items-center               │
│                 justify-between">                         │
│             <div>                                         │
│               <Label>Booking Cancellations</Label>        │
│               <p className="text-sm text-muted-           │
│                  foreground">                             │
│                 When customers cancel appointments         │
│               </p>                                        │
│             </div>                                        │
│             <div className="flex gap-2">                  │
│               {/* Same toggle pattern */}                  │
│             </div>                                        │
│           </div>                                          │
│         </div>                                            │
│       </CardContent>                                      │
│     </Card>                                               │
│                                                            │
│     <Card>                                                │
│       <CardHeader>                                        │
│         <CardTitle>Quiet Hours</CardTitle>                │
│         <CardDescription>                                 │
│           Pause non-urgent notifications during            │
│           specific hours                                   │
│         </CardDescription>                                 │
│       </CardHeader>                                        │
│       <CardContent>                                        │
│         <div className="flex items-center gap-4">         │
│           <Switch id="quiet-hours" />                      │
│           <Label htmlFor="quiet-hours">                   │
│             Enable quiet hours                             │
│           </Label>                                        │
│         </div>                                            │
│         <div className="mt-4 flex gap-4">                 │
│           <div className="flex-1">                        │
│             <Label>From</Label>                           │
│             <Input type="time" defaultValue="22:00" />    │
│           </div>                                          │
│           <div className="flex-1">                        │
│             <Label>To</Label>                             │
│             <Input type="time" defaultValue="08:00" />    │
│           </div>                                          │
│         </div>                                            │
│       </CardContent>                                      │
│     </Card>                                               │
│                                                            │
│     <div className="flex justify-end">                    │
│       <Button>Save Changes</Button>                       │
│     </div>                                                │
│   </div>                                                  │
│ </div>                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Specification

### 1. NotificationBanner Component

```typescript
// components/notifications/NotificationBanner.tsx
interface NotificationBanner {
  id: string
  type: 'booking' | 'payment' | 'message' | 'reminder'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: Date
  actions?: {
    label: string
    action: () => void
    variant?: 'default' | 'destructive' | 'outline'
  }[]
  persistent: boolean // If true, doesn't auto-dismiss
  dismissible: boolean
}

// Implementation using shadcn/ui Alert
<Alert className={cn(
  "fixed top-16 left-0 right-0 z-50",
  "animate-in slide-in-from-top-2",
  priority === 'high' && "border-destructive bg-destructive/10",
  priority === 'medium' && "border-primary bg-primary/10",
  priority === 'low' && "border-border"
)}>
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription>
    <div className="flex items-center justify-between">
      <div>
        <p>{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(timestamp)}
        </p>
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions.map(action => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant}
              onClick={action.action}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  </AlertDescription>
  {dismissible && (
    <Button
      className="absolute top-2 right-2"
      size="icon"
      variant="ghost"
      onClick={onDismiss}
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</Alert>
```

### 2. NotificationCenter Component

```typescript
// components/notifications/NotificationCenter.tsx
interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllRead: () => void
  onAction: (notificationId: string, actionId: string) => void
}

// Uses Sheet (mobile/desktop responsive)
const NotificationCenter = () => {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    // Full-screen drawer from bottom
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <NotificationBell count={unreadCount} />
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <NotificationList />
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Side sheet
  return (
    <Sheet>
      <SheetTrigger asChild>
        <NotificationBell count={unreadCount} />
      </SheetTrigger>
      <SheetContent className="w-[400px]">
        <NotificationList />
      </SheetContent>
    </Sheet>
  )
}
```

### 3. NotificationCard Component

```typescript
// components/notifications/NotificationCard.tsx
<Card className={cn(
  "p-4 transition-colors cursor-pointer",
  "hover:bg-accent",
  !isRead && "border-primary bg-primary/5"
)}>
  <div className="flex gap-3">
    <NotificationIcon type={notification.type} />
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            !isRead && "font-semibold"
          )}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.timestamp)}
          </p>
        </div>
        {!isRead && (
          <Badge variant="secondary" className="shrink-0">
            New
          </Badge>
        )}
      </div>
      {notification.actions && (
        <div className="flex gap-2 mt-3">
          {notification.actions.map(action => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant || "outline"}
              onClick={(e) => {
                e.stopPropagation()
                handleAction(action)
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  </div>
</Card>
```

### 4. NotificationSettings Component

```typescript
// components/settings/NotificationSettings.tsx
interface NotificationSetting {
  id: string
  label: string
  description: string
  channels: {
    push: boolean
    inApp: boolean
    email: 'instant' | 'daily' | 'weekly' | 'off'
  }
}

const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      {notificationTypes.map(category => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.settings.map(setting => (
              <NotificationSettingRow
                key={setting.id}
                setting={setting}
                onChange={handleChange}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <QuietHoursCard />

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
```

## State Management

### Notification Store (Zustand)

```typescript
interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  bannerQueue: Notification[]
  settings: NotificationSettings

  // Actions
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissBanner: (id: string) => void
  updateSettings: (settings: Partial<NotificationSettings>) => void
}

// Real-time updates via WebSocket/SSE
useEffect(() => {
  const eventSource = new EventSource('/api/notifications/stream')

  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data)

    // Add to store
    notificationStore.addNotification(notification)

    // Show banner if high priority
    if (notification.priority === 'high') {
      notificationStore.addToBannerQueue(notification)
    }

    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound()
    }
  }

  return () => eventSource.close()
}, [])
```

## Accessibility

### WCAG 2.1 AA Requirements

**Screen Reader Announcements:**
```typescript
// Use aria-live regions for new notifications
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {newNotification && `New notification: ${newNotification.title}`}
</div>

// Alert role for urgent notifications
<div role="alert" aria-live="assertive">
  {urgentNotification.message}
</div>
```

**Keyboard Navigation:**
- Tab: Navigate through notification cards
- Enter/Space: Expand notification details
- Escape: Close notification center
- Arrow keys: Navigate within notification list
- Shift+N: Open notification center (global shortcut)

**Focus Management:**
```typescript
// Trap focus in notification center when open
useFocusTrap(isOpen)

// Return focus to trigger after closing
useEffect(() => {
  if (!isOpen && triggerRef.current) {
    triggerRef.current.focus()
  }
}, [isOpen])
```

**Color Contrast:**
- Unread indicators: 4.5:1 minimum
- Action buttons: 3:1 minimum
- Use semantic colors with sufficient contrast
- Don't rely on color alone (add icons/badges)

## Responsive Design Strategy

### Breakpoints
```typescript
// Mobile: < 640px
// Tablet: 640px - 1024px
// Desktop: > 1024px

const NotificationDisplay = () => {
  const device = useBreakpoint()

  switch(device) {
    case 'mobile':
      return <MobileNotificationDrawer />
    case 'tablet':
      return <TabletNotificationSheet />
    case 'desktop':
      return <DesktopNotificationPanel />
  }
}
```

### Mobile Adaptations
- Full-screen drawer instead of sheet
- Swipe gestures for dismiss/actions
- Larger touch targets (min 44x44px)
- Simplified actions (max 2 per notification)
- Bottom sheet pattern for better reachability

### Desktop Enhancements
- Hover states for additional actions
- Keyboard shortcuts
- Multi-select for bulk actions
- Richer previews with more content
- Side-by-side notification + detail view

## Interaction States

### Banner States
```
1. Entering (animate-in slide-in-from-top)
2. Idle (visible, awaiting action)
3. Auto-minimize (after 5 seconds for medium priority)
4. Hovering (show additional actions)
5. Exiting (animate-out slide-out-to-top)
```

### Notification Card States
```
1. Unread (bold text, colored border, "New" badge)
2. Read (normal text, no border)
3. Hover (background change, show actions)
4. Active (being interacted with)
5. Processing (action buttons disabled, loading spinner)
6. Success (green checkmark, then fade out)
7. Error (red border, error message)
```

### Loading States
```typescript
// Skeleton for initial load
<div className="space-y-2">
  {[...Array(5)].map((_, i) => (
    <Card key={i} className="p-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </Card>
  ))}
</div>

// Inline loading for actions
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Confirm
</Button>
```

## Performance Optimizations

### Virtual Scrolling
```typescript
// For long notification lists
import { VirtualList } from '@tanstack/react-virtual'

<VirtualList
  height={600}
  itemCount={notifications.length}
  itemSize={80}
  overscan={5}
  renderItem={({ index, style }) => (
    <NotificationCard
      key={notifications[index].id}
      notification={notifications[index]}
      style={style}
    />
  )}
/>
```

### Lazy Loading
```typescript
// Load older notifications on demand
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['notifications'],
  queryFn: ({ pageParam = 0 }) =>
    fetchNotifications({ offset: pageParam, limit: 20 }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.hasMore ? pages.length * 20 : undefined,
})
```

### Optimistic Updates
```typescript
// Immediately update UI before server confirms
const markAsRead = useMutation({
  mutationFn: (id: string) => api.markAsRead(id),
  onMutate: async (id) => {
    // Optimistically update
    queryClient.setQueryData(['notifications'], old =>
      old.map(n => n.id === id ? { ...n, read: true } : n)
    )
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['notifications'], context.previousData)
  },
})
```

## Implementation Recommendations

### 1. Notification Display Strategy

**Recommendation: Hybrid Approach**
- **Toasts**: For success/error feedback (non-actionable)
- **Persistent Banners**: For action-required notifications (bookings)
- **Notification Center**: For history and management

**Rationale:**
- Toasts don't interrupt workflow for simple confirmations
- Banners ensure critical actions aren't missed
- Center provides comprehensive management without clutter

### 2. Banner Queue Management

```typescript
// Maximum 2 banners visible simultaneously
const MAX_VISIBLE_BANNERS = 2

// Priority queue for banner display
const bannerQueue = new PriorityQueue({
  comparator: (a, b) => {
    // High priority first
    if (a.priority !== b.priority) {
      return PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
    }
    // Then by timestamp (newer first)
    return b.timestamp - a.timestamp
  }
})

// Auto-dismiss times
const AUTO_DISMISS_TIMES = {
  high: null, // Never auto-dismiss
  medium: 5000, // 5 seconds
  low: 3000, // 3 seconds
}
```

### 3. Notification Persistence

**Local Storage Strategy:**
```typescript
// Store last 100 notifications locally
const NOTIFICATION_CACHE_KEY = 'massava_notifications'
const MAX_CACHED_NOTIFICATIONS = 100

// Sync with server on app launch
const syncNotifications = async () => {
  const cached = localStorage.getItem(NOTIFICATION_CACHE_KEY)
  const lastSync = localStorage.getItem('last_notification_sync')

  const serverNotifications = await fetchNotificationsSince(lastSync)
  const merged = mergeNotifications(cached, serverNotifications)

  localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(merged))
  localStorage.setItem('last_notification_sync', Date.now())
}
```

### 4. Progressive Disclosure

```typescript
// Notification summary → Full details
interface NotificationSummary {
  id: string
  icon: ReactNode
  title: string
  preview: string // First 50 chars
  timestamp: Date
  unread: boolean
}

interface NotificationDetail extends NotificationSummary {
  fullDescription: string
  metadata: Record<string, any>
  actions: Action[]
  relatedItems: RelatedItem[]
}

// Click notification → Expand in place or navigate
const handleNotificationClick = (notification: Notification) => {
  if (notification.hasDetails) {
    setExpandedId(notification.id)
  } else if (notification.deepLink) {
    router.push(notification.deepLink)
  }
}
```

### 5. Mobile vs Desktop Differences

**Mobile Specific:**
- Bottom sheet for notifications (better thumb reach)
- Swipe to dismiss/mark as read
- Grouped notifications by day
- Simplified action buttons (max 2)
- Haptic feedback for new notifications

**Desktop Specific:**
- Right-side panel (doesn't cover content)
- Hover to preview full content
- Bulk selection with checkboxes
- Keyboard shortcuts for power users
- Desktop notifications API integration

## Security Considerations

### Authorization
```typescript
// Verify user can receive notification
const canReceiveNotification = (userId: string, notification: Notification) => {
  // Check if notification belongs to user
  if (notification.recipientId !== userId) return false

  // Check if user has permission for notification type
  if (!hasPermission(userId, notification.type)) return false

  return true
}
```

### Rate Limiting
```typescript
// Prevent notification spam
const RATE_LIMITS = {
  'booking-request': { max: 10, window: '1h' },
  'message': { max: 50, window: '1h' },
  'promotional': { max: 5, window: '24h' },
}
```

### Data Sanitization
```typescript
// Sanitize notification content
const sanitizeNotification = (notification: RawNotification): Notification => ({
  ...notification,
  title: DOMPurify.sanitize(notification.title),
  description: DOMPurify.sanitize(notification.description),
  // Never expose sensitive data in notifications
  metadata: omit(notification.metadata, ['password', 'token', 'secret'])
})
```

## Metrics & Analytics

### Track Engagement
```typescript
interface NotificationMetrics {
  delivered: number
  opened: number
  actionTaken: number
  dismissed: number
  averageTimeToAction: number
}

// Track user interactions
trackEvent('notification_action', {
  notificationId,
  notificationType,
  action: 'confirm' | 'dismiss' | 'view',
  timeToAction: Date.now() - notification.timestamp,
  device: 'mobile' | 'desktop',
})
```

### Monitor Performance
```typescript
// Measure notification delivery time
performance.mark('notification_received')
performance.mark('notification_displayed')
performance.measure('notification_latency',
  'notification_received',
  'notification_displayed'
)

// Alert if notifications are slow
if (latency > 1000) {
  logError('Notification display latency exceeds threshold', { latency })
}
```

## Migration Path

### Phase 1: Foundation (Week 1-2)
1. Implement notification store (Zustand)
2. Create base components (Banner, Card, Center)
3. Set up WebSocket/SSE connection
4. Basic notification display (no actions)

### Phase 2: Interactivity (Week 3-4)
1. Add action buttons to notifications
2. Implement notification settings page
3. Add mark as read functionality
4. Integrate with existing booking flow

### Phase 3: Polish (Week 5-6)
1. Add animations and transitions
2. Implement virtual scrolling
3. Add keyboard navigation
4. Optimize performance

### Phase 4: Mobile (Week 7-8)
1. PWA setup with service worker
2. Push notification integration
3. Mobile-specific gestures
4. App store deployment prep

## Testing Strategy

### Unit Tests
```typescript
describe('NotificationBanner', () => {
  it('should display high priority notifications immediately', () => {})
  it('should auto-dismiss medium priority after 5 seconds', () => {})
  it('should queue multiple notifications', () => {})
  it('should handle action buttons correctly', () => {})
})
```

### Integration Tests
```typescript
describe('Notification Flow', () => {
  it('should show banner when booking request received', () => {})
  it('should update notification center on mark as read', () => {})
  it('should persist settings across sessions', () => {})
})
```

### E2E Tests
```typescript
test('Studio owner booking notification flow', async ({ page }) => {
  // Customer creates booking
  await customerCreateBooking(page)

  // Studio owner receives notification
  await page.waitForSelector('[role="alert"]')

  // Studio owner confirms from banner
  await page.click('button:text("Confirm")')

  // Customer receives confirmation
  await expectCustomerNotification(page)
})
```

---

## Summary

This notification system design provides a comprehensive solution that:

1. **Balances interruption with visibility** through a three-tier system
2. **Gives users control** with granular settings
3. **Supports both user roles** with role-specific notifications
4. **Works across devices** with responsive, mobile-first design
5. **Maintains accessibility** with WCAG 2.1 AA compliance
6. **Enables quick actions** directly from notifications
7. **Scales well** with virtual scrolling and lazy loading
8. **Provides clear migration path** with phased implementation

The design leverages existing shadcn/ui components while introducing minimal custom code, ensuring consistency with the existing Massava design system.