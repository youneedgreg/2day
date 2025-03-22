"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CalendarProps = {
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  selected?: Date | Date[] | undefined
  month?: Date
  onMonthChange?: (date: Date) => void
  onSelect?: (date: Date) => void
  disabled?: { from?: Date; to?: Date } | ((date: Date) => boolean)
  locale?: string
  mode?: "default" | "range" | "multiple"
  numberOfMonths?: number
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  month: propMonth,
  onMonthChange,
  onSelect,
  disabled,
  locale = "en-US",
  numberOfMonths = 1,
  ...props
}: CalendarProps) {
  // State for current month displayed
  const [month, setMonth] = React.useState(() => {
    return propMonth || (selected instanceof Date ? selected : new Date())
  })

  // Update month when prop changes
  React.useEffect(() => {
    if (propMonth) {
      setMonth(propMonth)
    }
  }, [propMonth])

  // Helper functions for date calculations
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSameMonth = (date: Date, baseDate: Date) => {
    return (
      date.getMonth() === baseDate.getMonth() &&
      date.getFullYear() === baseDate.getFullYear()
    )
  }

  const isSameDay = (date: Date, baseDate: Date) => {
    return (
      date.getDate() === baseDate.getDate() &&
      date.getMonth() === baseDate.getMonth() &&
      date.getFullYear() === baseDate.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    if (Array.isArray(selected)) {
      return selected.some((selectedDate) => isSameDay(date, selectedDate))
    }
    return isSameDay(date, selected)
  }

  const isDisabled = (date: Date) => {
    if (!disabled) return false
    if (typeof disabled === "function") {
      return disabled(date)
    }
    const { from, to } = disabled
    if (from && date < from) return true
    if (to && date > to) return true
    return false
  }

  // Navigation functions
  const handlePreviousMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return
    onSelect?.(date)
  }

  // Days for the grid
  const createCalendarGrid = (baseMonth: Date) => {
    const daysInMonth = getDaysInMonth(baseMonth)
    const firstDayOfMonth = getFirstDayOfMonth(baseMonth)
    const days: Date[] = []

    // Add days from previous month
    const prevMonth = new Date(baseMonth)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const daysInPrevMonth = getDaysInMonth(prevMonth)
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDate = new Date(prevMonth)
      prevDate.setDate(daysInPrevMonth - i)
      days.push(prevDate)
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(baseMonth)
      date.setDate(i)
      days.push(date)
    }

    // Add days from next month to fill the grid (6 rows of 7 days = 42 cells)
    const totalDaysNeeded = 42
    const nextMonth = new Date(baseMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    for (let i = 1; days.length < totalDaysNeeded; i++) {
      const nextDate = new Date(nextMonth)
      nextDate.setDate(i)
      days.push(nextDate)
    }

    return days
  }

  const renderMonthGrid = (calendarMonth: Date) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const days = createCalendarGrid(calendarMonth)

    return (
      <div className={cn("flex flex-col gap-4", classNames?.month)}>
        {/* Calendar header */}
        <div className={cn("flex justify-center pt-1 relative items-center w-full", classNames?.calendarHeader)}>
          <div className={cn("text-sm font-medium", classNames?.monthLabel)}>
            {calendarMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </div>
          <div className={cn("flex items-center gap-1", classNames?.nav)}>
            <button
              type="button"
              onClick={handlePreviousMonth}
              className={cn(
                buttonVariants({ variant: "outline" }), 
                "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1",
                classNames?.calendarHeaderControlPrev
              )}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className={cn(
                buttonVariants({ variant: "outline" }), 
                "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1",
                classNames?.calendarHeaderControlNext
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className={cn("w-full border-collapse space-x-1", classNames?.monthThead)}>
          <div className="flex">
            {dayNames.map((day) => (
              <div
                key={day}
                className={cn(
                  "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center flex-1",
                  classNames?.weekdayCell
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date ) => {
            const isCurrentMonth = isSameMonth(date, calendarMonth)
            const dateIsToday = isToday(date)
            const dateIsSelected = isSelected(date)
            const dateIsDisabled = isDisabled(date)
            const dateIsOutside = !isCurrentMonth

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  classNames?.monthCell
                )}
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(date)}
                  disabled={dateIsDisabled}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-8 p-0 font-normal",
                    classNames?.day,
                    dateIsSelected && (classNames?.day_selected || "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"),
                    dateIsToday && (classNames?.day_today || "bg-accent text-accent-foreground"),
                    dateIsOutside && !showOutsideDays && (classNames?.day_hidden || "invisible"),
                    dateIsOutside && showOutsideDays && (classNames?.day_outside || "text-muted-foreground"),
                    dateIsDisabled && (classNames?.day_disabled || "text-muted-foreground opacity-50")
                  )}
                >
                  {date.getDate()}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Generate multiple months if needed
  const months = []
  for (let i = 0; i < numberOfMonths; i++) {
    const monthToRender = new Date(month)
    monthToRender.setMonth(month.getMonth() + i)
    months.push(monthToRender)
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className={cn("flex flex-col sm:flex-row gap-2", classNames?.monthsWrapper)}>
        {months.map((monthDate) => renderMonthGrid(monthDate))}
      </div>
    </div>
  )
}

export { Calendar }