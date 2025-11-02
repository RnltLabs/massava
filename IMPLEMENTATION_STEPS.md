# Mobile Header Fix - Implementation Steps

## Quick Start

Follow these steps in order to fix the mobile header navigation issue.

## Step 1: Install shadcn/ui Sheet Component (if needed)

```bash
cd /Users/roman/Development/massava
npx shadcn-ui@latest add sheet
```

If Sheet is already installed, skip to Step 2.

## Step 2: Create MobileNav Component

The file has already been created at:
**`/Users/roman/Development/massava/components/MobileNav.tsx`**

This component provides:
- Hamburger menu button (mobile only)
- Sheet drawer navigation
- Language switcher in mobile menu
- Auth buttons (Anmelden/Registrieren)
- WCAG 2.1 AA compliant touch targets (44x44px minimum)

## Step 3: Update Header.tsx

Modify `/Users/roman/Development/massava/components/Header.tsx`:

### 3a. Add import at the top:
```tsx
import { MobileNav } from '@/components/MobileNav'
```

### 3b. Find the right section (around line 100-125) and replace:

**OLD CODE** (remove this):
```tsx
{/* Right Section: Language Switcher + Auth Buttons */}
<div className="flex items-center gap-3">
  <LanguageSwitcher />

  {!session && (
    <>
      <Link href={`/${locale}/anmelden`}>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent"
        >
          Anmelden
        </button>
      </Link>

      <Link href={`/${locale}/registrieren`}>
        <button
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Registrieren
        </button>
      </Link>
    </>
  )}

  {session && (
    <>
      <UserNav />
      <LogoutButton onLogout={handleLogout} />
    </>
  )}
</div>
```

**NEW CODE** (replace with this):
```tsx
{/* Desktop Navigation - Hidden on Mobile (sm:flex = show on 640px+) */}
<div className="hidden sm:flex items-center gap-3">
  <LanguageSwitcher />

  {!session && (
    <>
      <Link href={`/${locale}/anmelden`}>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent"
          aria-label="Sign in to your account"
        >
          Anmelden
        </button>
      </Link>

      <Link href={`/${locale}/registrieren`}>
        <button
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          aria-label="Create a new account"
        >
          Registrieren
        </button>
      </Link>
    </>
  )}

  {session && (
    <>
      <UserNav />
      <LogoutButton onLogout={handleLogout} />
    </>
  )}
</div>

{/* Mobile Navigation - Hamburger Menu (sm:hidden = hide on 640px+) */}
<MobileNav locale={locale} isAuthenticated={!!session} />
```

### Key Changes:
1. Added `hidden sm:flex` to desktop navigation (hides on mobile, shows on tablet+)
2. Added `aria-label` to buttons for accessibility
3. Added `<MobileNav />` component for mobile view

## Step 4: Test the Implementation

### Visual Testing (Chrome DevTools)
1. Open the app in browser
2. Open Chrome DevTools (F12)
3. Click "Toggle device toolbar" (Ctrl+Shift+M / Cmd+Shift+M)
4. Test these viewport sizes:
   - 320px (iPhone SE) - Should show hamburger menu
   - 375px (iPhone 12) - Should show hamburger menu
   - 640px (Small tablet) - Should show desktop layout
   - 768px (Tablet) - Should show desktop layout
   - 1024px+ (Desktop) - Should show desktop layout

### Functional Testing
- [ ] Click hamburger menu on mobile → Sheet drawer opens
- [ ] Click "Anmelden" in mobile menu → Navigates correctly
- [ ] Click "Registrieren" in mobile menu → Navigates correctly
- [ ] Language switcher works in mobile menu
- [ ] Click outside drawer → Sheet closes
- [ ] Desktop layout shows all buttons horizontally (no hamburger)

### Accessibility Testing
- [ ] **Keyboard Navigation**:
  - Tab through header elements
  - Enter/Space opens Sheet
  - Escape closes Sheet
  - Tab cycles through Sheet elements when open
- [ ] **Screen Reader**:
  - Hamburger button announces "Open navigation menu"
  - Sheet title/description announced
  - All buttons have clear labels
- [ ] **Touch Targets**:
  - Hamburger button: 44x44px minimum (check with DevTools)
  - Mobile menu buttons: 48px height (h-12 class)

### Browser Testing
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (real devices if possible)

## Step 5: Verify Build

```bash
cd /Users/roman/Development/massava
npm run build
```

Check for:
- No TypeScript errors
- No ESLint warnings
- Build completes successfully

## Step 6: Commit Changes

```bash
git add components/MobileNav.tsx
git add components/Header.tsx
git commit -m "fix: Implement mobile-responsive header navigation with Sheet drawer

- Add MobileNav component with hamburger menu
- Use shadcn/ui Sheet for mobile navigation drawer
- Hide desktop navigation on mobile (< 640px)
- Ensure WCAG 2.1 AA compliance (44px touch targets)
- Maintain desktop horizontal layout unchanged

Fixes mobile header overflow issue where language switcher + auth buttons didn't fit on small screens."
```

## Troubleshooting

### Issue: Sheet component not found
**Solution**: Install it with `npx shadcn-ui@latest add sheet`

### Issue: MobileNav not rendering
**Solution**: Check that import path is correct and file exists at `/Users/roman/Development/massava/components/MobileNav.tsx`

### Issue: Desktop layout broken
**Solution**: Verify `hidden sm:flex` classes are applied correctly to desktop nav div

### Issue: Sheet doesn't open
**Solution**:
1. Check browser console for errors
2. Verify Sheet component is properly installed
3. Check that `open` state is managed correctly in MobileNav

### Issue: TypeScript errors
**Solution**:
1. Check that all imports are correct
2. Verify `locale` and `isAuthenticated` props are passed correctly
3. Run `npm run type-check` for detailed errors

## Rollback (if needed)

If something goes wrong, revert changes:

```bash
git checkout -- components/Header.tsx
git rm components/MobileNav.tsx
```

Then investigate the issue before re-applying changes.

## Success Criteria

✅ Mobile header (< 640px) shows only logo and hamburger menu
✅ Hamburger menu opens Sheet drawer from right
✅ All navigation items accessible in mobile menu
✅ Desktop layout (≥ 640px) unchanged
✅ No horizontal overflow on any screen size
✅ All touch targets meet 44x44px minimum
✅ Keyboard navigation works correctly
✅ Screen reader announces elements properly
✅ Build completes without errors

---

**Total Implementation Time**: ~30-45 minutes
**Status**: Ready to implement
