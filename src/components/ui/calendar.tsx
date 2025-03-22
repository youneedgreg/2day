"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DatePicker } from "@mantine/dates"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DatePicker>) {
  return (
    <DatePicker
      hideOutsideDates={!showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        monthsWrapper: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        calendarHeader: "flex justify-center pt-1 relative items-center w-full",
        monthLabel: "text-sm font-medium",
        calendarHeaderControl: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        calendarHeaderControlPrev: "absolute left-1",
        calendarHeaderControlNext: "absolute right-1",
        monthThead: "w-full border-collapse space-x-1",
        monthRow: "flex",
        weekdayCell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        monthRow: "flex w-full mt-2",
        monthCell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "bg-accent text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      nextIcon={<ChevronRight className="size-4" />}
      previousIcon={<ChevronLeft className="size-4" />}
      {...props}
    />
  )
}

export { Calendar }