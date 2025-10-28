'use client'

import { useState } from 'react'
import { format, addDays, setHours, setMinutes } from 'date-fns'
import { de, enUS, th } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, X, ChevronLeft, Sun, Moon, Sunrise, Calendar as CalendarGridIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTranslations } from 'next-intl'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  placeholder?: string
  disabled?: boolean
  className?: string
}

type DateTimeStep = 'date' | 'time'
type TimeSlot = 'any' | 'morning' | 'afternoon' | 'evening'
type QuickDateOption = 'any' | 'today' | 'tomorrow'

export function DateTimePicker({
  value,
  onChange,
  minDate = new Date(),
  placeholder,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DateTimeStep>('date')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('any')

  const isMobile = useMediaQuery('(max-width: 768px)')
  const t = useTranslations('dateTimePicker')

  // Get current locale for date-fns (assumes locale is in pathname)
  const currentLocale = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[1]
    : 'de'
  const locale = currentLocale === 'th' ? th : currentLocale === 'en' ? enUS : de

  // Get time range for a time slot
  const getTimeForSlot = (date: Date, slot: TimeSlot): Date => {
    switch (slot) {
      case 'morning':
        return setHours(setMinutes(date, 0), 9) // 09:00
      case 'afternoon':
        return setHours(setMinutes(date, 0), 14) // 14:00
      case 'evening':
        return setHours(setMinutes(date, 0), 19) // 19:00
      default:
        return setHours(setMinutes(date, 0), 12) // 12:00 for "any"
    }
  }

  // Handle quick date selection (Any, Today, Tomorrow)
  const handleQuickDate = (option: QuickDateOption) => {
    let date: Date | undefined

    switch (option) {
      case 'today':
        date = new Date()
        break
      case 'tomorrow':
        date = addDays(new Date(), 1)
        break
      case 'any':
        date = undefined
        break
    }

    setSelectedDate(date)

    // If "any date" selected, complete immediately
    if (option === 'any') {
      onChange(undefined)
      setOpen(false)
      setStep('date')
      return
    }

    // Move to time selection
    setStep('time')
  }

  // Handle custom date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setStep('time')
    }
  }

  // Handle time slot selection
  const handleTimeSlot = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot)
  }

  // Handle "Done" button
  const handleDone = () => {
    if (selectedDate) {
      const finalDate = getTimeForSlot(selectedDate, selectedTimeSlot)
      onChange(finalDate)
    }
    setOpen(false)
    setStep('date')
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
    setSelectedDate(undefined)
    setSelectedTimeSlot('any')
    setStep('date')
  }

  // Handle back button
  const handleBack = () => {
    setStep('date')
  }

  // Format date-time for display
  const formatDateTime = (date: Date): string => {
    return format(date, 'EEE, d. MMM yyyy, HH:mm', { locale })
  }

  // Format date for quick options
  const formatQuickDate = (date: Date): string => {
    return format(date, 'EEEE, d. MMMM', { locale })
  }

  // Render date selection step
  const renderDateSelection = () => (
    <div className="space-y-4">
      {/* Quick Date Options */}
      <div className="grid gap-2">
        <Button
          variant="outline"
          className="justify-start h-auto py-4 hover:bg-accent"
          onClick={() => handleQuickDate('any')}
        >
          <div className="flex items-center gap-3">
            <CalendarGridIcon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-semibold">{t('anyDate')}</div>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-4 hover:bg-accent"
          onClick={() => handleQuickDate('today')}
        >
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5 text-amber-500" />
            <div className="text-left">
              <div className="font-semibold">{t('today')}</div>
              <div className="text-sm text-muted-foreground">
                {formatQuickDate(new Date())}
              </div>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-4 hover:bg-accent"
          onClick={() => handleQuickDate('tomorrow')}
        >
          <div className="flex items-center gap-3">
            <Sunrise className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-semibold">{t('tomorrow')}</div>
              <div className="text-sm text-muted-foreground">
                {formatQuickDate(addDays(new Date(), 1))}
              </div>
            </div>
          </div>
        </Button>
      </div>

      <Separator />

      {/* Calendar */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">
          {t('orChooseDate')}
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          locale={locale}
          className="rounded-lg border"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "[&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md"
            ),
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              "hover:bg-accent hover:text-accent-foreground",
              "rounded-md transition-colors"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
        />
      </div>
    </div>
  )

  // Render time selection step
  const renderTimeSelection = () => (
    <div className="space-y-4">
      {/* Back Button and Selected Date */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('back')}
        </Button>
      </div>

      {selectedDate && (
        <div className="px-4 py-3 bg-accent/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">
            {t('selected')}
          </div>
          <div className="font-medium">
            {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale })}
          </div>
        </div>
      )}

      <Separator />

      {/* Time Slot Options */}
      <div className="grid gap-2">
        <Button
          variant={selectedTimeSlot === 'morning' ? 'default' : 'outline'}
          className="justify-start h-auto py-4 transition-all"
          onClick={() => handleTimeSlot('morning')}
        >
          <div className="flex items-center gap-3">
            <Sunrise className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">{t('morning')}</div>
              <div className={cn(
                "text-sm",
                selectedTimeSlot === 'morning' ? "opacity-90" : "text-muted-foreground"
              )}>
                {t('timeRange.morning')}
              </div>
            </div>
          </div>
        </Button>

        <Button
          variant={selectedTimeSlot === 'afternoon' ? 'default' : 'outline'}
          className="justify-start h-auto py-4 transition-all"
          onClick={() => handleTimeSlot('afternoon')}
        >
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">{t('afternoon')}</div>
              <div className={cn(
                "text-sm",
                selectedTimeSlot === 'afternoon' ? "opacity-90" : "text-muted-foreground"
              )}>
                {t('timeRange.afternoon')}
              </div>
            </div>
          </div>
        </Button>

        <Button
          variant={selectedTimeSlot === 'evening' ? 'default' : 'outline'}
          className="justify-start h-auto py-4 transition-all"
          onClick={() => handleTimeSlot('evening')}
        >
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">{t('evening')}</div>
              <div className={cn(
                "text-sm",
                selectedTimeSlot === 'evening' ? "opacity-90" : "text-muted-foreground"
              )}>
                {t('timeRange.evening')}
              </div>
            </div>
          </div>
        </Button>
      </div>

      {/* Done Button */}
      <div className="pt-4">
        <Button
          className="w-full"
          size="lg"
          onClick={handleDone}
          disabled={!selectedDate}
        >
          {t('done')}
        </Button>
      </div>
    </div>
  )

  // Render trigger (input-like button)
  const renderTrigger = () => (
    <div
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 border rounded-lg bg-background",
        "cursor-pointer transition-colors",
        "hover:bg-accent hover:border-accent-foreground/20",
        disabled && "opacity-50 cursor-not-allowed hover:bg-background",
        className
      )}
      onClick={() => !disabled && setOpen(true)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={placeholder || t('placeholder')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          !disabled && setOpen(true)
        }
      }}
    >
      <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <span className={cn(
        "flex-1 text-left",
        !value && "text-muted-foreground"
      )}>
        {value ? formatDateTime(value) : (placeholder || t('placeholder'))}
      </span>
      {value && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-accent-foreground/10 flex-shrink-0"
          onClick={handleClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  // Mobile: Sheet
  if (isMobile) {
    return (
      <>
        {renderTrigger()}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className={cn(
              "h-[85vh] rounded-t-2xl p-0",
              "flex flex-col"
            )}
          >
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>
                {step === 'date' ? t('selectDate') : t('selectTime')}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === 'date' ? renderDateSelection() : renderTimeSelection()}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {renderTrigger()}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={8}
      >
        <div className="p-6 space-y-4 max-w-[420px]">
          {step === 'date' ? (
            <>
              {renderDateSelection()}
            </>
          ) : (
            <>
              {renderTimeSelection()}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
