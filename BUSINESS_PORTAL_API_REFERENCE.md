# Business Portal API Reference

Quick reference guide for all Business Portal endpoints and Server Actions.

---

## Server Actions

### Profile Management

**File**: `/app/[locale]/business/actions/profile.ts`

#### `updateStudioProfile()`

Update studio profile information.

```typescript
import { updateStudioProfile } from '@/app/[locale]/business/actions/profile';

const result = await updateStudioProfile({
  name: 'My Studio',
  description: 'A great massage studio',
  phone: '+49123456789',
  email: 'info@mystudio.com',
  address: 'Main Street 123',
  city: 'Berlin',
  postalCode: '10115',
  latitude: 52.5200,
  longitude: 13.4050,
});

// Result type
type ProfileActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string; name: string };
};
```

#### `updateOpeningHours()`

Update studio opening hours.

```typescript
import { updateOpeningHours } from '@/app/[locale]/business/actions/profile';

const result = await updateOpeningHours({
  openingHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: null, // Closed
    sunday: null,   // Closed
  },
});
```

---

### Service Management

**File**: `/app/[locale]/business/actions/services.ts`

#### `createService()`

Create a new service.

```typescript
import { createService } from '@/app/[locale]/business/actions/services';

const result = await createService({
  name: 'Swedish Massage',
  description: 'Relaxing full-body massage',
  price: 79.99,
  duration: 60, // minutes
  category: 'Massage',
});

// Result type
type ServiceActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string; name: string };
};
```

#### `updateService()`

Update an existing service.

```typescript
import { updateService } from '@/app/[locale]/business/actions/services';

const result = await updateService({
  id: 'service-id-123',
  name: 'Swedish Massage (Updated)',
  description: 'Relaxing full-body massage with aromatherapy',
  price: 89.99,
  duration: 90,
  category: 'Massage',
});
```

#### `deleteService()`

Delete a service.

```typescript
import { deleteService } from '@/app/[locale]/business/actions/services';

const result = await deleteService('service-id-123');
```

---

## REST API Endpoints

### Services API

**Base URL**: `/api/business/services`

#### GET /api/business/services

Get all services for authenticated user's studio.

```typescript
// Request
const response = await fetch('/api/business/services', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Response
{
  services: [
    {
      id: 'service-1',
      name: 'Swedish Massage',
      description: 'Relaxing full-body massage',
      price: 79.99,
      duration: 60,
      category: 'Massage',
      studioId: 'studio-123',
      createdAt: '2025-11-04T10:00:00.000Z',
      updatedAt: '2025-11-04T10:00:00.000Z',
    },
    // ... more services
  ]
}
```

#### POST /api/business/services

Create a new service.

```typescript
// Request
const response = await fetch('/api/business/services', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Swedish Massage',
    description: 'Relaxing full-body massage',
    price: 79.99,
    duration: 60,
    category: 'Massage',
  }),
});

const data = await response.json();

// Response (201 Created)
{
  service: {
    id: 'service-new',
    name: 'Swedish Massage',
    description: 'Relaxing full-body massage',
    price: 79.99,
    duration: 60,
    category: 'Massage',
    studioId: 'studio-123',
    createdAt: '2025-11-04T10:00:00.000Z',
    updatedAt: '2025-11-04T10:00:00.000Z',
  }
}
```

#### PUT /api/business/services

Update an existing service.

```typescript
// Request
const response = await fetch('/api/business/services', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'service-123',
    name: 'Swedish Massage (Updated)',
    description: 'Relaxing full-body massage with aromatherapy',
    price: 89.99,
    duration: 90,
    category: 'Massage',
  }),
});

const data = await response.json();

// Response (200 OK)
{
  service: {
    id: 'service-123',
    name: 'Swedish Massage (Updated)',
    // ... updated fields
  }
}
```

#### DELETE /api/business/services?id={serviceId}

Delete a service.

```typescript
// Request
const response = await fetch('/api/business/services?id=service-123', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Response (200 OK)
{
  success: true,
  message: 'Service deleted'
}
```

---

### Opening Hours API

**Base URL**: `/api/business/opening-hours`

#### GET /api/business/opening-hours

Get opening hours for authenticated user's studio.

```typescript
// Request
const response = await fetch('/api/business/opening-hours', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Response
{
  openingHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: null,
    sunday: null,
  }
}
```

#### PUT /api/business/opening-hours

Update opening hours.

```typescript
// Request
const response = await fetch('/api/business/opening-hours', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: null, // Closed
    sunday: null,   // Closed
  }),
});

const data = await response.json();

// Response (200 OK)
{
  openingHours: {
    monday: { open: '09:00', close: '18:00' },
    // ... updated hours
  }
}
```

---

## Error Responses

### Validation Error (400)

```json
{
  "error": "Invalid data",
  "details": {
    "fieldErrors": {
      "name": ["String must contain at least 3 character(s)"],
      "price": ["Number must be greater than 0"]
    }
  }
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

### Not Found (404)

```json
{
  "error": "No studio found"
}
```

```json
{
  "error": "Service not found"
}
```

### Internal Server Error (500)

```json
{
  "error": "Internal server error"
}
```

---

## Authentication

All endpoints and Server Actions require authentication:

- Session must be active
- User must be logged in
- User must own a studio

**No API keys required** - session-based authentication via cookies.

---

## Rate Limiting

Currently **not implemented**. Consider adding rate limiting for production:

- 100 requests per minute per user
- Burst protection
- IP-based fallback

---

## CORS

API endpoints **do not** have CORS enabled by default.

To enable CORS for specific origins:

```typescript
// Add to route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: '...' });

  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
```

---

## Usage Examples

### React Hook for Services

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/business/services')
      .then(res => res.json())
      .then(data => {
        setServices(data.services);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { services, loading, error };
}
```

### Server Action with Toast

```typescript
'use client';

import { createService } from '@/app/[locale]/business/actions/services';
import { useToast } from '@/components/ui/use-toast';

export function MyComponent() {
  const { toast } = useToast();

  async function handleCreate(data) {
    const result = await createService(data);

    if (result.success) {
      toast({
        title: 'Service created',
        description: `${result.data.name} has been created successfully.`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCreate({ /* ... */ });
    }}>
      {/* form fields */}
    </form>
  );
}
```

---

## Best Practices

1. **Use Server Actions for Mutations**: Prefer Server Actions over API routes for form submissions (CSRF protection built-in)

2. **Use API Routes for External Integration**: Use API routes when integrating with webhooks or external services

3. **Error Handling**: Always handle both success and error cases

4. **Loading States**: Show loading indicators during async operations

5. **Optimistic Updates**: Consider optimistic UI updates for better UX (not yet implemented)

6. **Revalidation**: Server Actions automatically revalidate paths - API routes do not

7. **Type Safety**: Import types from Server Actions for type-safe calls

---

**Last Updated**: 2025-11-04
**Maintained By**: Development Team
