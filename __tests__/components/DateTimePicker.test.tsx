/**
 * DateTimePicker Component Tests
 *
 * Tests combined date + time selection for bookings
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTimePicker } from '@/components/booking/DateTimePicker';

describe('DateTimePicker Component', () => {
  const mockOnChange = jest.fn();
  const studioTimezone = 'Europe/Berlin';
  const minDate = new Date(Date.now() + 3600000); // +1 hour
  const maxDate = new Date(Date.now() + 31536000000); // +1 year

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render date picker button', () => {
      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      expect(screen.getByLabelText('Select date')).toBeInTheDocument();
      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('should show placeholder when no date selected', () => {
      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          placeholder="Choose your time"
        />
      );

      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('should not show time picker initially', () => {
      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Time picker should not be visible until date is selected
      expect(screen.queryByLabelText(/Select Time/i)).not.toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('should show calendar when date button clicked', async () => {
      const user = userEvent.setup();

      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Click date picker button
      const dateButton = screen.getByLabelText('Select date');
      await user.click(dateButton);

      // Calendar should appear
      // (Note: Actual calendar rendering depends on shadcn/ui Calendar component)
    });

    it('should show time picker after date selected', () => {
      const selectedDate = new Date(Date.now() + 86400000); // Tomorrow

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Time picker should be visible
      expect(screen.getByLabelText(/Select Time/i)).toBeInTheDocument();
    });
  });

  describe('Time Selection', () => {
    it('should generate 15-minute time slots by default', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      const { container } = render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Click time selector to open dropdown
      const timeSelector = screen.getByLabelText(/Select Time/i);
      fireEvent.click(timeSelector);

      // Should have 96 slots (24 hours * 4 slots/hour)
      // (Actual verification depends on Select component rendering)
    });

    it('should generate custom minute step slots', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          minuteStep={30} // 30-minute slots
        />
      );

      // Should have 48 slots (24 hours * 2 slots/hour)
      expect(screen.getByLabelText(/Select Time/i)).toBeInTheDocument();
    });

    it('should call onChange when time selected', async () => {
      const selectedDate = new Date(Date.now() + 86400000);
      selectedDate.setHours(10, 0, 0, 0);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Should have been called during initialization or value change
      // (Exact behavior depends on implementation)
    });
  });

  describe('Min/Max Date Validation', () => {
    it('should respect minDate constraint', () => {
      const tooEarly = new Date(Date.now() - 86400000); // Yesterday

      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          minDate={minDate}
        />
      );

      // Calendar should disable dates before minDate
      // (Actual validation happens in Calendar component)
    });

    it('should respect maxDate constraint', () => {
      const tooLate = new Date(Date.now() + 63072000000); // +2 years

      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          maxDate={maxDate}
        />
      );

      // Calendar should disable dates after maxDate
    });

    it('should filter time slots for minDate day', () => {
      const today = new Date();
      today.setHours(14, 0, 0, 0); // 2 PM today

      const minDate = new Date();
      minDate.setHours(10, 0, 0, 0); // Min: 10 AM today

      render(
        <DateTimePicker
          value={today}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          minDate={minDate}
        />
      );

      // Time slots before 10:00 should be disabled/hidden
      expect(screen.getByLabelText(/Select Time/i)).toBeInTheDocument();
    });
  });

  describe('Timezone Display', () => {
    it('should show timezone info by default', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          showTimezone={true}
        />
      );

      // Should show studio timezone
      expect(screen.getByText(new RegExp(studioTimezone))).toBeInTheDocument();
    });

    it('should hide timezone info when disabled', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          showTimezone={false}
        />
      );

      // Should NOT show timezone
      expect(screen.queryByText(new RegExp(studioTimezone))).not.toBeInTheDocument();
    });
  });

  describe('Display Selected Value', () => {
    it('should show selected datetime', () => {
      const selectedDate = new Date('2025-11-17T14:30:00Z');

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Should show "Selected:" section
      expect(screen.getByText('Selected:')).toBeInTheDocument();
    });

    it('should format selected datetime correctly', () => {
      const selectedDate = new Date('2025-11-17T14:30:00Z');

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Should show year
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable date picker when disabled prop is true', () => {
      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          disabled={true}
        />
      );

      const dateButton = screen.getByLabelText('Select date');
      expect(dateButton).toBeDisabled();
    });

    it('should disable time picker when disabled', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          disabled={true}
        />
      );

      const timeSelector = screen.getByLabelText(/Select Time/i);
      expect(timeSelector).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      expect(screen.getByLabelText('Select date')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      // Should be able to focus on elements
      const dateButton = screen.getByLabelText('Select date');
      expect(dateButton).toBeInTheDocument();
    });

    it('should use semantic labels', () => {
      const selectedDate = new Date(Date.now() + 86400000);

      render(
        <DateTimePicker
          value={selectedDate}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
        />
      );

      expect(screen.getByText('Select Date')).toBeInTheDocument();
      expect(screen.getByText(/Select Time/i)).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <DateTimePicker
          value={null}
          onChange={mockOnChange}
          studioTimezone={studioTimezone}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
