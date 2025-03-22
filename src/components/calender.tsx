"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Bell, 
  CheckSquare,
  ArrowUp,
  ArrowDown,
  Zap
} from "lucide-react"
import { getHabits, getTodos, getReminders, Habit, Todo, Reminder } from "@/lib/storage"

// View types
type CalendarView = "year" | "month" | "week" | "day"

// Custom isSameMonth implementation
const isSameMonth = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth();
  };
  
  // Custom isSameDay implementation
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  // Custom eachDayOfInterval implementation
  const eachDayOfInterval = ({ start, end }: { start: Date, end: Date }): Date[] => {
    const days: Date[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  
  // Custom isWithinInterval implementation
  const isWithinInterval = (date: Date, { start, end }: { start: Date, end: Date }): boolean => {
    return date >= start && date <= end;
  };
  
  // Custom parseISO implementation
  const parseISO = (dateString: string): Date => {
    return new Date(dateString);
  };
  
  // You can keep using format from date-fns as it seems to be working correctly
  // If you need a custom format function, here's a simple version for common formats:
  const formatDate = (date: Date, formatStr: string): string => {
    // Helper functions for common formats
    const padZero = (num: number, targetLength: number = 2) => num.toString().padStart(targetLength, '0');
    
    // Day names and month names
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Date components
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    const ampm = hours24 < 12 ? 'am' : 'pm';
    const AMPM = hours24 < 12 ? 'AM' : 'PM';
    
    // Replace tokens with actual values
    let result = formatStr;
    
    // Year
    result = result.replace(/yyyy/g, year.toString());
    result = result.replace(/yy/g, year.toString().slice(-2));
    
    // Month
    result = result.replace(/MMMM/g, monthNames[month]);
    result = result.replace(/MMM/g, shortMonthNames[month]);
    result = result.replace(/MM/g, padZero(month + 1));
    result = result.replace(/M(?![a-zA-Z])/g, (month + 1).toString());
    
    // Day of Month
    result = result.replace(/dd/g, padZero(day));
    result = result.replace(/d(?![a-zA-Z])/g, day.toString());
    
    // Day of Week
    result = result.replace(/EEEE/g, dayNames[dayOfWeek]);
    result = result.replace(/EEE/g, shortDayNames[dayOfWeek]);
    result = result.replace(/EE/g, shortDayNames[dayOfWeek]);
    result = result.replace(/E/g, shortDayNames[dayOfWeek]);
    
    // Hours
    result = result.replace(/HH/g, padZero(hours24));
    result = result.replace(/H/g, hours24.toString());
    result = result.replace(/hh/g, padZero(hours12));
    result = result.replace(/h(?![a-zA-Z])/g, hours12.toString());
    
    // Minutes
    result = result.replace(/mm/g, padZero(minutes));
    result = result.replace(/m(?![a-zA-Z])/g, minutes.toString());
    
    // Seconds
    result = result.replace(/ss/g, padZero(seconds));
    result = result.replace(/s(?![a-zA-Z])/g, seconds.toString());
    
    // Milliseconds
    result = result.replace(/SSS/g, padZero(milliseconds, 3));
    result = result.replace(/SS/g, padZero(Math.floor(milliseconds / 10)));
    result = result.replace(/S/g, Math.floor(milliseconds / 100).toString());
    
    // AM/PM
    result = result.replace(/a/g, ampm);
    result = result.replace(/aa/g, ampm);
    result = result.replace(/aaa/g, ampm);
    result = result.replace(/aaaa/g, ampm);
    result = result.replace(/A/g, AMPM);
    result = result.replace(/AA/g, AMPM);
    result = result.replace(/AAA/g, AMPM);
    result = result.replace(/AAAA/g, AMPM);
    
    // Quarter
    const quarter = Math.floor(month / 3) + 1;
    result = result.replace(/QQQ/g, `Q${quarter}`);
    result = result.replace(/QQ/g, `Q${quarter}`);
    result = result.replace(/Q/g, quarter.toString());
    
    // Common format patterns
    // Handle 'do' format (1st, 2nd, 3rd, etc.)
    result = result.replace(/do/g, (() => {
      const suffix = ['th', 'st', 'nd', 'rd'];
      const val = day % 100;
      return day + (suffix[(val - 20) % 10] || suffix[val] || suffix[0]);
    })());
    
    // Handle "PP" standard date format
    if (result === "PP") {
      return `${monthNames[month]} ${day}, ${year}`;
    }
  
    // Handle "PPP" extended date format  
    if (result === "PPP") {
      return `${dayNames[dayOfWeek]}, ${monthNames[month]} ${day}, ${year}`;
    }
  
    // Handle "p" and "pp" time formats
    result = result.replace(/pp/g, `${padZero(hours12)}:${padZero(minutes)}:${padZero(seconds)} ${AMPM}`);
    result = result.replace(/p/g, `${hours12}:${padZero(minutes)} ${AMPM}`);
  
    return result;
  };

// Day info type to store combined data for the calendar
type DayInfo = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  habits: {
    completed: number;
    total: number;
    items: {
      id: string;
      name: string;
      type: "builder" | "quitter";
      completed: boolean;
    }[];
  };
  todos: {
    completed: number;
    total: number;
    items: {
      id: string;
      text: string;
      completed: boolean;
    }[];
  };
  reminders: {
    completed: number;
    total: number;
    items: {
      id: string;
      text: string;
      completed: boolean;
    }[];
  };
  hasItems: boolean;
}

// Custom date utility functions
const addDaysToDate = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  const addMonthsToDate = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };
  
  const subMonthsFromDate = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() - months);
    return result;
  };
  
  const addWeeksToDate = (date: Date, weeks: number): Date => {
    return addDaysToDate(date, weeks * 7);
  };
  
  const subWeeksFromDate = (date: Date, weeks: number): Date => {
    return addDaysToDate(date, weeks * -7);
  };
  
  const subDaysFromDate = (date: Date, days: number): Date => {
    return addDaysToDate(date, -days);
  };
  
  const startOfMonthDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };
  
  const endOfMonthDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };
  
  const startOfWeekDate = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day);
    return result;
  };
  
  const endOfWeekDate = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() + (6 - day));
    return result;
  };

