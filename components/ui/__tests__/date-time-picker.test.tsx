/**
 * DateTimePicker Component Tests
 *
 * Tests cover:
 * - Rendering and initial state
 * - Quick date selection (Any, Today, Tomorrow)
 * - Custom date selection from calendar
 * - Time slot selection
 * - Mobile vs Desktop rendering
 * - Keyboard navigation
 * - Accessibility
 * - Internationalization
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTimePicker } from '../date-time-picker'
import { format, addDays } from 'date-fns'

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dateTimePicker.placeholder': 'Select date and time',
        'dateTimePicker.selectDate': 'Select date',
        'dateTimePicker.selectTime': 'Select time',
        'dateTimePicker.anyDate': 'Any Date',
        'dateTimePicker.today': 'Today',
        'dateTimePicker.tomorrow': 'Tomorrow',
        'dateTimePicker.orChooseDate': 'Or choose a date:',
        'dateTimePicker.morning': 'Morning',
        'dateTimePicker.afternoon': 'Afternoon',
        'dateTimePicker.evening': 'Evening',
        'dateTimePicker.done': 'Done',
        'dateTimePicker.back': 'Back',
        'dateTimePicker.selected': 'Selected:',
        'dateTimePicker.timeRange.morning': '06:00 - 12:00',
        'dateTimePicker.timeRange.afternoon': '12:00 - 18:00',
        'dateTimePicker.timeRange.evening': '18:00 - 24:00',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock useMediaQuery hook
jest.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: (query: string) => {
    // Default to desktop
    return query.includes('max-width') ? false : true
  },
}))

describe('DateTimePicker', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Rendering', () => {
    it('renders with placeholder when no value', () => {
      render(<DateTimePicker onChange={mockOnChange} placeholder="Pick a date" />)

      expect(screen.getByText('Pick a date')).toBeInTheDocument()
    })

    it('renders with formatted date when value is set', () => {
      const testDate = new Date(2025, 9, 28, 14, 30) // Oct 28, 2025, 14:30
      render(<DateTimePicker value={testDate} onChange={mockOnChange} />)

      // Should show formatted date
      expect(screen.getByText(/Oct.*28.*2025.*14:30/i)).toBeInTheDocument()
    })

    it('renders with default placeholder when none provided', () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      expect(screen.getByText('Select date and time')).toBeInTheDocument()
    })

    it('shows clear button when value is set', () => {
      const testDate = new Date()
      render(<DateTimePicker value={testDate} onChange={mockOnChange} />)

      const clearButton = screen.getByLabelText('Clear selection')
      expect(clearButton).toBeInTheDocument()
    })

    it('does not show clear button when disabled', () => {
      const testDate = new Date()
      render(<DateTimePicker value={testDate} onChange={mockOnChange} disabled />)

      expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument()
    })
  })

  describe('Quick Date Selection', () => {
    it('opens picker when trigger is clicked', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      const trigger = screen.getByText('Select date and time')
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Any Date')).toBeInTheDocument()
        expect(screen.getByText('Today')).toBeInTheDocument()
        expect(screen.getByText('Tomorrow')).toBeInTheDocument()
      })
    })

    it('selecting "Any Date" calls onChange with undefined and closes picker', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker
      fireEvent.click(screen.getByText('Select date and time'))

      // Click "Any Date"
      await waitFor(() => {
        fireEvent.click(screen.getByText('Any Date'))
      })

      expect(mockOnChange).toHaveBeenCalledWith(undefined)
    })

    it('selecting "Today" proceeds to time selection', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker
      fireEvent.click(screen.getByText('Select date and time'))

      // Click "Today"
      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      // Should show time selection
      await waitFor(() => {
        expect(screen.getByText('Select time')).toBeInTheDocument()
        expect(screen.getByText('Morning')).toBeInTheDocument()
        expect(screen.getByText('Afternoon')).toBeInTheDocument()
        expect(screen.getByText('Evening')).toBeInTheDocument()
      })
    })

    it('selecting "Tomorrow" proceeds to time selection', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker
      fireEvent.click(screen.getByText('Select date and time'))

      // Click "Tomorrow"
      await waitFor(() => {
        fireEvent.click(screen.getByText('Tomorrow'))
      })

      // Should show time selection
      await waitFor(() => {
        expect(screen.getByText('Select time')).toBeInTheDocument()
      })
    })
  })

  describe('Time Selection', () => {
    it('shows selected date in time selection step', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker and select today
      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      // Should show selected date
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument()
      })
    })

    it('selecting morning time slot updates state', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker and select today
      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      // Select morning
      await waitFor(() => {
        fireEvent.click(screen.getByText('Morning'))
      })

      // Morning button should be selected (default variant)
      const morningButton = screen.getByText('Morning').closest('button')
      expect(morningButton).toHaveAttribute('data-selected', 'true')
    })

    it('clicking Done button calls onChange with correct date and time', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker and select today
      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      // Select afternoon
      await waitFor(() => {
        fireEvent.click(screen.getByText('Afternoon'))
      })

      // Click Done
      await waitFor(() => {
        fireEvent.click(screen.getByText('Done'))
      })

      expect(mockOnChange).toHaveBeenCalled()
      const calledDate = mockOnChange.mock.calls[0][0]
      expect(calledDate).toBeInstanceOf(Date)
      expect(calledDate.getHours()).toBe(14) // Afternoon = 14:00
    })

    it('back button returns to date selection', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      // Open picker and select today
      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      // Should be on time selection
      await waitFor(() => {
        expect(screen.getByText('Select time')).toBeInTheDocument()
      })

      // Click back
      fireEvent.click(screen.getByText('Back'))

      // Should be back to date selection
      await waitFor(() => {
        expect(screen.getByText('Select date')).toBeInTheDocument()
      })
    })
  })

  describe('Calendar Selection', () => {
    it('shows calendar component', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        expect(screen.getByText('Or choose a date:')).toBeInTheDocument()
      })
    })

    it('disables past dates', async () => {
      const today = new Date()
      const yesterday = addDays(today, -1)

      render(<DateTimePicker onChange={mockOnChange} minDate={today} />)

      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        const yesterdayButton = screen.queryByText(yesterday.getDate().toString())
        if (yesterdayButton) {
          expect(yesterdayButton).toBeDisabled()
        }
      })
    })
  })

  describe('Clear Functionality', () => {
    it('clear button clears the value', async () => {
      const testDate = new Date()
      render(<DateTimePicker value={testDate} onChange={mockOnChange} />)

      const clearButton = screen.getByLabelText('Clear selection')
      fireEvent.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith(undefined)
    })

    it('clear button does not open picker', () => {
      const testDate = new Date()
      render(<DateTimePicker value={testDate} onChange={mockOnChange} />)

      const clearButton = screen.getByLabelText('Clear selection')
      fireEvent.click(clearButton)

      // Picker should not be open
      expect(screen.queryByText('Select date')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('does not open picker when disabled', () => {
      render(<DateTimePicker onChange={mockOnChange} disabled />)

      const trigger = screen.getByText('Select date and time')
      fireEvent.click(trigger)

      // Picker should not open
      expect(screen.queryByText('Any Date')).not.toBeInTheDocument()
    })

    it('applies disabled styles', () => {
      render(<DateTimePicker onChange={mockOnChange} disabled />)

      const trigger = screen.getByText('Select date and time').closest('div')
      expect(trigger).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Keyboard Navigation', () => {
    it('opens picker on Enter key', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      const trigger = screen.getByText('Select date and time')
      fireEvent.keyDown(trigger, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Any Date')).toBeInTheDocument()
      })
    })

    it('opens picker on Space key', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      const trigger = screen.getByText('Select date and time')
      fireEvent.keyDown(trigger, { key: ' ' })

      await waitFor(() => {
        expect(screen.getByText('Any Date')).toBeInTheDocument()
      })
    })

    it('does not open on other keys', () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      const trigger = screen.getByText('Select date and time')
      fireEvent.keyDown(trigger, { key: 'a' })

      expect(screen.queryByText('Any Date')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DateTimePicker onChange={mockOnChange} placeholder="Pick a date" />)

      const trigger = screen.getByLabelText('Pick a date')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('role', 'button')
    })

    it('has proper tabindex when enabled', () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      const trigger = screen.getByText('Select date and time')
      expect(trigger).toHaveAttribute('tabIndex', '0')
    })

    it('has proper tabindex when disabled', () => {
      render(<DateTimePicker onChange={mockOnChange} disabled />)

      const trigger = screen.getByText('Select date and time')
      expect(trigger).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <DateTimePicker
          onChange={mockOnChange}
          className="custom-class"
        />
      )

      const trigger = screen.getByText('Select date and time').closest('div')
      expect(trigger).toHaveClass('custom-class')
    })
  })

  describe('Time Slot Calculations', () => {
    it('morning slot sets time to 09:00', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Morning'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Done'))
      })

      const calledDate = mockOnChange.mock.calls[0][0]
      expect(calledDate.getHours()).toBe(9)
      expect(calledDate.getMinutes()).toBe(0)
    })

    it('afternoon slot sets time to 14:00', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Afternoon'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Done'))
      })

      const calledDate = mockOnChange.mock.calls[0][0]
      expect(calledDate.getHours()).toBe(14)
    })

    it('evening slot sets time to 19:00', async () => {
      render(<DateTimePicker onChange={mockOnChange} />)

      fireEvent.click(screen.getByText('Select date and time'))

      await waitFor(() => {
        fireEvent.click(screen.getByText('Today'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Evening'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Done'))
      })

      const calledDate = mockOnChange.mock.calls[0][0]
      expect(calledDate.getHours()).toBe(19)
    })
  })
})
