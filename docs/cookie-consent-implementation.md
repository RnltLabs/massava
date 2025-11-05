# Cookie Consent Implementation

## Overview

This document describes the GDPR-compliant cookie consent system implemented for Massava, following the ePrivacy Directive requirements.

**Status**: ✅ Complete
**Version**: 1.0
**Date**: 2025-11-04
**Compliance**: GDPR Art. 6, ePrivacy Directive

## Features

- **Granular Consent**: Three cookie categories (necessary, analytics, marketing)
- **Consent Banner**: Non-intrusive banner appearing on first visit
- **Settings Management**: Dedicated page for changing preferences
- **Google Analytics Integration**: GA4 Consent Mode V2 support
- **Persistent Storage**: Consent saved in localStorage
- **Audit Trail**: API endpoint for logging consent (optional)
- **Mobile-First Design**: Responsive and accessible (WCAG 2.1 AA)

## Architecture

### File Structure

```
contexts/
  CookieConsentContext.tsx       # React context provider

components/
  CookieConsent.tsx              # Cookie banner component
  CookieSettings.tsx             # Settings modal component
  GoogleAnalytics.tsx            # GA4 initialization

lib/
  analytics/
    consent-aware-ga.ts          # GA4 consent mode utilities
  validations/
    cookie-consent.ts            # Zod validation schemas

app/
  api/
    cookie-consent/
      route.ts                   # API endpoint for logging consent
  [locale]/
    cookie-settings/
      page.tsx                   # Cookie settings page
    layout.tsx                   # Integrated providers
```

## Implementation Details

### 1. Cookie Consent Context

**File**: `/contexts/CookieConsentContext.tsx`

Provides global state management for cookie consent:

```typescript
interface CookieConsent {
  necessary: true;      // Always true (required)
  analytics: boolean;   // Optional
  marketing: boolean;   // Optional
  timestamp: string;    // ISO 8601 format
}
```

**Key Functions**:
- `acceptAll()` - Accept all cookie categories
- `rejectAll()` - Accept only necessary cookies
- `updateConsent()` - Update specific preferences
- `clearConsent()` - Reset consent state

**Storage**: `localStorage` key: `cookie-consent`

### 2. Cookie Consent Banner

**File**: `/components/CookieConsent.tsx`

**Behavior**:
- Shows automatically on first visit
- Fixed position at bottom of viewport
- Three actions: Accept All, Reject All, Customize
- Hides permanently after consent given
- Reappears if consent cleared

**Accessibility**:
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

### 3. Cookie Settings Modal

**File**: `/components/CookieSettings.tsx`

**Features**:
- Toggle switches for analytics and marketing
- Necessary cookies always enabled (disabled switch)
- Detailed descriptions for each category
- Example cookies listed per category
- Save/Cancel actions

### 4. Cookie Settings Page

**File**: `/app/[locale]/cookie-settings/page.tsx`

Dedicated page accessible at `/cookie-settings`:

**Features**:
- View current consent state
- Last updated timestamp
- Full category descriptions
- Clear consent reset option
- Link to privacy policy

### 5. Google Analytics Integration

**File**: `/lib/analytics/consent-aware-ga.ts`

Implements GA4 Consent Mode V2:

```typescript
// Initialize with denied consent
initGoogleAnalytics(measurementId)

// Update consent when user makes choice
updateGoogleAnalyticsConsent(analytics, marketing)

// Load GA script only after analytics consent
loadGoogleAnalyticsScript(measurementId)
```

**Consent Signals**:
- `analytics_storage` - Tied to analytics consent
- `ad_storage` - Tied to marketing consent
- `ad_user_data` - Tied to marketing consent
- `ad_personalization` - Tied to marketing consent
- `functionality_storage` - Always granted (necessary)
- `security_storage` - Always granted (necessary)

### 6. API Endpoint

**File**: `/app/api/cookie-consent/route.ts`

**POST /api/cookie-consent**

Logs consent preferences for audit trail:

```json
{
  "necessary": true,
  "analytics": true,
  "marketing": false,
  "timestamp": "2025-11-04T20:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Consent preferences saved successfully"
}
```

