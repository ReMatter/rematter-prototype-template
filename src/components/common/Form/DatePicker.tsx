import {
  DatePicker as AriaDatePicker,
  DateInput,
  DateSegment,
  Button,
  Popover,
  Dialog,
  Calendar,
  CalendarGrid,
  CalendarCell,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  Heading,
  Group,
} from 'react-aria-components'
import { parseDate, CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import type { DatePickerProps } from './types'

// Calendar icon
const CalendarIcon = () => (
  <svg
    className="entity-drawer-datepicker-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

// Chevron icons for calendar navigation
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// Convert value (Date, string, or null) to CalendarDate
const valueToCalendarDate = (value: Date | string | null | undefined): CalendarDate | null => {
  if (!value) return null
  if (typeof value === 'string') {
    // Assume YYYY-MM-DD format
    try {
      return parseDate(value)
    } catch {
      return null
    }
  }
  // It's a Date object
  return parseDate(value.toISOString().split('T')[0])
}

// Convert CalendarDate to string (YYYY-MM-DD format)
const calendarDateToString = (calendarDate: CalendarDate | null): string | null => {
  if (!calendarDate) return null
  const year = calendarDate.year
  const month = String(calendarDate.month).padStart(2, '0')
  const day = String(calendarDate.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const DatePicker = ({
  value,
  onChange,
  placeholder: _placeholder = 'Select date',
  disabled,
  className = '',
  name,
}: DatePickerProps) => {
  void _placeholder // Placeholder not used in React Aria DatePicker
  const calendarValue = valueToCalendarDate(value)

  const handleChange = (date: CalendarDate | null) => {
    onChange?.(calendarDateToString(date))
  }

  return (
    <AriaDatePicker
      value={calendarValue}
      onChange={handleChange}
      isDisabled={disabled}
      name={name}
      className={className}
    >
      <Group className="entity-drawer-datepicker">
        <DateInput className="entity-drawer-datepicker-value">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="entity-drawer-date-segment"
            />
          )}
        </DateInput>
        <Button className="entity-drawer-datepicker-btn">
          <CalendarIcon />
        </Button>
      </Group>
      <Popover className="entity-drawer-calendar-popover">
        <Dialog className="entity-drawer-calendar-dialog">
          <Calendar defaultFocusedValue={today(getLocalTimeZone())}>
            <header className="entity-drawer-calendar-header">
              <Button slot="previous" className="entity-drawer-calendar-nav">
                <ChevronLeftIcon />
              </Button>
              <Heading className="entity-drawer-calendar-heading" />
              <Button slot="next" className="entity-drawer-calendar-nav">
                <ChevronRightIcon />
              </Button>
            </header>
            <CalendarGrid className="entity-drawer-calendar-grid">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="entity-drawer-calendar-header-cell">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="entity-drawer-calendar-cell"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  )
}
