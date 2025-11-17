# Components Directory

## Cookie Consent Banner

### Overview
GDPR-compliant cookie consent banner for analytics compliance.

### Usage

```tsx
import { CookieConsentBanner } from '@/components/cookie-consent-banner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  )
}
```

### Features
- ✅ GDPR compliant (opt-in consent)
- ✅ Blocks analytics until consent given
- ✅ localStorage persistence
- ✅ WCAG 2.1 AA accessible
- ✅ Mobile-responsive
- ✅ Slide-up animation

### Documentation
See `/COOKIE_CONSENT_IMPLEMENTATION.md` for complete documentation.

### Testing
```bash
npm test lib/__tests__/cookie-consent.test.ts
```
