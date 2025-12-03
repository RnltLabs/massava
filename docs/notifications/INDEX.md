# Notification API Documentation - Index

Complete navigation guide for the Massava Notification API documentation.

## Quick Navigation

### For First-Time Users
1. Start here: **[README.md](./README.md)** - Overview and quick start guide
2. Explore API: **[openapi.yaml](./openapi.yaml)** - View in Swagger Editor
3. Learn basics: **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Common operations

### For Developers
1. **Integration**: **[SWAGGER_INTEGRATION.md](./SWAGGER_INTEGRATION.md)** - Setup options
2. **Examples**: **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Code samples
3. **Reference**: **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - All endpoints

### For DevOps / Architects
1. **Architecture**: **[01-architecture-overview.md](./01-architecture-overview.md)** - System design
2. **Database**: **[02-database-schema.md](./02-database-schema.md)** - Data models
3. **Services**: **[03-backend-services.md](./03-backend-services.md)** - Implementation details

---

## Documentation Files

### Core API Documentation

#### [`openapi.yaml`](./openapi.yaml) (46 KB)
**Complete OpenAPI 3.0.3 specification**

- 1595 lines of comprehensive API documentation
- All 11 endpoints documented in detail
- Complete request/response schemas
- Error response examples
- Security definitions
- Rate limit information
- Example values for all fields

**Best for**: Reference, client generation, validation

