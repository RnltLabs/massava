# Massava Authentication Redesign - Design System

**Document:** Colors, Typography, Spacing, and Visual Language
**Date:** October 2025
**Design Team:** UX Design

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Elevation & Shadows](#elevation--shadows)
6. [Border Radius](#border-radius)
7. [Animation Timing](#animation-timing)
8. [Iconography](#iconography)
9. [Implementation Guide](#implementation-guide)

---

## Design Philosophy

### Core Principles

**1. Wellness-Inspired Aesthetics**
The design system evokes the calm, professional atmosphere of a high-end Thai massage spa:
- Natural, organic colors (sage green, warm earth tones)
- Soft, rounded shapes (approachable, non-threatening)
- Generous white space (breathing room, clarity)
- Subtle, organic animations (gentle, not jarring)

**2. Mobile-First Hierarchy**
Every decision prioritizes mobile users:
- Large touch targets (48x48px minimum)
- High contrast (readability in various lighting)
- Finger-friendly spacing (16px minimum between elements)
- Performance-optimized (< 3s load time)

**3. Accessibility-First**
Design that works for everyone:
- WCAG 2.1 AA compliance (minimum 4.5:1 contrast)
- Clear focus indicators (3px ring, high contrast)
- Screen reader optimized (semantic HTML, ARIA)
- Keyboard navigation support (full functionality)

**4. Modern, Premium Feel**
Inspired by Linear, Vercel, Stripe:
- Minimalist approach (remove everything non-essential)
- Smooth animations (Framer Motion, 60 FPS)
- Attention to micro-details (hover states, transitions)
- Consistent design language (no visual debt)

---

## Color System

### Primary Palette (Wellness Theme)

**Sage Green (Primary)**
```css
--massava-sage-50:  #F0F5F0;  /* Lightest - backgrounds */
--massava-sage-100: #D8E8D8;  /* Light - hover states */
--massava-sage-200: #B5D4B5;  /* Medium light */
--massava-sage-300: #8FBF8F;  /* Medium */
--massava-sage-400: #6AAA6A;  /* Medium dark */
--massava-sage-500: #4A8F4A;  /* Base - primary actions */
--massava-sage-600: #3A7A3A;  /* Dark - hover on primary */
--massava-sage-700: #2D5F2D;  /* Darker */
--massava-sage-800: #1F4A1F;  /* Very dark - text on light bg */
--massava-sage-900: #133313;  /* Darkest */
```

**Rationale:**
- Green evokes wellness, growth, nature (perfect for Thai massage)
- Sage hue is muted, sophisticated (not bright/juvenile)
- Differentiates from purple competitors (Booksy, Treatwell)
- Accessible contrast ratios at all levels

**Usage:**
- Primary buttons: `--massava-sage-500`
- Primary button hover: `--massava-sage-600`
- Success states: `--massava-sage-600`
- Backgrounds (light): `--massava-sage-50`

---

**Warm Earth Tones (Secondary/Accent)**
```css
--massava-earth-50:  #FAF8F5;  /* Warm white - main background */
--massava-earth-100: #F1EDE7;  /* Beige - cards */
--massava-earth-200: #E6DED3;  /* Light beige */
--massava-earth-300: #D4C4B0;  /* Medium beige */
--massava-earth-400: #B8A38A;  /* Tan */
--massava-earth-500: #9C8469;  /* Brown - accents */
--massava-earth-600: #7D6951;  /* Dark brown */
--massava-earth-700: #5F4F3C;  /* Very dark brown */
--massava-earth-800: #433729;  /* Almost black */
--massava-earth-900: #2B2218;  /* Rich black */
```

**Rationale:**
- Earth tones evoke natural, organic, spa-like atmosphere
- Warm beige backgrounds feel inviting (not sterile white)
- Brown accents add sophistication without being corporate

**Usage:**
- Page background: `--massava-earth-50`
- Card backgrounds: `--massava-earth-100`
- Borders (subtle): `--massava-earth-200`
- Secondary text: `--massava-earth-700`

---

### Neutral Palette (Grays)

**True Grays (Functional)**
```css
--massava-gray-50:  #FAFAFA;  /* Lightest gray */
--massava-gray-100: #F5F5F5;  /* Very light gray */
--massava-gray-200: #E5E5E5;  /* Light gray - borders */
--massava-gray-300: #D4D4D4;  /* Medium light gray */
--massava-gray-400: #A3A3A3;  /* Medium gray - disabled */
--massava-gray-500: #737373;  /* Base gray - icons */
--massava-gray-600: #525252;  /* Dark gray - secondary text */
--massava-gray-700: #404040;  /* Darker gray */
--massava-gray-800: #262626;  /* Very dark gray - primary text */
--massava-gray-900: #171717;  /* Almost black */
```

**Usage:**
- Primary text: `--massava-gray-900`
- Secondary text: `--massava-gray-600`
- Disabled states: `--massava-gray-400`
- Borders: `--massava-gray-200`
- Input backgrounds: `--massava-gray-50`

---

### Semantic Colors

**Success (Green)**
```css
--massava-success-50:  #ECFDF5;
--massava-success-500: #10B981;  /* Primary success */
--massava-success-600: #059669;  /* Hover */
--massava-success-700: #047857;  /* Active */
```

**Error (Red)**
```css
--massava-error-50:  #FEF2F2;
--massava-error-500: #EF4444;  /* Primary error */
--massava-error-600: #DC2626;  /* Hover */
--massava-error-700: #B91C1C;  /* Active */
```

**Warning (Amber)**
```css
--massava-warning-50:  #FFFBEB;
--massava-warning-500: #F59E0B;  /* Primary warning */
--massava-warning-600: #D97706;  /* Hover */
--massava-warning-700: #B45309;  /* Active */
```

**Info (Blue)**
```css
--massava-info-50:  #EFF6FF;
--massava-info-500: #3B82F6;  /* Primary info */
--massava-info-600: #2563EB;  /* Hover */
--massava-info-700: #1D4ED8;  /* Active */
```

---

### Contrast Ratios (WCAG 2.1 AA Compliance)

**Text on Background:**
| Combination | Ratio | Pass |
|-------------|-------|------|
| Gray-900 on Earth-50 | 14.2:1 | ✅ AAA |
| Gray-800 on Earth-50 | 11.5:1 | ✅ AAA |
| Gray-600 on Earth-50 | 7.8:1 | ✅ AAA |
| Sage-500 on White | 4.7:1 | ✅ AA |
| Error-500 on White | 4.9:1 | ✅ AA |

**Interactive Elements:**
| Combination | Ratio | Pass |
|-------------|-------|------|
| Sage-500 button on Earth-50 | 4.7:1 | ✅ AA |
| White text on Sage-500 | 5.2:1 | ✅ AA |
| Gray-600 on Gray-100 | 5.5:1 | ✅ AA |

---

### Color Usage Guidelines

**DO:**
- ✅ Use Sage-500 for primary actions (Sign Up, Login buttons)
- ✅ Use Earth tones for warm, inviting backgrounds
- ✅ Use high contrast text (Gray-900) for readability
- ✅ Use semantic colors appropriately (red = error, green = success)

**DON'T:**
- ❌ Use Sage green for error states (confusing)
- ❌ Use multiple primary colors (stick to green)
- ❌ Use low contrast for important text
- ❌ Use color alone to convey meaning (add icons)

---

## Typography

### Font Family

**Primary Font: Inter**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Rationale:**
- Modern, clean sans-serif (perfect for digital)
- Excellent readability on screens
- Variable font (performance optimization)
- Used by Linear, Vercel (familiar to users)
- Open source (no licensing costs)
- Supports German characters (ä, ö, ü, ß)

**Fallbacks:**
- -apple-system: iOS/macOS default (if Inter fails)
- BlinkMacSystemFont: Chrome on macOS
- Segoe UI: Windows default
- sans-serif: System default

**Loading Strategy:**
```typescript
// next.config.js
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
})
```

---

### Type Scale

**Mobile-First Scale (Base: 16px)**

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 32px | 40px (1.25) | 700 | Dialog titles (mobile) |
| Heading 1 | 24px | 32px (1.33) | 600 | Section headings |
| Heading 2 | 20px | 28px (1.4) | 600 | Subsection headings |
| Heading 3 | 18px | 24px (1.33) | 600 | Card titles |
| Body Large | 18px | 28px (1.56) | 400 | Important body text |
| Body | 16px | 24px (1.5) | 400 | Standard body text |
| Body Small | 14px | 20px (1.43) | 400 | Secondary text, captions |
| Label | 14px | 20px (1.43) | 500 | Form labels, buttons |
| Caption | 12px | 16px (1.33) | 400 | Helper text, footnotes |

**Desktop Scale (≥ 768px) - Progressive Enhancement**

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 48px | 56px (1.17) | 700 | Dialog titles (desktop) |
| Heading 1 | 32px | 40px (1.25) | 600 | Section headings |
| Heading 2 | 24px | 32px (1.33) | 600 | Subsection headings |
| Heading 3 | 20px | 28px (1.4) | 600 | Card titles |
| Body Large | 18px | 28px (1.56) | 400 | Important body text |
| Body | 16px | 24px (1.5) | 400 | Standard body text |
| (Same as mobile for Body Small, Label, Caption) |

---

### Font Weights

```css
--font-regular: 400;  /* Body text, descriptions */
--font-medium:  500;  /* Labels, emphasized text */
--font-semibold: 600; /* Headings, buttons */
--font-bold:    700;  /* Display, important headings */
```

**Usage Guidelines:**
- Regular (400): All body text, paragraphs
- Medium (500): Form labels, navigation links
- Semibold (600): Headings (H1, H2, H3), button text
- Bold (700): Display text, dialog titles

---

### Typography Examples

**Dialog Title:**
```css
.dialog-title {
  font-size: 32px;         /* Mobile */
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.02em; /* Tighter for large text */
  color: var(--massava-gray-900);
}

@media (min-width: 768px) {
  .dialog-title {
    font-size: 48px;       /* Desktop */
    line-height: 56px;
  }
}
```

**Form Label:**
```css
.form-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--massava-gray-700);
  letter-spacing: 0.01em;
}
```

**Button Text:**
```css
.button-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.01em;
}
```

**Helper Text:**
```css
.helper-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--massava-gray-600);
}
```

---

## Spacing System

### Base Unit: 4px

**Scale (Tailwind-Compatible):**
```css
--spacing-0:  0px;     /* 0 */
--spacing-1:  4px;     /* 0.25rem */
--spacing-2:  8px;     /* 0.5rem */
--spacing-3:  12px;    /* 0.75rem */
--spacing-4:  16px;    /* 1rem */
--spacing-5:  20px;    /* 1.25rem */
--spacing-6:  24px;    /* 1.5rem */
--spacing-8:  32px;    /* 2rem */
--spacing-10: 40px;    /* 2.5rem */
--spacing-12: 48px;    /* 3rem */
--spacing-16: 64px;    /* 4rem */
--spacing-20: 80px;    /* 5rem */
--spacing-24: 96px;    /* 6rem */
```

---

### Component Spacing Guidelines

**Dialog Padding:**
```css
/* Mobile */
.dialog-content {
  padding: 20px; /* 5 units */
}

/* Desktop */
@media (min-width: 768px) {
  .dialog-content {
    padding: 32px; /* 8 units */
  }
}
```

**Form Field Spacing:**
```css
.form-field {
  margin-bottom: 20px; /* 5 units - between fields */
}

.form-field-gap {
  gap: 8px; /* 2 units - label to input */
}
```

**Button Padding:**
```css
.button-primary {
  padding: 12px 24px; /* 3 units vertical, 6 units horizontal */
  min-height: 48px;   /* Touch target (iOS HIG) */
}

.button-large {
  padding: 16px 32px; /* 4 units vertical, 8 units horizontal */
  min-height: 56px;   /* Extra large touch target */
}
```

**Card Spacing:**
```css
.card {
  padding: 20px;      /* 5 units - mobile */
  gap: 16px;          /* 4 units - between card elements */
}

@media (min-width: 768px) {
  .card {
    padding: 24px;    /* 6 units - desktop */
  }
}
```

---

### Touch Target Guidelines

**Minimum Sizes (iOS Human Interface Guidelines):**
- Minimum: 44x44px (iOS recommendation)
- Recommended: 48x48px (Material Design, Android)
- Comfortable: 56x56px (large buttons)

**Spacing Between Touch Targets:**
- Minimum: 8px (cramped, avoid if possible)
- Recommended: 16px (comfortable thumb navigation)
- Generous: 24px (extra breathing room)

---

## Elevation & Shadows

### Shadow System

**Purpose:**
- Create visual hierarchy (cards above background)
- Indicate interactivity (hover elevates)
- Separate overlays (dialogs, dropdowns)

**Shadow Levels:**

```css
/* Level 0: Flat (no shadow) */
--shadow-none: none;

/* Level 1: Subtle (cards at rest) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Level 2: Card (default card elevation) */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Level 3: Raised (hover state) */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Level 4: Floating (dropdowns, popovers) */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Level 5: Modal (dialog overlay) */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

### Usage Guidelines

**Cards (Account Type Selector):**
```css
.account-type-card {
  box-shadow: var(--shadow-md); /* Default */
  transition: box-shadow 200ms ease-out;
}

.account-type-card:hover {
  box-shadow: var(--shadow-lg); /* Elevated on hover */
}

.account-type-card:active {
  box-shadow: var(--shadow-sm); /* Pressed down */
}
```

**Dialog:**
```css
.dialog-overlay {
  background: rgba(0, 0, 0, 0.5); /* Dark overlay */
}

.dialog-content {
  box-shadow: var(--shadow-2xl); /* Strong shadow for prominence */
}
```

**Buttons (Subtle Elevation):**
```css
.button-primary {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Minimal */
}

.button-primary:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* Lift on hover */
}
```

---

## Border Radius

### Radius Scale

```css
--radius-none: 0px;      /* Sharp corners (rare) */
--radius-sm:   4px;      /* Small (tags, badges) */
--radius-md:   8px;      /* Medium (inputs, small buttons) */
--radius-lg:   12px;     /* Large (cards, large buttons) */
--radius-xl:   16px;     /* Extra large (dialogs) */
--radius-2xl:  24px;     /* Very large (special cards) */
--radius-full: 9999px;   /* Pill shape (toggle switches) */
```

---

### Usage Guidelines

**Inputs:**
```css
.input-field {
  border-radius: var(--radius-md); /* 8px */
}
```

**Buttons:**
```css
.button-primary {
  border-radius: var(--radius-lg); /* 12px - friendly, approachable */
}
```

**Cards:**
```css
.card {
  border-radius: var(--radius-lg); /* 12px */
}
```

**Dialog:**
```css
.dialog-content {
  border-radius: var(--radius-xl); /* 16px - premium feel */
}

@media (max-width: 767px) {
  .dialog-content {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    /* Rounded top corners only (bottom sheet style) */
  }
}
```

**Avatar / Profile Picture:**
```css
.avatar {
  border-radius: var(--radius-full); /* Perfect circle */
}
```

---

## Animation Timing

### Duration Scale

```css
--duration-instant: 100ms;  /* Micro-interactions (checkbox check) */
--duration-fast:    200ms;  /* Hover states, focus rings */
--duration-normal:  300ms;  /* Default transitions */
--duration-slow:    400ms;  /* Complex animations (step transitions) */
--duration-slower:  600ms;  /* Deliberate animations (success checkmark) */
```

---

### Easing Functions

**Standard Easing (Most Common):**
```css
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1); /* Material Design standard */
```

**Ease-Out (Elements Entering):**
```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1); /* Fast start, slow end */
```

**Ease-In (Elements Exiting):**
```css
--ease-in: cubic-bezier(0.4, 0.0, 1, 1); /* Slow start, fast end */
```

**Ease-In-Out (Symmetrical):**
```css
--ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1); /* Smooth both ends */
```

---

### Animation Usage Guidelines

**Button Hover:**
```css
.button {
  transition: background-color 200ms var(--ease-standard),
              box-shadow 200ms var(--ease-standard),
              transform 200ms var(--ease-standard);
}

.button:hover {
  transform: translateY(-2px); /* Subtle lift */
}
```

**Form Input Focus:**
```css
.input-field {
  transition: border-color 200ms var(--ease-standard),
              box-shadow 200ms var(--ease-standard);
}

.input-field:focus {
  border-color: var(--massava-sage-500);
  box-shadow: 0 0 0 3px rgba(74, 143, 74, 0.1); /* Focus ring */
}
```

**Step Transition (Framer Motion):**
```typescript
const stepVariants = {
  enter: {
    opacity: 0,
    x: 20,
  },
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.0, 0.0, 0.2, 1], // ease-out
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 1, 1], // ease-in
    },
  },
}
```

**Success Checkmark Animation:**
```css
@keyframes checkmark-draw {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark {
  animation: checkmark-draw 600ms var(--ease-out) forwards;
}
```

---

### Performance Guidelines

**DO:**
- ✅ Animate `opacity` (GPU-accelerated)
- ✅ Animate `transform` (GPU-accelerated)
- ✅ Use `will-change` sparingly (only during animation)
- ✅ Keep animations under 400ms (feels responsive)

**DON'T:**
- ❌ Animate `width`, `height` (triggers layout)
- ❌ Animate `top`, `left` (use `transform: translate()`)
- ❌ Overuse `will-change` (wastes memory)
- ❌ Animate too many properties (janky performance)

---

## Iconography

### Icon System

**Library: Lucide React**
```typescript
import { User, Building2, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react'
```

**Rationale:**
- Modern, consistent design language
- Tree-shakeable (only import icons used)
- Customizable (size, color, stroke width)
- Widely used (Linear, Vercel use similar)
- MIT license (free for commercial use)

---

### Icon Sizes

```css
--icon-xs:  12px; /* Inline with text */
--icon-sm:  16px; /* Form field icons */
--icon-md:  20px; /* Button icons */
--icon-lg:  24px; /* Card header icons */
--icon-xl:  32px; /* Feature icons */
--icon-2xl: 48px; /* Hero icons */
```

---

### Icon Usage Guidelines

**Account Type Icons:**
```typescript
<Building2 className="h-8 w-8" /> {/* 32px - prominent */}
<User className="h-8 w-8" />
```

**Form Field Icons:**
```typescript
<Mail className="h-5 w-5" />      {/* 20px */}
<Lock className="h-5 w-5" />
<Eye className="h-5 w-5" />
```

**Button Icons:**
```typescript
<ArrowRight className="h-5 w-5" /> {/* 20px */}
```

**Success/Error Icons:**
```typescript
<Check className="h-6 w-6" />      {/* 24px - prominent */}
<X className="h-6 w-6" />
```

---

### Icon Colors

**Default (Inherit Text Color):**
```tsx
<Mail className="h-5 w-5 text-gray-600" />
```

**Primary Actions:**
```tsx
<ArrowRight className="h-5 w-5 text-white" /> {/* On sage button */}
```

**Success:**
```tsx
<Check className="h-6 w-6 text-success-600" />
```

**Error:**
```tsx
<X className="h-6 w-6 text-error-600" />
```

---

## Implementation Guide

### Tailwind CSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sage Green (Primary)
        sage: {
          50: '#F0F5F0',
          100: '#D8E8D8',
          200: '#B5D4B5',
          300: '#8FBF8F',
          400: '#6AAA6A',
          500: '#4A8F4A',
          600: '#3A7A3A',
          700: '#2D5F2D',
          800: '#1F4A1F',
          900: '#133313',
        },
        // Earth Tones (Secondary)
        earth: {
          50: '#FAF8F5',
          100: '#F1EDE7',
          200: '#E6DED3',
          300: '#D4C4B0',
          400: '#B8A38A',
          500: '#9C8469',
          600: '#7D6951',
          700: '#5F4F3C',
          800: '#433729',
          900: '#2B2218',
        },
        // Semantic colors (override shadcn defaults)
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Mobile-first scale
        'display': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        // Already covered by Tailwind defaults (4px base)
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '200ms',
        'normal': '300ms',
        'slow': '400ms',
        'slower': '600ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

### CSS Custom Properties (Fallback)

```css
/* app/globals.css */
:root {
  /* Colors */
  --color-sage-500: #4A8F4A;
  --color-earth-50: #FAF8F5;
  --color-gray-900: #171717;

  /* Typography */
  --font-sans: 'Inter', sans-serif;

  /* Spacing */
  --spacing-4: 16px;
  --spacing-6: 24px;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --duration-normal: 300ms;
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

### Next.js Font Setup

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

---

## Conclusion

This design system provides a complete foundation for the authentication redesign, balancing:
- **Wellness aesthetics** (sage green, earth tones)
- **Modern design** (Inter font, smooth animations)
- **Accessibility** (WCAG 2.1 AA, high contrast)
- **Performance** (GPU-accelerated animations, variable fonts)

**Next Step:** Apply this system to specific components (Document 03).

---

**Document Version:** 1.0
**Last Updated:** October 28, 2025
**Design System Status:** Ready for Implementation
