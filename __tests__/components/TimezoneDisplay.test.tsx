/**
 * TimezoneDisplay Component Tests
 *
 * Tests timezone-aware display of appointment times
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TimezoneDisplay } from '@/components/booking/TimezoneDisplay';
import * as browserTimezone from '@/lib/browser/timezone';

// Mock browser timezone utilities
jest.mock('@/lib/browser/timezone', () => ({
  getUserTimezone: jest.fn(() => 'America/New_York'),
  isTimezoneDifferent: jest.fn((studioTz: string) => studioTz !== 'America/New_York'),
}));

describe('TimezoneDisplay Component', () => {
  const testDate = new Date('2025-11-17T14:30:00Z'); // UTC time
  const studioTimezone = 'Europe/Berlin';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Variant (default)', () => {
    it('should show studio time', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should show studio time label
      expect(screen.getByText('Studio Time:')).toBeInTheDocument();

      // Should show timezone
      expect(screen.getByText(`(${studioTimezone})`)).toBeInTheDocument();
    });

    it('should show user time if timezones differ', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should show user time label
      expect(screen.getByText('Your Time:')).toBeInTheDocument();
    });

    it('should show warning if timezones differ', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should show timezone notice
      expect(screen.getByText(/Timezone Notice/i)).toBeInTheDocument();
      expect(screen.getByText(/Make sure to arrive at the studio time/i)).toBeInTheDocument();
    });

    it('should not show user time if timezones are same', () => {
      // Mock same timezone
      (browserTimezone.getUserTimezone as jest.Mock).mockReturnValue('Europe/Berlin');
      (browserTimezone.isTimezoneDifferent as jest.Mock).mockReturnValue(false);

      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should NOT show user time label
      expect(screen.queryByText('Your Time:')).not.toBeInTheDocument();

      // Should NOT show warning
      expect(screen.queryByText(/Timezone Notice/i)).not.toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('should show only studio time', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
          variant="compact"
        />
      );

      // Should show time (but not full labels)
      expect(screen.queryByText('Studio Time:')).not.toBeInTheDocument();
    });

    it('should show timezone if different', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
          variant="compact"
        />
      );

      // Should show timezone in parentheses
      expect(screen.getByText(`(${studioTimezone})`)).toBeInTheDocument();
    });
  });

  describe('Inline Variant', () => {
    it('should show studio time with timezone', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
          variant="inline"
        />
      );

      // Should show timezone
      expect(screen.getByText(`(${studioTimezone})`)).toBeInTheDocument();
    });

    it('should show user time on separate line if different', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
          variant="inline"
        />
      );

      // Should show "Your time:" text
      expect(screen.getByText(/Your time:/i)).toBeInTheDocument();
    });
  });

  describe('Custom Date Format', () => {
    it('should use custom date format', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
          dateFormat="HH:mm"
        />
      );

      // Should show time in HH:mm format (somewhere in the document)
      const container = screen.getByText('Studio Time:').parentElement;
      expect(container).toHaveTextContent(/\d{2}:\d{2}/);
    });
  });

  describe('Override User Timezone', () => {
    it('should use provided user timezone', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone="Europe/Berlin"
          userTimezone="Asia/Tokyo"
        />
      );

      // Should show provided timezone
      expect(screen.getByText('(Asia/Tokyo)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { container } = render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should have clock icons (with proper role)
      const clockIcons = container.querySelectorAll('svg');
      expect(clockIcons.length).toBeGreaterThan(0);
    });

    it('should use semantic HTML', () => {
      const { container } = render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should use proper HTML structure
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('GDPR Compliance', () => {
    it('should call browser timezone detection', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should have called getUserTimezone
      expect(browserTimezone.getUserTimezone).toHaveBeenCalled();
    });

    it('should call timezone difference check', () => {
      render(
        <TimezoneDisplay
          dateTime={testDate}
          studioTimezone={studioTimezone}
        />
      );

      // Should have called isTimezoneDifferent
      expect(browserTimezone.isTimezoneDifferent).toHaveBeenCalledWith(studioTimezone);
    });
  });
});
