# Visual Feature Guide - Unified Auth Enhancements

## Feature 1: Optional Phone Number Field

### Location
Sign Up Form (`components/auth/SignUpForm.tsx`)

### Visual Layout
```
┌─────────────────────────────────────────┐
│  Name                                   │
│  ┌───────────────────────────────────┐  │
│  │ Dein vollständiger Name           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  E-Mail                                 │
│  ┌───────────────────────────────────┐  │
│  │ name@beispiel.de                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Telefonnummer (optional) ← NEW         │
│  ┌───────────────────────────────────┐  │
│  │ +49 123 456789                    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Passwort                               │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••••••                  👁  │  │
│  └───────────────────────────────────┘  │
│  [Password strength indicator]          │
│                                         │
│  ☑ Ich akzeptiere die Nutzungs-        │
│     bedingungen und Datenschutz         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Konto erstellen               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Field Properties
- **Label**: "Telefonnummer (optional)"
- **Type**: `tel` (mobile-optimized keyboard)
- **Placeholder**: "+49 123 456789"
- **Required**: No ❌
- **Validation**: 7-20 characters, only digits, spaces, +, -, (), ()

### Accepted Formats
```
✓ +49 123 456789
✓ +1 (555) 123-4567
✓ 0049 123 456789
✓ 123456789
✓ +33123456789
✓ (empty - optional)

✗ abc123def (letters)
✗ 12345 (too short)
✗ 123456789012345678901 (too long)
```

---

## Feature 2: Submit Button Disabled Until Terms Checked

### Before Checking Terms
```
┌─────────────────────────────────────────┐
│  ☐ Ich akzeptiere die Nutzungs-        │
│     bedingungen und Datenschutz         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Konto erstellen   [DISABLED]    │  │ ← Grayed out
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### After Checking Terms
```
┌─────────────────────────────────────────┐
│  ☑ Ich akzeptiere die Nutzungs-        │
│     bedingungen und Datenschutz         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Konto erstellen   [ENABLED]     │  │ ← Full color
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Button States
| State | Terms Checked | Loading | Button State |
|-------|---------------|---------|--------------|
| Initial | ❌ | ❌ | Disabled (grayed out) |
| Terms Checked | ✅ | ❌ | Enabled (primary color) |
| Submitting | ✅ | ✅ | Disabled (spinner) |
| Terms Unchecked | ❌ | ❌ | Disabled (grayed out) |

### Code Implementation
```typescript
<Button
  type="submit"
  className="w-full"
  disabled={loading || !formData.terms}
>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Konto wird erstellt...
    </>
  ) : (
    'Konto erstellen'
  )}
</Button>
```

---

## Feature 3: German Login/Signup Buttons

### Location
Header Component (`components/Header.tsx`)

### Before (English)
```
┌──────────────────────────────────────────────────┐
│  Massava        🌐  [Login]  [Sign Up]          │
└──────────────────────────────────────────────────┘
```

### After (German)
```
┌──────────────────────────────────────────────────┐
│  Massava        🌐  [Anmelden]  [Registrieren]  │
└──────────────────────────────────────────────────┘
```

### Button Styles

#### Anmelden (Login)
```
┌────────────┐
│  Anmelden  │  ← Ghost button (transparent background)
└────────────┘
```
- Background: `transparent`
- Hover: `accent/20`
- Border radius: `rounded-2xl`

#### Registrieren (Sign Up)
```
┌────────────────┐
│  Registrieren  │  ← Primary button (colored background)
└────────────────┘
```
- Background: `primary` (brand color)
- Hover: `primary/90`
- Shadow: `wellness-shadow`
- Border radius: `rounded-2xl`

---

## User Flows

### Registration Flow with New Features

1. **User arrives at landing page**
   ```
   Header: [Anmelden] [Registrieren]  ← German text
   ```

2. **User clicks "Registrieren"**
   - Auth dialog opens
   - Sign up form displayed

3. **User fills in required fields**
   ```
   Name: ✓ Max Mustermann
   Email: ✓ max@example.com
   Phone: ✓ +49 123 456789 (optional - can skip)
   Password: ✓ ValidPassword123
   Terms: ☐ (unchecked)
   ```
   - Submit button is **DISABLED** (grayed out)

4. **User checks terms checkbox**
   ```
   Terms: ☑ (checked)
   ```
   - Submit button becomes **ENABLED** (full color)

5. **User submits form**
   - Phone number validated (if provided)
   - Account created with phone number
   - Verification email sent

6. **User with existing account**
   ```
   Header: [Anmelden] [Registrieren]  ← Same German text
   ```
   - Clicks "Anmelden" to log in

---

## Mobile View

### Phone Input Optimization
When user taps phone field on mobile:
```
┌─────────────────────────────────┐
│  Telefonnummer (optional)       │
│  ┌───────────────────────────┐  │
│  │ +49 123 456789            │  │ ← Cursor here
│  └───────────────────────────┘  │
│                                 │
│  [7] [8] [9]                    │ ← Numeric keyboard
│  [4] [5] [6]                    │   with +, -, ()
│  [1] [2] [3]                    │
│  [+] [0] [⌫]                    │
└─────────────────────────────────┘
```

### Button States on Mobile
```
Terms Unchecked:
┌───────────────────────────────┐
│   Konto erstellen (disabled)  │ ← Grayed out, no tap feedback
└───────────────────────────────┘