**View with**:
- [Swagger Editor Online](https://editor.swagger.io/) - Instant interactive view
- [ReDoc Online](https://redocly.github.io/) - Beautiful documentation
- Local Swagger UI - See SWAGGER_INTEGRATION.md

---

#### [`README.md`](./README.md) (17 KB)
**Complete API overview and getting started guide**

- API overview and features
- All 11 endpoints at a glance
- Quick start examples
- Notification types reference
- Status codes and error handling
- Rate limits and authentication
- Database schema overview
- Best practices checklist

**Best for**: Getting started, learning the system

---

#### [`API_QUICK_REFERENCE.md`](./API_QUICK_REFERENCE.md) (13 KB)
**Quick reference guide for all operations**

- Base URLs and authentication
- Rate limit table
- All endpoints with curl examples
- Request/response examples
- Status codes reference
- Notification types
- Common error responses
- Pagination guide
- Best practices

**Best for**: Copy-paste examples, quick lookups

---

### Implementation Guides

#### [`API_EXAMPLES.md`](./API_EXAMPLES.md) (37 KB)
**Real-world code examples in multiple languages**

- React hooks (`useNotifications`, `useDeviceRegistration`, `useNotificationPreferences`)
- React components (NotificationCenter, NotificationSettings)
- Vue 3 composition API examples
- Firebase Cloud Messaging integration
- Server-side notification services
- Bulk notification sender
- Real-time streaming (Vue, React)
- Device management
- Preference management
- Error handling utilities
- Jest tests
- Postman examples

**Best for**: Implementation, copy-paste code

**Includes**:
- 8 React implementations
- 2 Vue implementations
- 3 server-side services
- Complete testing examples

---

#### [`SWAGGER_INTEGRATION.md`](./SWAGGER_INTEGRATION.md) (12 KB)
**Setup guides for documentation tools**

**Swagger UI Options**:
- Online at swagger.io (instant, no setup)
- Docker Compose setup
- Node.js with swagger-ui-express
- Next.js integration
- Static HTML generation

**Alternative Tools**:
- ReDoc for beautiful docs
- Postman for API testing
- VS Code REST Client
- httpie for CLI testing
- cURL integration

**CI/CD Integration**:
- GitHub Actions validation
- Pre-commit hooks
- OpenAPI diff checking

**Code Generation**:
- TypeScript client generation
- Python client generation
- SDK generation

**Best for**: Setting up documentation, CI/CD integration

---

### Architecture & Design

#### [`01-architecture-overview.md`](./01-architecture-overview.md) (13 KB)
**System architecture and design decisions**

- Event-driven architecture
- Components overview
- Data flow diagrams
- Service boundaries
- Message queue integration
- Caching strategy
- Scaling considerations

**Best for**: System design, understanding architecture

---

#### [`02-database-schema.md`](./02-database-schema.md) (13 KB)
**Database schema and data models**

- Notification model
- DeviceToken model
- NotificationPreference model
- Relationships and indexes
- Query optimization notes

**Best for**: Database design, schema understanding

---

#### [`03-backend-services.md`](./03-backend-services.md) (24 KB)
**Backend service implementation**

- Notification service
- Device token manager
- Email sender
- Push notification sender
- Preference manager
- API route handlers

**Best for**: Backend implementation, service details

---

### Support Documentation

#### [`TYPE_SAFETY_EXAMPLES.md`](./TYPE_SAFETY_EXAMPLES.md) (11 KB)
**TypeScript type safety patterns**

- Zod schema validation
- Discriminated unions
- Type guards
- Error handling patterns

**Best for**: TypeScript implementation

---

#### [`04-push-notifications.md`](./04-push-notifications.md) (21 KB)
**Push notification implementation details**

- FCM setup for Android
- APNs setup for iOS
- Web Push setup
- Token management
- Error handling

**Best for**: Push notification implementation

---

#### [`RATE_LIMITING_IMPLEMENTATION.md`](./RATE_LIMITING_IMPLEMENTATION.md) (8 KB)
**API rate limiting implementation**

- Rate limit configuration
- Per-endpoint limits
- Enforcement strategies
- Error responses

**Best for**: Understanding rate limiting

---

#### [`errors.md`](./errors.md) (12 KB)
**Error handling and error codes**

- Error categories
- HTTP status codes
- Error response format
- Common errors and solutions

**Best for**: Error handling implementation

---

## Endpoint Summary

### Notification Management (7 endpoints)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications` | List user notifications |
| POST | `/api/notifications` | Create notification (Admin) |
| GET | `/api/notifications/{id}` | Get single notification |
| DELETE | `/api/notifications/{id}` | Delete notification |
| POST | `/api/notifications/read` | Mark as read |
| GET | `/api/notifications/unread-count` | Get unread count |
| GET | `/api/notifications/stream` | Real-time SSE stream |

### Device Management (3 endpoints)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications/devices` | List devices |
| POST | `/api/notifications/devices` | Register device |
| DELETE | `/api/notifications/devices/{id}` | Unregister device |

### Preferences (1 endpoint)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications/preferences` | Get preferences |
| PATCH | `/api/notifications/preferences` | Update preferences |

---

## Key Concepts

### Notification Status
```
PENDING → QUEUED → SENDING → DELIVERED (or FAILED)
                           ↓
                         EXPIRED
                           ↓
                        ARCHIVED
```

### Delivery Channels
- **PUSH**: Push notification (iOS/Android/Web)
- **EMAIL**: Email delivery (instant or digest)
- **IN_APP**: In-app notification center

### Priority Levels
- **URGENT**: Bypass quiet hours, highest priority
- **HIGH**: Respect quiet hours, high priority
- **NORMAL**: Standard delivery
- **LOW**: May be batched or delayed

### Notification Types
- **24+ types** covering: Booking, Payment, Review, Security, System events
- Each type has **default channels and priority**
- Users can **customize preferences** per type

---

## Getting Started Steps

### Step 1: Understand the API
1. Read [README.md](./README.md) (5 min)
2. Browse [openapi.yaml](./openapi.yaml) in Swagger Editor (10 min)
3. Review [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) (5 min)

### Step 2: Explore Examples
1. Review relevant examples in [API_EXAMPLES.md](./API_EXAMPLES.md)
   - Frontend: React hooks and components
   - Backend: Service implementations
   - Real-time: SSE streaming setup
2. Try curl examples from [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)

### Step 3: Set Up Documentation Tools
1. View in Swagger Editor: https://editor.swagger.io/
2. Set up local Swagger UI: See [SWAGGER_INTEGRATION.md](./SWAGGER_INTEGRATION.md)
3. Generate clients if needed: See [SWAGGER_INTEGRATION.md](./SWAGGER_INTEGRATION.md)

### Step 4: Implement
1. Copy examples from [API_EXAMPLES.md](./API_EXAMPLES.md)
2. Adjust for your stack (React, Vue, TypeScript, Python, etc.)
3. Use type definitions from [openapi.yaml](./openapi.yaml)
4. Test with curl or Postman

---

## Common Tasks

### Register a Device for Push Notifications
1. See: [API_EXAMPLES.md - Device Registration Hook](./API_EXAMPLES.md#device-registration-hook-react)
2. Use: `POST /api/notifications/devices`
3. Requires: Valid device token from FCM/APNs/Web Push

### Listen for Real-time Notifications
1. See: [API_EXAMPLES.md - Real-time Streaming](./API_EXAMPLES.md#real-time-streaming)
2. Use: `GET /api/notifications/stream` (SSE)
3. Framework: React, Vue, vanilla JavaScript

### Create a Notification (Admin)
1. See: [API_EXAMPLES.md - Create Notification Service](./API_EXAMPLES.md#create-notification-service)
2. Use: `POST /api/notifications`
3. Requires: Admin privileges (SUPER_ADMIN or STUDIO_OWNER)

### Manage User Preferences
1. See: [API_EXAMPLES.md - Preference Hook](./API_EXAMPLES.md#preference-hook-react)
2. Use: `GET/PATCH /api/notifications/preferences`
3. Control: Channels, quiet hours, email digest, per-type settings

### List Notifications with Pagination
1. See: [API_QUICK_REFERENCE.md - List Notifications](./API_QUICK_REFERENCE.md#list-notifications)
2. Use: `GET /api/notifications?limit=20&cursor=...`
3. Supports: Status and type filters

### Handle Errors
1. See: [API_EXAMPLES.md - Error Handling](./API_EXAMPLES.md#error-handling)
2. Common errors: 401 (auth), 422 (invalid token), 429 (rate limit)

---

## File Locations

All documentation files are in: `/Users/roman/Development/massava/docs/notifications/`

```
docs/notifications/
├── INDEX.md                              (this file)
├── README.md                             (overview)
├── openapi.yaml                          (API spec)
├── API_QUICK_REFERENCE.md                (quick guide)
├── API_EXAMPLES.md                       (code samples)
├── SWAGGER_INTEGRATION.md                (setup guides)
├── TYPE_SAFETY_EXAMPLES.md               (TypeScript)
├── 01-architecture-overview.md           (architecture)
├── 02-database-schema.md                 (database)
├── 03-backend-services.md                (services)
├── 04-push-notifications.md              (push setup)
├── 05-frontend-components.md             (UI components)
├── 06-mobile-capacitor.md                (mobile)
├── 07-testing-strategy.md                (testing)
├── 08-environment-setup.md               (environment)
├── RATE_LIMITING_IMPLEMENTATION.md       (rate limiting)
├── RATE_LIMITING_FILES.md                (rate limit files)
├── token-validation.md                   (token validation)
├── token-validation-summary.md           (validation summary)
├── token-validation-quick-reference.md   (validation reference)
├── errors.md                             (error handling)
├── api-error-example.ts                  (error examples)
├── api-rate-limiting.md                  (rate limiting guide)
└── 00-orchestrator-prompt.md             (orchestrator instructions)
```

---

## External Resources

### Documentation Tools
- **Swagger Editor**: https://editor.swagger.io/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **ReDoc**: https://redoc.ly/
- **OpenAPI Generator**: https://openapi-generator.tech/

### Specifications
- **OpenAPI 3.0.3**: https://spec.openapis.org/oas/v3.0.3
- **JSON Schema**: https://json-schema.org/
- **Zod Validation**: https://zod.dev/

### Technologies
- **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging
- **Apple Push Notification service**: https://developer.apple.com/notifications/
- **Web Push API**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

### Tools
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **Thunder Client**: https://www.thunderclient.io/

---

## Support

### Having Issues?

1. **API not working?**
   - Check authentication token: [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md#authentication)
   - Review error response: [errors.md](./errors.md)
   - Check rate limits: [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md#rate-limits)

2. **Implementation questions?**
   - See code examples: [API_EXAMPLES.md](./API_EXAMPLES.md)
   - Check architecture: [01-architecture-overview.md](./01-architecture-overview.md)
   - Review services: [03-backend-services.md](./03-backend-services.md)

3. **Setup help?**
   - View integration guides: [SWAGGER_INTEGRATION.md](./SWAGGER_INTEGRATION.md)
   - Check environment: [08-environment-setup.md](./08-environment-setup.md)

4. **Still stuck?**
   - Open GitHub issue: https://github.com/roman/massava/issues
   - Contact: dev@massava.com

---

## Version Information

| Component | Version | Updated |
|-----------|---------|---------|
| OpenAPI Spec | 3.0.3 | 2025-01-15 |
| API Version | 1.0.0 | 2025-01-15 |
| Documentation | 1.0.0 | 2025-01-15 |
| Database | v1 | 2025-01-15 |

---

## Document Statistics

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| openapi.yaml | 46 KB | 1595 | Full API specification |
| API_EXAMPLES.md | 37 KB | ~1500 | Code examples |
| README.md | 17 KB | ~600 | Overview |
| API_QUICK_REFERENCE.md | 13 KB | ~500 | Quick reference |
| SWAGGER_INTEGRATION.md | 12 KB | ~400 | Integration guides |
| 03-backend-services.md | 24 KB | ~900 | Service implementation |
| 01-architecture-overview.md | 13 KB | ~450 | Architecture |
| 02-database-schema.md | 13 KB | ~450 | Database schema |
| **Total** | **175 KB** | **~6400** | **Complete documentation** |

---

## Navigation Tips

- Use **Ctrl/Cmd + F** to search within documents
- Click on any file link to jump directly to it
- Use **breadcrumbs** in each document to navigate back
- Check **Table of Contents** at the top of each document
- Refer to this index when you're unsure where to look

---

**Last Updated**: 2025-01-15
**Maintained By**: Massava Development Team
**Repository**: https://github.com/roman/massava