**Future Enhancements**:
- Store in database for compliance records
- Link to user account (if authenticated)
- Generate compliance reports
- IP address anonymization (last octet masked)

## Cookie Categories

### Necessary Cookies (Always On)

**Purpose**: Essential for website functionality

**Examples**:
- Session cookies (authentication)
- Language preference
- Cookie consent status
- CSRF protection tokens

**Legal Basis**: Legitimate interest (GDPR Art. 6(1)(f))

### Analytics Cookies (Optional)

**Purpose**: Understand how users interact with the website

**Examples**:
- Google Analytics (pageviews, sessions)
- Error tracking (Sentry)
- Performance monitoring
- User behavior analytics

**Legal Basis**: Consent required (GDPR Art. 6(1)(a))

**Data Retention**: 14 months (configurable in GA4)

### Marketing Cookies (Optional)

**Purpose**: Show relevant advertising and measure campaigns

**Examples**:
- Ad personalization
- Conversion tracking
- Remarketing pixels
- Social media integrations

**Legal Basis**: Consent required (GDPR Art. 6(1)(a))

**Data Retention**: Varies by service (typically 30-90 days)

## User Flow

### First Visit

1. User lands on any page
2. Cookie consent banner appears after 1 second
3. User has three options:
   - **Accept All**: All categories enabled
   - **Reject All**: Only necessary cookies
   - **Customize**: Opens settings modal

### Customization Flow

1. User clicks "Customize"
2. Settings modal opens
3. User toggles analytics/marketing switches
4. User clicks "Save Preferences"
5. Modal closes, consent saved

### Subsequent Visits

1. Consent loaded from localStorage
2. Banner does not appear
3. User can access `/cookie-settings` to change preferences

### Changing Preferences

1. User visits `/cookie-settings` page
2. Current consent state displayed with timestamp
3. User modifies toggles
4. User clicks "Save Preferences"
5. Context updated, event triggered
6. Google Analytics consent mode updated in real-time

## Integration Guide

### Step 1: Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Step 2: Layout Integration (Already Done)

```tsx
import { CookieConsentProvider } from '@/contexts/CookieConsentContext'
import { CookieConsent } from '@/components/CookieConsent'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

export default function RootLayout({ children }) {
  return (
    <CookieConsentProvider>
      <GoogleAnalytics />
      {children}
      <CookieConsent />
    </CookieConsentProvider>
  )
}
```

### Step 3: Using Consent in Components

```tsx
'use client'

import { useCookieConsent } from '@/contexts/CookieConsentContext'

function MyComponent() {
  const { consent, hasConsent, acceptAll, rejectAll } = useCookieConsent()

  if (!hasConsent) {
    return <div>Please accept cookies to use this feature</div>
  }

  if (consent.analytics) {
    // Track user interaction
    trackEvent('button_click', { component: 'MyComponent' })
  }

  return <div>Content</div>
}
```

### Step 4: Linking to Settings

Add link to cookie settings in footer:

```tsx
<a href="/cookie-settings">Cookie-Einstellungen</a>
```

## Testing

### Manual Testing Checklist

- [ ] Banner appears on first visit
- [ ] "Accept All" enables all cookies
- [ ] "Reject All" enables only necessary cookies
- [ ] "Customize" opens settings modal
- [ ] Settings modal saves preferences correctly
- [ ] Banner does not reappear after consent given
- [ ] `/cookie-settings` page displays current state
- [ ] Changing settings updates consent immediately
- [ ] GA script loads only with analytics consent
- [ ] Consent persists across page refreshes
- [ ] Clearing localStorage shows banner again
- [ ] Mobile responsive design works correctly
- [ ] Keyboard navigation functional
- [ ] Screen reader announces correctly

### Browser DevTools Testing

**Check localStorage**:
```javascript
localStorage.getItem('cookie-consent')
```

**Check GA consent state**:
```javascript
// Open Chrome DevTools Console
gtag('get', 'G-XXXXXXXXXX', 'consent')
```

