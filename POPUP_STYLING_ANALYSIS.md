# Popup Styling Analysis & Fix Specification

**Date**: 2025-11-11
**Issue**: New popups don't match reference popup styling from service creation/studio registration
**Status**: Analysis in progress

---

## 1. Reference Popup Analysis

### Finding Reference Implementations...

Checking:
- `/app/[locale]/business/settings/_components/ServicesPageClient.tsx`
- `/app/[locale]/dashboard/_components/studio-registration/`
- Service management dialog components

### Reference Code Extraction

**GOLD STANDARD POPUP STRUCTURE:**

```typescript
// To be documented after reading reference files
```

---

## 2. New Popups Inventory

### Studio Settings Popups:
1. `app/[locale]/business/settings/studio/_components/BasicInfoPopup.tsx`
2. `app/[locale]/business/settings/studio/_components/LocationPopup.tsx`
3. `app/[locale]/business/settings/studio/_components/OpeningHoursPopup.tsx`
4. `app/[locale]/business/settings/studio/_components/ImagesPopup.tsx`

### Account Settings Popups:
1. `app/[locale]/business/settings/account/_components/NotificationsPopup.tsx`
2. `app/[locale]/business/settings/account/_components/PrivacyPopup.tsx`
3. `app/[locale]/business/settings/account/_components/DangerZonePopup.tsx`

---

## 3. Comparison Table

| Popup | Component Type | Side | Height | Border Radius | Background | Status |
|-------|---------------|------|--------|---------------|------------|---------|
| **REFERENCE** | TBD | TBD | TBD | TBD | TBD | ✅ |
| BasicInfoPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| LocationPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| OpeningHoursPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| ImagesPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| NotificationsPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| PrivacyPopup | TBD | TBD | TBD | TBD | TBD | ❌ |
| DangerZonePopup | TBD | TBD | TBD | TBD | TBD | ❌ |

---

## 4. Fix Specifications

### Per-Popup Fixes

#### BasicInfoPopup.tsx
**Current Code:**
```typescript
// To be documented
```

**Fixed Code:**
```typescript
// To be provided
```

**Changes Needed:**
- [ ] TBD

---

## 5. Implementation Checklist

### Global Changes:
- [ ] Identify reference popup component
- [ ] Extract exact styling properties
- [ ] Document all className strings
- [ ] Document animation behavior

### Per-Popup Updates:
- [ ] BasicInfoPopup: Apply fixes
- [ ] LocationPopup: Apply fixes
- [ ] OpeningHoursPopup: Apply fixes
- [ ] ImagesPopup: Apply fixes
- [ ] NotificationsPopup: Apply fixes
- [ ] PrivacyPopup: Apply fixes
- [ ] DangerZonePopup: Apply fixes

### Testing:
- [ ] Test mobile slide-up animation
- [ ] Test height on mobile (85vh or similar)
- [ ] Test border radius on mobile
- [ ] Test backdrop overlay
- [ ] Test drag-to-dismiss on mobile
- [ ] Test desktop rendering
- [ ] Visual comparison with reference

---

## Analysis Process

### Step 1: Read Reference Files ✓
### Step 2: Extract Styling ⏳
### Step 3: Read New Popups ⏳
### Step 4: Compare & Document Differences ⏳
### Step 5: Create Fix Specifications ⏳

---

*This document will be updated as analysis progresses*
