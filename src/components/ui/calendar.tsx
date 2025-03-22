"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DatePicker } from "@mantine/dates"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface CalendarProps extends Omit<React.ComponentProps<typeof DatePicker>, 'hideOutsideDates'> {
  showOutsideDays?: boolean;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DatePicker
      hideOutsideDates={!showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        wrapper: "flex flex-col sm:flex-row gap-2",
        calendarBase: "flex flex-col gap-4",
        calendarHeader: "flex justify-center pt-1 relative items-center w-full",
        calendarHeaderLevel: "text-sm font-medium",
        calendarHeaderControl: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        calendarHeaderControlPrev: "absolute left-1",
        calendarHeaderControlNext: "absolute right-1",
        calendarHeaderCellContent: "w-full border-collapse space-x-1",
        weekdayCell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        month: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal"
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        inRange:
          "bg-accent text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      nextIcon={<ChevronRight className="size-4" />}
      previousIcon={<ChevronLeft className="size-4" />}
      {...props}
    />
  )
}

export { Calendar }