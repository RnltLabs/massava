# Testing Guide: Studio Registration Feature

## Manual Testing Checklist

### Desktop (>= 768px)

#### Step 0: Welcome
- [ ] Dialog appears centered on screen
- [ ] Dialog max-width is 500px
- [ ] Close button (X) appears in top-right
- [ ] Icon with terracotta background is visible
- [ ] Title and subtitle are centered
- [ ] Three feature cards appear with animations (staggered)
- [ ] "Get Started" button is terracotta colored
- [ ] "Takes about 2-3 minutes" text appears
- [ ] Clicking "Get Started" advances to Step 1

#### Step 1: Basic Info
- [ ] Back button appears in header
- [ ] Progress indicator shows (3 dots, first active)
- [ ] Title "Studio Information" is visible
- [ ] Name input has proper label with asterisk
- [ ] Description textarea has proper label with asterisk
- [ ] Character counters show (0/100, 0/500)
- [ ] Typing updates character counters in real-time
- [ ] Name validation: less than 3 chars shows error on blur
- [ ] Description validation: less than 10 chars shows error on blur
- [ ] Character counter turns orange at 90% capacity
- [ ] "Continue" button is disabled when invalid
- [ ] "Continue" button is enabled when valid
- [ ] Clicking "Continue" advances to Step 2
- [ ] Clicking back button returns to Step 0

#### Step 2: Address
- [ ] Progress indicator shows (second dot active)
- [ ] All address fields visible
- [ ] Street Address has autocomplete="street-address"
- [ ] Address Line 2 is optional (no asterisk)
- [ ] State and Postal Code are side-by-side on desktop
- [ ] All required fields show asterisk
- [ ] Validation errors appear on blur
- [ ] "Continue" button disabled until all required fields valid
- [ ] Clicking "Continue" advances to Step 3
- [ ] Clicking back returns to Step 1 with data preserved

#### Step 3: Contact
- [ ] Progress indicator shows (third dot active)
- [ ] Phone input formats on blur: (555) 123-4567
- [ ] Email validates format
- [ ] Website is optional
- [ ] Website validates URL format if provided
- [ ] "Complete Registration" button shows
- [ ] Button shows loading spinner when submitting
- [ ] Submit errors appear below form
- [ ] On success, advances to Step 4

#### Step 4: Success
- [ ] No progress indicator visible
- [ ] Animated checkmark appears with spring animation
- [ ] Success message includes studio name
- [ ] "What's next?" section shows 2 cards
- [ ] "Add Your First Service" button (terracotta)
- [ ] "Go to Dashboard" button (outline)
- [ ] Close button still works

### Mobile (< 768px)

#### General
- [ ] Sheet appears from bottom (not dialog)
- [ ] Sheet has rounded top corners (rounded-t-3xl)
- [ ] Sheet is 95vh tall
- [ ] Content is scrollable
- [ ] Close button appears and works
- [ ] Sheet can be dismissed by swiping down (if supported)

#### Step Flow
- [ ] All steps render correctly on mobile
- [ ] State/Postal Code stack vertically on mobile
- [ ] Buttons are full-width
- [ ] Touch targets are at least 44x44px
- [ ] Keyboard doesn't overlap inputs (viewport adjusts)

### Accessibility

#### Keyboard Navigation
- [ ] Tab moves through all interactive elements
- [ ] Shift+Tab moves backward
- [ ] Enter submits forms/clicks buttons
- [ ] Escape closes dialog/sheet
- [ ] Focus is trapped within dialog

#### Screen Reader
- [ ] Hidden titles are announced (`sr-only`)
- [ ] Error messages have `role="alert"`
- [ ] Required fields are announced
- [ ] Progress indicator has proper aria attributes
- [ ] Form validation errors are announced

#### Visual
- [ ] All text has sufficient contrast (4.5:1 minimum)
- [ ] Focus indicators are visible
- [ ] Error states are not color-only (have text)
- [ ] Interactive elements have hover/focus states

### Error Handling

#### Validation Errors
- [ ] Name too short: "Studio name must be at least 3 characters"
- [ ] Description too short: "Description must be at least 10 characters"
- [ ] Invalid email: "Invalid email address"
- [ ] Invalid URL: "Invalid URL format"
- [ ] Phone too short: "Phone number must be at least 10 characters"

#### Server Errors
- [ ] Unauthorized: "Unauthorized. Please sign in to register a studio."
- [ ] Already owns studio: "You already have a registered studio."
- [ ] Duplicate: "A studio with this information already exists."
- [ ] Generic: "Failed to register studio. Please try again."

### Data Persistence

#### Within Session
- [ ] Going back preserves entered data
- [ ] Validation errors clear when changing steps
- [ ] Data persists when navigating forward/backward
- [ ] Closing dialog resets all data
- [ ] Reopening dialog starts fresh

### Animations

#### Framer Motion
- [ ] Step transitions slide left/right (0.3s)
- [ ] Welcome step features stagger in (0.1s delay each)
- [ ] Success checkmark springs in
- [ ] Progress dots animate smoothly
- [ ] No animation jank or flicker

