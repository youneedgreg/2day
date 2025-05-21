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
  Zap,
  Loader2
} from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { getHabits, type HabitWithCompletions } from '@/lib/utils/database/habits'
import { getTodos, type TodoWithRelations } from '@/lib/utils/database/todos'
import { getReminders } from '@/lib/utils/database/reminders'
import { Database } from '@/lib/types/database'
import { format, addDays, addMonths, subMonths, addWeeks, subWeeks, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, isWithinInterval } from 'date-fns'
import { toast } from 'sonner'

// View types
type CalendarView = "year" | "month" | "week" | "day"

type Reminder = Database['public']['Tables']['reminders']['Row']

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

// Helper function to parse habit metadata
const parseHabitMetadata = (description: string | null) => {
  if (!description) return { type: 'builder', frequency_days: [] }
  
  try {
    const parsed = JSON.parse(description)
    return {
      type: parsed.type || 'builder',
      frequency_days: parsed.frequency_days || []
    }
  } catch {
    return { type: 'builder', frequency_days: [] }
  }
}

// Helper function to check if habit is completed on date
const isHabitCompletedOnDate = (habit: HabitWithCompletions, date: Date): boolean => {
  const dateStr = format(date, 'yyyy-MM-dd')
  return habit.habit_completions.some(completion => 
    completion.completed_at.split('T')[0] === dateStr
  )
}

// Helper function to check if habit is due on date
const isHabitDueOnDate = (habit: HabitWithCompletions, date: Date): boolean => {
  const metadata = parseHabitMetadata(habit.description)
  if (metadata.frequency_days.length === 0) return true // Daily habit
  
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
  return metadata.frequency_days.includes(dayOfWeek)
}

export default function Calendar() {
  const { user } = useAuth()
  
  // State for calendar view and date
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([])
  
  // Data state
  const [habits, setHabits] = useState<HabitWithCompletions[]>([])
  const [todos, setTodos] = useState<TodoWithRelations[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load data on component mount
  useEffect(() => {
    if (!user) return
    
    initializeData()
  }, [user])
  
  // Generate calendar days whenever the date, view, or data changes
  useEffect(() => {
    if (!user || loading) return
    
    generateCalendarDays()
  }, [currentDate, view, habits, todos, reminders, user, loading])

  const initializeData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const [habitsData, todosData, remindersData] = await Promise.all([
        getHabits(user.id),
        getTodos(user.id),
        getReminders(user.id)
      ])
      
      setHabits(habitsData)
      setTodos(todosData)
      setReminders(remindersData)
    } catch (error) {
      console.error('Error loading calendar data:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }
  
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
        start = startOfWeek(startOfMonth(currentDate))
        end = endOfWeek(endOfMonth(currentDate))
        break
      case "week":
        // For week view, we'll show the current week
        start = startOfWeek(currentDate)
        end = endOfWeek(currentDate)
        break
      case "day":
        // For day view, we'll show just the selected day
        start = currentDate
        end = currentDate
        break
      default:
        start = startOfWeek(startOfMonth(currentDate))
        end = endOfWeek(endOfMonth(currentDate))
    }
    
    // Generate array of days in the range
    const daysInRange = eachDayOfInterval({ start, end })
    
    // Map each day to include relevant data
    const days: DayInfo[] = daysInRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd")
      const isCurrentMonth = isSameMonth(date, currentDate)
      const isToday = isSameDay(date, new Date())
      
      // Filter habits for this day
      const dayHabits = habits.filter(habit => isHabitDueOnDate(habit, date))
      
      // Get habit completion status for this day
      const completedHabits = dayHabits.filter(habit => isHabitCompletedOnDate(habit, date))
      
      // Filter todos relevant to this day (by creation date or due date)
      const dayTodos = todos.filter(todo => {
        // Check if todo was created on this date
        const todoDate = new Date(todo.created_at)
        return isSameDay(todoDate, date)
      })
      
      // Filter reminders for this specific date
      const dayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time)
        return isSameDay(reminderDate, date)
      })
      
      // Format the data for habits
      const habitItems = dayHabits.map(habit => {
        const metadata = parseHabitMetadata(habit.description)
        const completed = isHabitCompletedOnDate(habit, date)
        return {
          id: habit.id,
          name: habit.title,
          type: metadata.type as "builder" | "quitter",
          completed
        }
      })
      
      // Format todos data
      const todoItems = dayTodos.map(todo => ({
        id: todo.id,
        text: todo.title,
        completed: todo.status === 'completed'
      }))
      
      // Format reminders data
      const reminderItems = dayReminders.map(reminder => ({
        id: reminder.id,
        text: reminder.title,
        completed: reminder.status === 'completed'
      }))
      
      // Determine if this day has any items
      const hasItems = habitItems.length > 0 || todoItems.length > 0 || reminderItems.length > 0
      
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
          completed: todoItems.filter(todo => todo.completed).length,
          total: todoItems.length,
          items: todoItems
        },
        reminders: {
          completed: reminderItems.filter(reminder => reminder.completed).length,
          total: reminderItems.length,
          items: reminderItems
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
        setCurrentDate(date => subMonths(date, 1))
        break
      case "week":
        setCurrentDate(date => subWeeks(date, 1))
        break
      case "day":
        setCurrentDate(date => subDays(date, 1))
        break
    }
  }
  
  const goToNextPeriod = () => {
    switch (view) {
      case "year":
        setCurrentDate(date => new Date(date.getFullYear() + 1, date.getMonth(), 1))
        break
      case "month":
        setCurrentDate(date => addMonths(date, 1))
        break
      case "week":
        setCurrentDate(date => addWeeks(date, 1))
        break
      case "day":
        setCurrentDate(date => addDays(date, 1))
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
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
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
                  {format(month, "MMMM")}
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
                {format(day.date, "d")}
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
                {format(day.date, "EEE")}
              </div>
              <div className="text-lg">
                {format(day.date, "d")}
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
                min-h-32 p-2 rounded-md border overflow-auto cursor-pointer
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
                          <span className="truncate">{habit.name}</span>
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
                        <span className="truncate">{reminder.text}</span>
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
                        <span className="truncate">{todo.text}</span>
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
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading calendar...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
            {view === "year" && format(currentDate, "yyyy")}
            {view === "month" && format(currentDate, "MMMM yyyy")}
            {view === "week" && `Week of ${format(calendarDays[0]?.date || currentDate, "MMM d")}`}
            {view === "day" && format(currentDate, "MMMM d, yyyy")}
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
      </motion.div>
      
      {/* Calendar content */}
      <motion.div 
        className="mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {view === "year" && renderYearView()}
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </motion.div>
    </div>
  )
}