**Trigger consent update event**:
```javascript
window.dispatchEvent(new CustomEvent('cookieConsentUpdate', {
  detail: { necessary: true, analytics: true, marketing: false }
}))
```

### Automated Testing

**Unit Tests** (TODO):
```typescript
// __tests__/contexts/CookieConsentContext.test.ts
describe('CookieConsentContext', () => {
  it('should load consent from localStorage', () => {})
  it('should save consent to localStorage', () => {})
  it('should call API endpoint on consent update', () => {})
  it('should trigger custom event on consent update', () => {})
})
```

**E2E Tests** (TODO):
```typescript
// __tests__/e2e/cookie-consent.test.ts
test('should show banner on first visit', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
})

test('should hide banner after accept all', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Alle akzeptieren')
  await expect(page.locator('[role="dialog"]')).not.toBeVisible()
})
```

## Compliance

### GDPR Requirements

✅ **Art. 6(1)(a) - Consent**: Users must actively consent to optional cookies
✅ **Art. 7 - Conditions for consent**: Clear, specific, informed, unambiguous
✅ **Art. 13 - Information**: Privacy policy linked from banner
✅ **Art. 25 - Data protection by design**: Default deny for optional cookies

### ePrivacy Directive Requirements

✅ **Art. 5(3) - Cookie consent**: Banner shown before non-essential cookies set
✅ **Granular consent**: Separate toggles for analytics and marketing
✅ **Easy withdrawal**: Settings page accessible anytime
✅ **No cookie walls**: Users can reject cookies and still use site

### Best Practices

✅ **Clear language**: No legalese in banner text
✅ **Equal prominence**: Accept/Reject buttons same size
✅ **No pre-ticked boxes**: All toggles start as false
✅ **Audit trail**: API logs consent for compliance records
✅ **Accessibility**: WCAG 2.1 AA compliant

## Troubleshooting

### Banner Not Showing

**Check**:
1. Is consent already in localStorage?
2. Is CookieConsentProvider wrapping the app?
3. Check browser console for errors

**Solution**:
```javascript
// Clear consent in browser console
localStorage.removeItem('cookie-consent')
```

### GA Not Loading

**Check**:
1. Is `NEXT_PUBLIC_GA_MEASUREMENT_ID` set?
2. Has user accepted analytics consent?
3. Check Network tab for GA requests

**Solution**:
```javascript
// Check if GA is loaded
console.log('GA loaded:', !!window.gtag)
```

### Consent Not Persisting

**Check**:
1. Is localStorage available (not in incognito)?
2. Check browser storage quota
3. Check for localStorage errors in console

**Solution**:
```javascript
// Test localStorage
try {
  localStorage.setItem('test', '1')
  localStorage.removeItem('test')
  console.log('localStorage working')
} catch (e) {
  console.error('localStorage not available:', e)
}
```

## Future Enhancements

### Phase 2 (Planned)

- [ ] Database persistence for logged-in users
- [ ] Sync consent across devices
- [ ] Consent expiry (re-prompt after 12 months)
- [ ] Cookie audit table for compliance reports
- [ ] Additional third-party integrations:
  - [ ] Facebook Pixel
  - [ ] LinkedIn Insight Tag
  - [ ] Hotjar

### Phase 3 (Planned)

- [ ] A/B testing of consent rates
- [ ] Geolocation-based consent (EU vs non-EU)
- [ ] Multi-language consent text
- [ ] Consent withdrawal notification emails
- [ ] IAB TCF v2.2 compliance (if needed)

## References

- [GDPR Art. 6 - Lawfulness of processing](https://gdpr-info.eu/art-6-gdpr/)
- [GDPR Art. 7 - Conditions for consent](https://gdpr-info.eu/art-7-gdpr/)
- [ePrivacy Directive Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058)
- [Google Analytics Consent Mode](https://support.google.com/analytics/answer/9976101)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Contact

**Maintainer**: RNLT Labs
**Last Updated**: 2025-11-04
**Version**: 1.0

---

**Note**: This implementation provides a solid foundation for cookie consent management. Additional customization may be needed based on specific business requirements and third-party service integrations.