export default function Calendar() {
  // State for calendar view and date
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([])
  
  // Data state
  const [habits, setHabits] = useState<Habit[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Load data on component mount
  useEffect(() => {
    setMounted(true)
    setHabits(getHabits())
    setTodos(getTodos())
    setReminders(getReminders())
  }, [])
  
  // Generate calendar days whenever the date, view, or data changes
  useEffect(() => {
    if (!mounted) return
    
    generateCalendarDays()
  }, [currentDate, view, habits, todos, reminders, mounted])
  
  if (!mounted) return null
  
  // Generate days for the calendar based on current view
  function generateCalendarDays() {
    let start: Date
    let end: Date
    
    // Determine date range based on view
    switch (view) {
      case "year":
        // For year view, we'll show each month
        const yearStart = new Date(currentDate.getFullYear(), 0, 1)
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31)
        start = yearStart
        end = yearEnd
        break
      case "month":
        // For month view, we'll show the entire month with padding for weeks
        start = startOfWeekDate(startOfMonthDate(currentDate))
        end = endOfWeekDate(endOfMonthDate(currentDate))
        break
      case "week":
        // For week view, we'll show the current week
        start = startOfWeekDate(currentDate)
        end = endOfWeekDate(currentDate)
        break
      case "day":
        // For day view, we'll show just the selected day
        start = currentDate
        end = currentDate
        break
      default:
        start = startOfWeekDate(startOfMonthDate(currentDate))
        end = endOfWeekDate(endOfMonthDate(currentDate))
    }
    
    // Generate array of days in the range
    const daysInRange = eachDayOfInterval({ start, end })
    
    // Map each day to include relevant data
    const days: DayInfo[] = daysInRange.map(date => {
      const dateStr = formatDate(date, "yyyy-MM-dd")
      const isCurrentMonth = isSameMonth(date, currentDate)
      const isToday = isSameDay(date, new Date())
      
      // Filter habits for this day
      const dayHabits = habits.filter(habit => {
        const dayOfWeek = formatDate(date, "EEE")
        const formattedDayOfWeek = dayOfWeek === "Sun" ? "Sun" : 
                                   dayOfWeek === "Mon" ? "Mon" : 
                                   dayOfWeek === "Tue" ? "Tue" : 
                                   dayOfWeek === "Wed" ? "Wed" : 
                                   dayOfWeek === "Thu" ? "Thu" : 
                                   dayOfWeek === "Fri" ? "Fri" : "Sat"
        
        // Only include habits that were scheduled for this day
        return habit.frequency.includes(formattedDayOfWeek)
      })
      
      // Get habit completion status for this day
      const completedHabits = dayHabits.filter(habit => 
        habit.history.some(entry => entry.date === dateStr && entry.completed)
      )
      
      // Filter todos and reminders relevant to this day
      const dayTodos = todos.filter(todo => {
        // For todos, we're showing ones created on this date
        // In a real app, you might have a due date property to use instead
        const todoDate = parseISO(todo.createdAt.split('T')[0])
        return isSameDay(todoDate, date)
      })
      
      const dayReminders = reminders.filter(reminder => {
        // For reminders, use the specific date field
        return reminder.date === dateStr
      })
      
      // Format the data for habits
      const habitItems = dayHabits.map(habit => {
        const completed = habit.history.some(entry => entry.date === dateStr && entry.completed)
        return {
          id: habit.id,
          name: habit.name,
          type: habit.type,
          completed
        }
      })
      
      // Determine if this day has any items
      const hasItems = habitItems.length > 0 || dayTodos.length > 0 || dayReminders.length > 0
      
      return {
        date,
        isCurrentMonth,
        isToday,
        habits: {
          completed: completedHabits.length,
          total: dayHabits.length,
          items: habitItems
        },
        todos: {
          completed: dayTodos.filter(todo => todo.completed).length,
          total: dayTodos.length,
          items: dayTodos.map(todo => ({
            id: todo.id,
            text: todo.text,
            completed: todo.completed
          }))
        },
        reminders: {
          completed: dayReminders.filter(reminder => reminder.completed).length,
          total: dayReminders.length,
          items: dayReminders.map(reminder => ({
            id: reminder.id,
            text: reminder.text,
            completed: reminder.completed
          }))
        },
        hasItems
      }
    })
    
    setCalendarDays(days)
  }
  
  // Navigation functions for changing date
  const goToPreviousPeriod = () => {
    switch (view) {
      case "year":
        setCurrentDate(date => new Date(date.getFullYear() - 1, date.getMonth(), 1))
        break
      case "month":
        setCurrentDate(date => subMonthsFromDate(date, 1))
        break
      case "week":
        setCurrentDate(date => subWeeksFromDate(date, 1))
        break
      case "day":
        setCurrentDate(date => subDaysFromDate(date, 1))
        break
    }
  }
  
  const goToNextPeriod = () => {
    switch (view) {
      case "year":
        setCurrentDate(date => new Date(date.getFullYear() + 1, date.getMonth(), 1))
        break
      case "month":
        setCurrentDate(date => addMonthsToDate(date, 1))
        break
      case "week":
        setCurrentDate(date => addWeeksToDate(date, 1))
        break
      case "day":
        setCurrentDate(date => addDaysToDate(date, 1))
        break
    }
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }
  
  // Handler for day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    
    // If in month or year view, switch to more detailed view of the selected date
    if (view === "year") {
      setCurrentDate(date)
      setView("month")
    } else if (view === "month") {
      setCurrentDate(date)
      setView("day")
    }
  }
  
  // Render different calendar views
  const renderYearView = () => {
    // For year view, we'll create a grid of months
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1))
    
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map(month => {
          // Calculate completion stats for this month
          const monthStart = startOfMonthDate(month)
          const monthEnd = endOfMonthDate(month)
          const daysInMonth = calendarDays.filter(day => 
            isWithinInterval(day.date, { start: monthStart, end: monthEnd })
          )
          
          // Count habits completed in this month
          const habitCompletions = daysInMonth.reduce((sum, day) => sum + day.habits.completed, 0)
          const totalHabitOccurrences = daysInMonth.reduce((sum, day) => sum + day.habits.total, 0)
          const completionRate = totalHabitOccurrences > 0 
            ? Math.round((habitCompletions / totalHabitOccurrences) * 100) 
            : 0
          
          // Count reminders in this month
          const reminderCount = daysInMonth.reduce((sum, day) => sum + day.reminders.total, 0)
          
          return (
            <Card 
              key={month.toISOString()} 
              className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setCurrentDate(month)
                setView("month")
              }}
            >
              <CardHeader className="p-3 pb-0 border-b">
                <CardTitle className="text-sm font-medium">
                  {formatDate(month, "MMMM")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex flex-col space-y-1">
                  {/* Completion rate indicator */}
                  {totalHabitOccurrences > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        Habits
                      </span>
                      <span>{completionRate}%</span>
                    </div>
                  )}
                  
                  {/* Reminder count */}
                  {reminderCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Bell className="h-3 w-3 text-amber-500" />
                        Reminders
                      </span>
                      <span>{reminderCount}</span>
                    </div>
                  )}
                  
                  {/* If no data, show empty state */}
                  {totalHabitOccurrences === 0 && reminderCount === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No events
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }
  
  const renderMonthView = () => {
    // Day name headers
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    return (
      <div className="flex flex-col space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 text-center mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-xs font-medium py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
          {calendarDays.map(day => (
            <motion.div
              key={day.date.toISOString()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                min-h-14 p-1 rounded-md border cursor-pointer relative overflow-hidden
                ${day.isToday ? 'bg-primary/10 border-primary' : 'bg-card border-muted hover:border-muted-foreground/20'}
                ${!day.isCurrentMonth ? 'opacity-40' : ''}
              `}
              onClick={() => handleDayClick(day.date)}
            >
              {/* Date number */}
              <div className="text-xs font-medium">
                {formatDate(day.date, "d")}
              </div>
              
              {/* Indicators */}
              <div className="pt-1 flex flex-col space-y-1">
                {/* Habit streak indicator */}
                {day.habits.total > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Flame className={`h-3 w-3 ${day.habits.completed > 0 ? 'text-orange-500' : 'text-muted-foreground/30'}`} />
                    <span className="text-[10px]">
                      {day.habits.completed}/{day.habits.total}
                    </span>
                  </div>
                )}
                
                {/* Reminders indicator */}
                {day.reminders.total > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Bell className={`h-3 w-3 ${day.reminders.completed < day.reminders.total ? 'text-amber-500' : 'text-muted-foreground/30'}`} />
                    <span className="text-[10px]">
                      {day.reminders.total}
                    </span>
                  </div>
                )}
                
                {/* Todos indicator */}
                {day.todos.total > 0 && (
                  <div className="flex items-center gap-0.5">
                    <CheckSquare className={`h-3 w-3 ${day.todos.completed < day.todos.total ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                    <span className="text-[10px]">
                      {day.todos.completed}/{day.todos.total}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderWeekView = () => {
    // Filter to just show the current week
    const weekDays = calendarDays.slice(0, 7)
    
    return (
      <div className="flex flex-col space-y-4">
        {/* Day headers with dates */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map(day => (
            <div 
              key={day.date.toISOString()}
              className={`py-2 rounded-md ${day.isToday ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <div className="text-xs font-medium">
                {formatDate(day.date, "EEE")}
              </div>
              <div className="text-lg">
                {formatDate(day.date, "d")}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week schedule */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div 
              key={day.date.toISOString()}
              className={`
                min-h-32 p-2 rounded-md border overflow-auto
                ${day.isToday ? 'bg-primary/10 border-primary' : ''}
              `}
              onClick={() => handleDayClick(day.date)}
            >
              {/* Habits section */}
              {day.habits.items.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium mb-1 flex items-center">
                    <Flame className="h-3 w-3 text-orange-500 mr-1" />
                    Habits
                  </h4>
                  <div className="space-y-1">
                    {day.habits.items.map(habit => (
                      <div 
                        key={habit.id}
                        className={`
                          text-xs p-1 rounded
                          ${habit.completed ? 'bg-green-500/20 dark:bg-green-500/10' : 'bg-muted'}
                        `}
                      >
                        <div className="flex items-center gap-1">
                          {habit.type === "builder" ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>{habit.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reminders section */}
              {day.reminders.items.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium mb-1 flex items-center">
                    <Bell className="h-3 w-3 text-amber-500 mr-1" />
                    Reminders
                  </h4>
                  <div className="space-y-1">
                    {day.reminders.items.map(reminder => (
                      <div 
                        key={reminder.id}
                        className={`
                          text-xs p-1 rounded
                          ${reminder.completed ? 'line-through text-muted-foreground bg-muted' : 'bg-amber-500/20 dark:bg-amber-500/10'}
                        `}
                      >
                        {reminder.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Todos section */}
              {day.todos.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 flex items-center">
                    <CheckSquare className="h-3 w-3 text-green-500 mr-1" />
                    Tasks
                  </h4>
                  <div className="space-y-1">
                    {day.todos.items.map(todo => (
                      <div 
                        key={todo.id}
                        className={`
                          text-xs p-1 rounded
                          ${todo.completed ? 'line-through text-muted-foreground bg-muted' : 'bg-green-500/20 dark:bg-green-500/10'}
                        `}
                      >
                        {todo.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {!day.hasItems && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No events</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderDayView = () => {
    // Find the selected day's data
    const selectedDayInfo = calendarDays.find(day => 
      isSameDay(day.date, selectedDate)
    ) || calendarDays[0]
    
    if (!selectedDayInfo) return null
    
    return (
      <div className="flex flex-col space-y-4">
        {/* Day header */}
        <div className="text-center">
          <h3 className="text-xl font-bold">
            {formatDate(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>
        </div>
        
        {/* Day content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Habits section */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {selectedDayInfo.habits.items.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayInfo.habits.items.map(habit => (
                    <div 
                      key={habit.id}
                      className={`
                        p-3 rounded-md border
                        ${habit.completed ? 'border-green-500 bg-green-500/10' : 'border-muted bg-muted/30'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {habit.type === "builder" ? (
                            <Badge variant="outline" className="bg-green-500/20">
                              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                              Builder
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/20">
                              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                              Quitter
                            </Badge>
                          )}
                          <span>{habit.name}</span>
                        </div>
                        <Badge
                          variant={habit.completed ? "default" : "outline"}
                          className={habit.completed ? "bg-green-500" : ""}
                        >
                          {habit.completed ? "Completed" : "Not Completed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>No habits scheduled for this day</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Reminders & Tasks section */}
          <div className="space-y-4">
            {/* Reminders */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {selectedDayInfo.reminders.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayInfo.reminders.items.map(reminder => (
                      <div 
                        key={reminder.id}
                        className={`
                          p-3 rounded-md border
                          ${reminder.completed ? 'border-muted bg-muted/30' : 'border-amber-500 bg-amber-500/10'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className={reminder.completed ? "line-through text-muted-foreground" : ""}>
                            {reminder.text}
                          </span>
                          <Badge
                            variant={reminder.completed ? "default" : "outline"}
                            className={reminder.completed ? "bg-green-500" : "border-amber-500 text-amber-500"}
                          >
                            {reminder.completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bell className="h-6 w-6 mx-auto mb-2 opacity-20" />
                    <p>No reminders for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Tasks */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {selectedDayInfo.todos.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayInfo.todos.items.map(todo => (
                      <div 
                        key={todo.id}
                        className={`
                          p-3 rounded-md border
                          ${todo.completed ? 'border-muted bg-muted/30' : 'border-green-500 bg-green-500/10'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                            {todo.text}
                          </span>
                          <Badge
                            variant={todo.completed ? "default" : "outline"}
                            className={todo.completed ? "bg-green-500" : ""}
                          >
                            {todo.completed ? "Completed" : "To Do"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckSquare className="h-6 w-6 mx-auto mb-2 opacity-20" />
                    <p>No tasks for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousPeriod}
              className="rounded-none border-r h-8 w-8 px-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs h-8 rounded-none px-2"
            >
              Today
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPeriod}
              className="rounded-none border-l h-8 w-8 px-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Current period display */}
          <div className="font-medium text-sm min-w-24 text-center">
            {view === "year" && formatDate(currentDate, "yyyy")}
            {view === "month" && formatDate(currentDate, "MMMM yyyy")}
            {view === "week" && `Week of ${formatDate(calendarDays[0]?.date || currentDate, "MMM d")}`}
            {view === "day" && formatDate(currentDate, "MMMM d, yyyy")}
          </div>
          
          {/* View selector */}
          <Tabs 
            value={view} 
            onValueChange={(value) => setView(value as CalendarView)}
          >
            <TabsList className="h-8">
              <TabsTrigger 
                value="year" 
                className="text-xs px-2"
              >
                Year
              </TabsTrigger>
              <TabsTrigger 
                value="month" 
                className="text-xs px-2"
              >
                Month
              </TabsTrigger>
              <TabsTrigger 
                value="week" 
                className="text-xs px-2"
              >
                Week
              </TabsTrigger>
              <TabsTrigger 
                value="day" 
                className="text-xs px-2"
              >
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Calendar content */}
      <div className="mt-4">
        {view === "year" && renderYearView()}
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>
    </div>
  )
}