### Responsive Behavior

#### Breakpoint Transitions
- [ ] Resizing from desktop to mobile switches to sheet
- [ ] Resizing from mobile to desktop switches to dialog
- [ ] State is preserved during resize
- [ ] No layout shift or content jump

## Automated Testing (Example)

```typescript
// __tests__/studio-registration/studio-registration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudioRegistrationDialog } from '../StudioRegistrationDialog';
import { registerStudio } from '@/app/actions/studio/registerStudio';

// Mock server action
jest.mock('@/app/actions/studio/registerStudio');

describe('StudioRegistrationDialog', () => {
  it('should render welcome step initially', () => {
    render(
      <StudioRegistrationDialog
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("Let's set up your studio profile")).toBeInTheDocument();
  });

  it('should validate basic info step', async () => {
    render(
      <StudioRegistrationDialog
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    // Click "Get Started"
    fireEvent.click(screen.getByText('Get Started'));

    // Try to continue without filling form
    const continueBtn = screen.getByText('Continue');
    expect(continueBtn).toBeDisabled();

    // Fill name (too short)
    const nameInput = screen.getByLabelText(/Studio Name/i);
    fireEvent.change(nameInput, { target: { value: 'ab' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument();
    });

    // Fill valid data
    fireEvent.change(nameInput, { target: { value: 'Test Studio' } });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description for the studio' }
    });

    await waitFor(() => {
      expect(continueBtn).not.toBeDisabled();
    });
  });

  it('should complete registration flow', async () => {
    const mockRegister = registerStudio as jest.MockedFunction<typeof registerStudio>;
    mockRegister.mockResolvedValue({
      success: true,
      studioId: 'test-studio-id',
    });

    const onSuccess = jest.fn();

    render(
      <StudioRegistrationDialog
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    // Step 0: Welcome
    fireEvent.click(screen.getByText('Get Started'));

    // Step 1: Basic Info
    fireEvent.change(screen.getByLabelText(/Studio Name/i), {
      target: { value: 'Test Studio' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description for the studio' }
    });
    fireEvent.click(screen.getByText('Continue'));

    // Step 2: Address
    fireEvent.change(screen.getByLabelText(/Street Address/i), {
      target: { value: '123 Main St' }
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'San Francisco' }
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'CA' }
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '94102' }
    });
    fireEvent.change(screen.getByLabelText(/Country/i), {
      target: { value: 'United States' }
    });
    fireEvent.click(screen.getByText('Continue'));

    // Step 3: Contact
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '5551234567' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@studio.com' }
    });
    fireEvent.click(screen.getByText('Complete Registration'));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Welcome to Massava/i)).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalledWith('test-studio-id');
  });
});
```

## Browser Testing

### Supported Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Chrome Mobile (latest)
- [ ] Safari iOS (latest)

### Features to Test Per Browser
- [ ] Dialog/Sheet positioning
- [ ] Input autofill
- [ ] Phone number formatting
- [ ] Framer Motion animations
- [ ] Focus trap
- [ ] Touch gestures (mobile)

## Performance Testing

### Metrics
- [ ] Initial render < 100ms
- [ ] Step transition < 300ms
- [ ] Form validation < 50ms
- [ ] Server action < 2s

### Tools
- Chrome DevTools Performance tab
- Lighthouse (Accessibility score > 95)
- React DevTools Profiler

## Database Verification

After successful registration:

```sql
-- Check Studio record
SELECT * FROM "studios" WHERE id = 'studio-id';

-- Check StudioOwnership
SELECT * FROM "studio_ownership" WHERE "studioId" = 'studio-id';

-- Check User role
SELECT * FROM "user_role_assignments" WHERE "userId" = 'user-id' AND role = 'STUDIO_OWNER';
```

## Common Issues & Solutions

### Issue: Dialog doesn't close
**Solution**: Ensure `onClose` prop is provided and called correctly

### Issue: Data doesn't persist between steps
**Solution**: Check Context Provider wraps all steps

### Issue: Validation errors don't show
**Solution**: Ensure field is marked as `touched` before showing errors

### Issue: Server action fails
**Solution**: Check user authentication and Prisma schema matches

### Issue: Mobile sheet doesn't appear
**Solution**: Verify `useMediaQuery` hook is working correctly

## Test Data

### Valid Studio Data
```typescript
{
  name: "Serenity Wellness Studio",
  description: "A peaceful sanctuary for holistic wellness and rejuvenation",
  address: {
    street: "123 Zen Lane",
    line2: "Suite 100",
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    country: "United States"
  },
  contact: {
    phone: "(555) 123-4567",
    email: "contact@serenity.com",
    website: "https://www.serenity.com"
  }
}
```

### Invalid Data (for error testing)
```typescript
{
  name: "ab",  // Too short
  description: "short",  // Too short
  address: {
    street: "123",  // Too short
    city: "A",  // Too short
    // ... etc
  },
  contact: {
    phone: "123",  // Too short
    email: "invalid-email",  // Invalid format
    website: "not-a-url"  // Invalid format
  }
}
```
