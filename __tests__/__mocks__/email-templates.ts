/**
 * Mock for email templates
 * Used in Jest tests to avoid JSX parsing issues
 */

export const EmailVerificationTemplate = jest.fn(() => 'Email Verification Template');
export const WelcomeEmailTemplate = jest.fn(() => 'Welcome Email Template');
export const PasswordResetTemplate = jest.fn(() => 'Password Reset Template');
export const BookingRequestReceivedTemplate = jest.fn(() => 'Booking Request Received Template');
export const BookingConfirmationTemplate = jest.fn(() => 'Booking Confirmation Template');
export const BookingCancellationTemplate = jest.fn(() => 'Booking Cancellation Template');

export const getPlainTextVerification = jest.fn((url: string, locale: string) =>
  `Verify your email: ${url}`
);
export const getPlainTextWelcome = jest.fn((name: string, locale: string) =>
  `Welcome ${name}!`
);
export const getPlainTextPasswordReset = jest.fn((url: string, locale: string) =>
  `Reset your password: ${url}`
);
export const getPlainTextBookingRequestReceived = jest.fn(() =>
  'Your booking request has been received'
);
export const getPlainTextBookingConfirmation = jest.fn(() =>
  'Your booking has been confirmed'
);
export const getPlainTextBookingCancellation = jest.fn(() =>
  'Your booking has been cancelled'
);
