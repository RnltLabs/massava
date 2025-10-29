/**
 * DateTimePicker Component - Usage Examples
 *
 * This file demonstrates various use cases for the DateTimePicker component.
 * DO NOT import this file in production code - it's for reference only.
 */

'use client'

import { useState } from 'react'
import { DateTimePicker } from './date-time-picker'
import { addDays } from 'date-fns'

// Example 1: Basic Usage
export function BasicExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <div className="w-full max-w-md">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        placeholder="Select date and time"
      />
    </div>
  )
}

// Example 2: With Minimum Date (No Past Dates)
export function MinDateExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <div className="w-full max-w-md">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        minDate={new Date()} // Today is minimum
        placeholder="Select future date"
      />
    </div>
  )
}

// Example 3: With Minimum Date (Start from Tomorrow)
export function TomorrowMinExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <div className="w-full max-w-md">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        minDate={addDays(new Date(), 1)} // Tomorrow is minimum
        placeholder="Select from tomorrow onwards"
      />
    </div>
  )
}

// Example 4: Disabled State
export function DisabledExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>(new Date())

  return (
    <div className="w-full max-w-md">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        disabled={true}
        placeholder="Disabled picker"
      />
    </div>
  )
}

// Example 5: In a Form
export function FormExample() {
  const [formData, setFormData] = useState({
    dateTime: undefined as Date | undefined,
    location: '',
    treatment: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">
          Appointment Date & Time
        </label>
        <DateTimePicker
          value={formData.dateTime}
          onChange={(date) => setFormData({ ...formData, dateTime: date })}
          placeholder="When would you like to book?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Enter location"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Treatment
        </label>
        <input
          type="text"
          value={formData.treatment}
          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Select treatment"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg"
      >
        Search Appointments
      </button>
    </form>
  )
}

// Example 6: With Custom Styling
export function CustomStyledExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <div className="w-full max-w-md">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        className="shadow-lg border-2 border-primary/20 hover:border-primary/40"
        placeholder="Custom styled picker"
      />
    </div>
  )
}

// Example 7: Controlled with Reset
export function ControlledWithResetExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  const handleReset = () => {
    setDateTime(undefined)
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        placeholder="Select date and time"
      />

      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 border rounded-lg hover:bg-accent"
        >
          Reset
        </button>
        <button
          onClick={() => setDateTime(new Date())}
          className="px-4 py-2 border rounded-lg hover:bg-accent"
        >
          Set to Now
        </button>
        <button
          onClick={() => setDateTime(addDays(new Date(), 1))}
          className="px-4 py-2 border rounded-lg hover:bg-accent"
        >
          Set to Tomorrow
        </button>
      </div>

      {dateTime && (
        <div className="p-4 bg-accent rounded-lg">
          <p className="text-sm text-muted-foreground">Selected:</p>
          <p className="font-medium">{dateTime.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

// Example 8: Integration with SearchWidget
export function SearchWidgetIntegration() {
  const [searchParams, setSearchParams] = useState({
    dateTime: undefined as Date | undefined,
    location: '',
    treatment: '',
  })

  const handleSearch = () => {
    console.log('Searching with params:', searchParams)
    // Perform search logic here
  }

  return (
    <div className="w-full max-w-4xl p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Find Your Wellness Treatment</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Location
          </label>
          <input
            type="text"
            value={searchParams.location}
            onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            placeholder="Enter location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Treatment
          </label>
          <input
            type="text"
            value={searchParams.treatment}
            onChange={(e) => setSearchParams({ ...searchParams, treatment: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            placeholder="Select treatment"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Date & Time
          </label>
          <DateTimePicker
            value={searchParams.dateTime}
            onChange={(date) => setSearchParams({ ...searchParams, dateTime: date })}
            minDate={new Date()}
            placeholder="Select date and time"
          />
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
      >
        Search Treatments
      </button>
    </div>
  )
}

// Example 9: With Validation
export function ValidationExample() {
  const [dateTime, setDateTime] = useState<Date | undefined>()
  const [error, setError] = useState<string | undefined>()

  const handleChange = (date: Date | undefined) => {
    setDateTime(date)

    // Custom validation
    if (date) {
      const now = new Date()
      const minBookingTime = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now

      if (date < minBookingTime) {
        setError('Please select a time at least 2 hours from now')
      } else {
        setError(undefined)
      }
    } else {
      setError(undefined)
    }
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <DateTimePicker
        value={dateTime}
        onChange={handleChange}
        minDate={new Date()}
        placeholder="Select date and time"
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

// Example 10: Multiple Pickers
export function MultiplePickersExample() {
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Start Date & Time
        </label>
        <DateTimePicker
          value={startDate}
          onChange={setStartDate}
          minDate={new Date()}
          placeholder="Select start date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          End Date & Time
        </label>
        <DateTimePicker
          value={endDate}
          onChange={setEndDate}
          minDate={startDate || new Date()}
          placeholder="Select end date"
          disabled={!startDate}
        />
      </div>

      {startDate && endDate && (
        <div className="p-4 bg-accent rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Duration:</p>
          <p className="font-medium">
            {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
          </p>
        </div>
      )}
    </div>
  )
}