Terms Checked:
┌───────────────────────────────┐
│   Konto erstellen (enabled)   │ ← Primary color, tap feedback
└───────────────────────────────┘
```

---

## Validation Feedback

### Phone Number Errors
```
┌─────────────────────────────────────┐
│  Telefonnummer (optional)           │
│  ┌───────────────────────────────┐  │
│  │ abc123                  ✗     │  │ ← Red border
│  └───────────────────────────────┘  │
│  ⚠ Ungültige Telefonnummer          │ ← Error message in German
│     (7-20 Zeichen, nur Zahlen       │
│      und +/-/()/Leerzeichen)        │
└─────────────────────────────────────┘
```

### Terms Not Checked Error
```
┌─────────────────────────────────────┐
│  ☐ Ich akzeptiere die Nutzungs-    │
│     bedingungen und Datenschutz     │
│  ⚠ You must agree to the terms      │ ← Error if form submitted
│     and privacy policy              │
└─────────────────────────────────────┘
```

---

## Accessibility Features

### Phone Field
- `<input type="tel">` → Semantic HTML
- `id="phone"` linked to `<label htmlFor="phone">`
- `aria-invalid` when validation fails
- Error message linked with `aria-describedby`

### Submit Button
- `disabled` attribute prevents keyboard/mouse interaction
- Visual disabled state (reduced opacity)
- Screen reader announces: "Konto erstellen, button, disabled"
- When enabled: "Konto erstellen, button"

### Header Buttons
- Keyboard accessible (Tab navigation)
- Focus indicators visible
- ARIA labels describe action
- High contrast ratio (WCAG AA compliant)

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Phone input (`type="tel"`) | ✅ | ✅ | ✅ | ✅ |
| Button disabled state | ✅ | ✅ | ✅ | ✅ |
| Zod validation | ✅ | ✅ | ✅ | ✅ |
| shadcn/ui components | ✅ | ✅ | ✅ | ✅ |

---

## Testing Checklist

### Phone Number Field
- [ ] Phone field is visible in sign up form
- [ ] Phone field is labeled "Telefonnummer (optional)"
- [ ] Placeholder shows "+49 123 456789"
- [ ] Field accepts valid phone numbers
- [ ] Field rejects invalid formats (letters, too short, too long)
- [ ] Empty phone number is accepted (optional)
- [ ] Phone number is stored in database
- [ ] Error messages appear in German

### Submit Button Disabled State
- [ ] Button is disabled when terms unchecked
- [ ] Button is visually grayed out when disabled
- [ ] Button becomes enabled when terms checked
- [ ] Button cannot be clicked when disabled
- [ ] Form cannot be submitted via Enter key when disabled
- [ ] Button shows loading state during submission
- [ ] Button re-disables on form reset

### German Button Text
- [ ] Header shows "Anmelden" instead of "Login"
- [ ] Header shows "Registrieren" instead of "Sign Up"
- [ ] Buttons open correct auth dialog tabs
- [ ] Text is visible on all screen sizes
- [ ] Text maintains proper styling

---

## Known Limitations

1. **No Phone Formatting**: Phone numbers stored as-is, no auto-formatting
2. **No Country Selector**: Users must manually enter country code
3. **No SMS Verification**: Phone number not verified (future enhancement)
4. **Hardcoded German**: Button text not using i18n (should use next-intl)
5. **No Phone Parsing**: International format not normalized before storage

---

## Future Enhancements

### Short-term (Sprint)
1. Add auto-formatting for phone numbers (e.g., +49 → +49 )
2. Add visual feedback when phone field receives focus
3. Add tooltip explaining phone number format

### Medium-term (Quarter)
1. Integrate `react-phone-number-input` library
2. Add country code dropdown selector
3. Implement SMS verification flow
4. Add phone number to user profile settings

### Long-term (Year)
1. Multi-factor authentication via SMS
2. Login with phone number (passwordless)
3. Phone number validation via carrier lookup
4. International number formatting service

---

This visual guide provides a comprehensive overview of all three implemented features with clear examples and testing guidance.
