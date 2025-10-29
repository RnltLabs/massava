# Quick Start Guide: Auth Dialog Redesign

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install framer-motion
```

### Step 2: Review New Components

All new components are in `/components/auth/` with `.redesigned.tsx` suffix:

```
components/auth/
├── AccountTypeSelector.redesigned.tsx  ← Card-based selector
├── SignUpForm.redesigned.tsx           ← Floating labels, terms card
├── LoginForm.redesigned.tsx            ← Consistent styling
├── GoogleOAuthButton.redesigned.tsx    ← Modern OAuth button
└── UnifiedAuthDialog.redesigned.tsx    ← Main dialog with progress
```

### Step 3: Test in Development

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Step 4: Test the Components

Create a test page to see the redesigned dialog:

```tsx
// app/test-auth/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedAuthDialog } from '@/components/auth/UnifiedAuthDialog.redesigned';

export default function TestAuthPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  return (
    <div className="container mx-auto py-20 space-y-4">
      <h1 className="text-3xl font-bold">Auth Dialog Test</h1>

      <div className="flex gap-4">
        <Button onClick={() => {
          setMode('signup');
          setIsOpen(true);
        }}>
          Test Signup
        </Button>

        <Button onClick={() => {
          setMode('login');
          setIsOpen(true);
        }}>
          Test Login
        </Button>
      </div>

      <UnifiedAuthDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={mode}
        onSuccess={() => console.log('Auth success!')}
      />
    </div>
  );
}
```

### Step 5: Deploy to Production

Once testing is complete:

```bash
# Backup old files
cd components/auth
for file in AccountTypeSelector SignUpForm LoginForm GoogleOAuthButton UnifiedAuthDialog; do
  cp ${file}.tsx ${file}.backup.tsx
done

# Replace with redesigned versions
mv AccountTypeSelector.redesigned.tsx AccountTypeSelector.tsx
mv SignUpForm.redesigned.tsx SignUpForm.tsx
mv LoginForm.redesigned.tsx LoginForm.tsx
mv GoogleOAuthButton.redesigned.tsx GoogleOAuthButton.tsx
mv UnifiedAuthDialog.redesigned.tsx UnifiedAuthDialog.tsx

# Test build
npm run build

# Commit
git add .
git commit -m "feat(auth): Redesign authentication dialog"
git push
```

## 📱 Mobile Testing

Test on these viewports:

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test these sizes:
   - iPhone SE: 375x667
   - iPhone 12: 390x844
   - iPhone 12 Pro Max: 428x926
   - Pixel 5: 393x851
```

**Expected Behavior:**
- Dialog opens as bottom sheet on mobile
- No horizontal scrollbars
- Touch targets ≥ 48px
- Smooth animations

## 🎨 Key Design Features

### 1. Floating Labels
```tsx
// Labels start inside input, float up when focused or filled
<input placeholder=" " />  // ← Space is required!
```

### 2. Terms Card (Not Checkbox)
```tsx
// Full-width tappable card instead of tiny checkbox
<div onClick={toggleTerms} className="min-h-[60px]">
  <Check icon> + <Terms text with links>
</div>
```

### 3. Password Strength Meter
```tsx
// Visual 5-level indicator
[■ ■ ■ □ □] Passwortstärke: Gut
```

### 4. Progress Badges
```tsx
// Shows current step
<Badge>Schritt 1 von 2</Badge>
<Badge>REGISTRIERUNG</Badge>
```

## 🔧 Customization

### Change Primary Color

In `tailwind.config.ts`, replace sage colors:

```ts
colors: {
  sage: {
    50: '#f6f7f6',   // Replace with your brand
    // ... other shades
  }
}
```

### Adjust Animations

In components, modify Framer Motion props:

```tsx
<motion.div
  transition={{ duration: 0.3 }}  // ← Change duration
  whileHover={{ scale: 1.05 }}    // ← Change scale
>
```

### Change Step Flow

In `UnifiedAuthDialog.redesigned.tsx`:

```tsx
// To skip account type selection:
const [step, setStep] = useState<AuthStep>('form');  // Start at form

// To add more steps:
type AuthStep = 'type-selection' | 'form' | 'verification';
```

## 🐛 Common Issues

### Issue: Floating labels overlap text

**Solution:** Ensure input has `placeholder=" "` (single space)

```tsx
// ❌ Wrong
<input placeholder="" />

// ✅ Correct
<input placeholder=" " />
```

### Issue: Terms card not clickable

**Solution:** Ensure links use `onClick={(e) => e.stopPropagation()}`

```tsx
<Link
  href="/terms"
  onClick={(e) => e.stopPropagation()}  // ← Prevent card click
>
  Terms
</Link>
```

### Issue: Animations stuttering

**Solution:** Check browser performance, reduce animation complexity

```tsx
// Simplify animations
transition={{ duration: 0.15 }}  // Shorter duration
```

### Issue: Dialog not responsive

**Solution:** Check viewport detection logic

```tsx
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

## 📊 Testing Checklist

Before deploying:

- [ ] Signup flow works (customer)
- [ ] Signup flow works (professional)
- [ ] Login flow works (customer)
- [ ] Login flow works (professional)
- [ ] Google OAuth button works
- [ ] Form validation shows errors
- [ ] Password strength meter updates
- [ ] Terms card is clickable
- [ ] Links in terms card work
- [ ] Back button works (signup)
- [ ] Mode toggle works (signup ↔ login)
- [ ] Mobile sheet opens from bottom
- [ ] Desktop dialog centers correctly
- [ ] Close button works
- [ ] Escape key closes dialog
- [ ] Loading states show correctly
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No console errors

## 📚 Additional Resources

- **Full Documentation:** `/docs/design/redesign/IMPLEMENTATION_SUMMARY.md`
- **Design Specs:** `/docs/design/redesign/03-COMPONENTS.md`
- **Design System:** `/docs/design/redesign/01-DESIGN-SYSTEM.md`
- **User Flows:** `/docs/design/redesign/02-USER-FLOWS.md`

## 💬 Support

If you encounter issues:

1. Check `/docs/design/redesign/IMPLEMENTATION_SUMMARY.md` for detailed specs
2. Review component code comments
3. Test in Chrome DevTools with Network throttling
4. Verify Tailwind classes are generated (check build output)

## 🎉 Success!

Your auth dialog is now redesigned with:

✅ Modern .io aesthetic
✅ Wellness theme (sage green)
✅ Smooth 60 FPS animations
✅ Mobile-first responsive design
✅ Full accessibility support
✅ Production-ready code

---

**Version:** 1.0
**Last Updated:** 2025-10-28
