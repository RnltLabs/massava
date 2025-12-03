# Notification Preferences API - Usage Examples

## Endpoint

```
GET    /api/notifications/preferences
PATCH  /api/notifications/preferences
```

## Authentication

All requests require authentication. Include the session cookie or JWT token.

## GET - Retrieve Current Preferences

### Request

```bash
curl -X GET 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'
```

### Response (200 OK)

```json
{
  "push": {
    "enabled": true,
    "bookings": true,
    "cancellations": true,
    "reminders": true,
    "marketing": false
  },
  "email": {
    "enabled": true,
    "bookings": true,
    "cancellations": true,
    "reminders": true,
    "marketing": false
  },
  "inApp": {
    "enabled": true
  },
  "quietHours": {
    "enabled": false,
    "start": null,
    "end": null,
    "timezone": "Europe/Berlin"
  },
  "digest": {
    "enabled": false,
    "frequency": "DAILY",
    "time": "09:00"
  },
  "language": "de"
}
```

### Response (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

## PATCH - Update Preferences

### Example 1: Disable Push Marketing Notifications

```bash
curl -X PATCH 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pushMarketing": false
  }'
```

### Example 2: Enable Quiet Hours

```bash
curl -X PATCH 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "timezone": "Europe/Berlin"
  }'
```

### Example 3: Disable All Push Notifications

```bash
curl -X PATCH 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pushEnabled": false
  }'
```

### Example 4: Enable Email Digest

```bash
curl -X PATCH 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "emailDigestEnabled": true,
    "digestFrequency": "DAILY",
    "digestTime": "09:00"
  }'
```

### Example 5: Custom Category Mix

```bash
curl -X PATCH 'https://massava.com/api/notifications/preferences' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pushBookings": true,
    "pushCancellations": true,
    "pushReminders": false,
    "pushMarketing": false,
    "emailBookings": false,
    "emailCancellations": true,
    "emailReminders": true,
    "emailMarketing": true
  }'
```

### Response (200 OK)

Returns the updated preferences in the same format as GET:

```json
{
  "push": {
    "enabled": true,
    "bookings": true,
    "cancellations": true,
    "reminders": true,
    "marketing": false
  },
  "email": {
    "enabled": true,
    "bookings": true,
    "cancellations": true,
    "reminders": true,
    "marketing": false
  },
  "inApp": {
    "enabled": true
  },
  "quietHours": {
    "enabled": false,
    "start": null,
    "end": null,
    "timezone": "Europe/Berlin"
  },
  "digest": {
    "enabled": false,
    "frequency": "DAILY",
    "time": "09:00"
  },
  "language": "de"
}
```

### Response (400 Bad Request)

When validation fails:

```json
{
  "error": "Invalid request",
  "details": {
    "fieldErrors": {
      "quietHoursStart": ["Time must be in HH:MM format"]
    },
    "formErrors": []
  }
}
```

### Response (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

## React/Next.js Integration

### Custom Hook

```typescript
// hooks/useNotificationPreferences.ts
import { useState, useEffect } from 'react';

interface NotificationPreferences {
  push: {
    enabled: boolean;
    bookings: boolean;
    cancellations: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  email: {
    enabled: boolean;
    bookings: boolean;
    cancellations: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  inApp: {
    enabled: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string | null;
    end: string | null;
    timezone: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'DAILY' | 'WEEKLY';
    time: string | null;
  };
  language: string;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<Record<string, any>>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }

      const updated = await response.json();
      setPreferences(updated);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    }
  };

  return { preferences, loading, error, updatePreferences };
}
```

### Component Example

```typescript
// components/NotificationSettings.tsx
'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from '@/components/ui/use-toast';

export function NotificationSettings() {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();

  if (loading) return <div>Loading...</div>;
  if (!preferences) return <div>Failed to load preferences</div>;

  const handleToggle = async (key: string, value: boolean) => {
    const result = await updatePreferences({ [key]: value });
    if (result.success) {
      toast({ title: 'Preferences updated' });
    } else {
      toast({
        title: 'Update failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pushEnabled">All Push Notifications</Label>
            <Switch
              id="pushEnabled"
              checked={preferences.push.enabled}
              onCheckedChange={(checked) => handleToggle('pushEnabled', checked)}
            />
          </div>

          {preferences.push.enabled && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushBookings">Bookings</Label>
                <Switch
                  id="pushBookings"
                  checked={preferences.push.bookings}
                  onCheckedChange={(checked) => handleToggle('pushBookings', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pushCancellations">Cancellations</Label>
                <Switch
                  id="pushCancellations"
                  checked={preferences.push.cancellations}
                  onCheckedChange={(checked) => handleToggle('pushCancellations', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pushReminders">Reminders</Label>
                <Switch
                  id="pushReminders"
                  checked={preferences.push.reminders}
                  onCheckedChange={(checked) => handleToggle('pushReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pushMarketing">Marketing</Label>
                <Switch
                  id="pushMarketing"
                  checked={preferences.push.marketing}
                  onCheckedChange={(checked) => handleToggle('pushMarketing', checked)}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailEnabled">All Email Notifications</Label>
            <Switch
              id="emailEnabled"
              checked={preferences.email.enabled}
              onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
            />
          </div>

          {preferences.email.enabled && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="emailBookings">Bookings</Label>
                <Switch
                  id="emailBookings"
                  checked={preferences.email.bookings}
                  onCheckedChange={(checked) => handleToggle('emailBookings', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emailCancellations">Cancellations</Label>
                <Switch
                  id="emailCancellations"
                  checked={preferences.email.cancellations}
                  onCheckedChange={(checked) => handleToggle('emailCancellations', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emailReminders">Reminders</Label>
                <Switch
                  id="emailReminders"
                  checked={preferences.email.reminders}
                  onCheckedChange={(checked) => handleToggle('emailReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emailMarketing">Marketing</Label>
                <Switch
                  id="emailMarketing"
                  checked={preferences.email.marketing}
                  onCheckedChange={(checked) => handleToggle('emailMarketing', checked)}
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
```

## Validation Rules

### Time Format
- Must be in `HH:MM` format (e.g., `09:00`, `22:30`)
- Examples: `"00:00"`, `"12:00"`, `"23:59"`

### Digest Frequency
- Must be either `"DAILY"` or `"WEEKLY"`

### Timezone
- Should be a valid IANA timezone identifier
- Examples: `"Europe/Berlin"`, `"America/New_York"`, `"Asia/Tokyo"`

### Language
- 2-10 character string
- Examples: `"de"`, `"en"`, `"fr"`

### Quiet Hours
- If `quietHoursEnabled` is `true`, both `quietHoursStart` and `quietHoursEnd` must be provided
- Times should be in `HH:MM` format

## Error Handling

### Common Errors

```typescript
// 401 - Not authenticated
{
  "error": "Unauthorized"
}

// 400 - Invalid input
{
  "error": "Invalid request",
  "details": {
    "fieldErrors": {
      "quietHoursStart": ["Time must be in HH:MM format"]
    },
    "formErrors": []
  }
}

// 500 - Server error
{
  "error": "Internal server error"
}
```

### Client-side Error Handling

```typescript
try {
  const response = await fetch('/api/notifications/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    if (response.status === 400) {
      const errorData = await response.json();
      // Show validation errors to user
      console.error('Validation errors:', errorData.details);
      return;
    }

    throw new Error('Failed to update preferences');
  }

  const data = await response.json();
  // Success
} catch (error) {
  console.error('Error updating preferences:', error);
}
```
