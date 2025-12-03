# Notification System - Orchestrator Prompt

**Copy this entire file into a new Development Team session to start implementation.**

---

## Instructions for Orchestrator

You are the orchestrator for implementing a comprehensive notification system for Massava. Your job is to coordinate multiple subagents to implement this feature completely.

### Your Responsibilities

1. **Read all plan files** in `docs/notifications/` (01 through 08)
2. **Execute phases sequentially** but delegate tasks to parallel subagents where possible
3. **Verify each phase** before moving to the next
4. **Handle failures** by spawning a new subagent to fix issues (no quick fixes - sustainable solutions only)
5. **Run continuously** without waiting for user approval between phases

### Subagent Strategy

Use the Task tool with appropriate `subagent_type` and `model`:

| Task Type | Model | Subagent Type | When to Use |
|-----------|-------|---------------|-------------|
| Database/Schema | sonnet | general-purpose | Prisma migrations, schema changes |
| Backend Services | sonnet | feature-builder | API routes, services, queue workers |
| Frontend Components | sonnet | feature-builder | React components, stores, hooks |
| Mobile/Capacitor | sonnet | general-purpose | Capacitor setup, native config |
| Unit Tests | sonnet | test-generator | Writing test files |
| Code Review | opus | code-reviewer-typescript | After each phase completion |
| Complex Debugging | opus | general-purpose | When subagent fails twice |

### Parallel Execution Rules

**CAN run in parallel:**
- Database migration + Environment setup
- Backend services + Frontend components (after DB is done)
- Unit tests for different modules
- iOS config + Android config

**MUST run sequentially:**
- Database schema → Backend services (services need schema)
- Backend services → Frontend (frontend needs API)
- All code → Tests for that code
- Each phase → Code review → Next phase

### Design Guidelines

**CRITICAL:** All frontend components MUST match Massava's existing design:
- Use existing shadcn/ui components from the codebase
- Match color scheme, spacing, typography from existing pages
- Before creating new components, analyze existing ones in `components/ui/`
- Follow patterns from `app/[locale]/` pages

To understand the design, read these files first:
- `tailwind.config.ts` - Color palette, theme
- `app/globals.css` - Global styles
- `components/ui/button.tsx` - Button variants
- `components/ui/card.tsx` - Card styling
- Any existing page for layout patterns

### Phase Execution Order

```
Phase 1: Foundation
├── 1.1 Database Schema (read 02-database-schema.md)
├── 1.2 Environment Variables (read 08-environment-setup.md)
└── 1.3 Code Review

Phase 2: Backend Services
├── 2.1 Notification Service Layer (read 03-backend-services.md)
├── 2.2 QStash Queue Integration
├── 2.3 SSE Endpoint
└── 2.4 Code Review

Phase 3: Push Notifications
├── 3.1 Firebase Admin Setup (read 04-push-notifications.md)
├── 3.2 FCM Integration
├── 3.3 Device Token Management
└── 3.4 Code Review

Phase 4: Frontend
├── 4.1 Zustand Store (read 05-frontend-components.md)
├── 4.2 Notification Components
├── 4.3 Settings Page
├── 4.4 SSE Client Hook
└── 4.5 Code Review

Phase 5: Mobile
├── 5.1 Capacitor Setup (read 06-mobile-capacitor.md)
├── 5.2 iOS Configuration
├── 5.3 Android Configuration
├── 5.4 Native Plugins
└── 5.5 Code Review

Phase 6: Testing
├── 6.1 Unit Tests (read 07-testing-strategy.md)
├── 6.2 Integration Tests
├── 6.3 E2E Tests
└── 6.4 Final Code Review

Phase 7: Final Verification
├── 7.1 Build verification (npm run build)
├── 7.2 Type checking (npx tsc --noEmit)
├── 7.3 Lint (npm run lint)
├── 7.4 All tests pass
└── 7.5 Simulator testing instructions
```

### Error Handling

If a subagent fails:
1. Analyze the error
2. Spawn a NEW subagent to fix (not quick patch)
3. Solution must be sustainable and state-of-the-art
4. If same error occurs 3 times, escalate to opus model
5. Document the fix for future reference

### Verification Commands

After each phase, run:
```bash
npm run build          # Must pass
npx tsc --noEmit       # No type errors
npm run lint           # No lint errors
npm test               # All tests pass
```

### Start Command

Begin by reading the plan files in order:
```
1. Read docs/notifications/01-architecture-overview.md
2. Read docs/notifications/02-database-schema.md
3. Continue with each file...
```

Then start Phase 1.

---

## Quick Reference

### Tech Stack
- **Queue:** Upstash QStash (serverless)
- **Real-time:** Server-Sent Events (SSE)
- **Push:** Firebase Cloud Messaging (FCM)
- **State:** Zustand
- **Mobile:** Capacitor.js
- **Database:** PostgreSQL + Prisma

### Key Files to Create
- `prisma/schema.prisma` - Add notification models
- `lib/notifications/` - Service layer
- `lib/queue/` - QStash integration
- `app/api/notifications/` - API routes
- `components/notifications/` - UI components
- `stores/notification-store.ts` - Zustand store
- `capacitor.config.ts` - Mobile config

### Environment Variables Needed
See `08-environment-setup.md` for complete list.

---

**START IMPLEMENTATION NOW**
