"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Loader2,
  TrendingUp,
  Target,
  Clock
} from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { getHabits, type HabitWithCompletions } from '@/lib/utils/database/habits'
import { getTodos, type TodoWithRelations } from '@/lib/utils/database/todos'
import { getReminders } from '@/lib/utils/database/reminders'
import { Database } from '@/lib/types/database'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { toast } from 'sonner'

// Initialize dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekOfYear)
dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isTomorrow)
dayjs.extend(customParseFormat)

// View types
type CalendarView = "year" | "month" | "week" | "day"

type Reminder = Database['public']['Tables']['reminders']['Row']

// Day info type to store combined data for the calendar
type DayInfo = {
  date: dayjs.Dayjs;
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

// Helper functions for dayjs date operations
const startOfMonth = (date: dayjs.Dayjs) => date.startOf('month')
const endOfMonth = (date: dayjs.Dayjs) => date.endOf('month')
const startOfWeek = (date: dayjs.Dayjs) => date.startOf('week')
const endOfWeek = (date: dayjs.Dayjs) => date.endOf('week')
const isSameMonth = (date1: dayjs.Dayjs, date2: dayjs.Dayjs) => date1.isSame(date2, 'month')
const isSameDay = (date1: dayjs.Dayjs, date2: dayjs.Dayjs) => date1.isSame(date2, 'day')

// Helper function to generate array of days between two dates
const eachDayOfInterval = (start: dayjs.Dayjs, end: dayjs.Dayjs): dayjs.Dayjs[] => {
  const days: dayjs.Dayjs[] = []
  let currentDay = start
  
  while (currentDay.isSameOrBefore(end, 'day')) {
    days.push(currentDay)
    currentDay = currentDay.add(1, 'day')
  }
  
  return days
}

// Helper function to check if date is within interval
const isWithinInterval = (date: dayjs.Dayjs, start: dayjs.Dayjs, end: dayjs.Dayjs) => {
  return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
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
const isHabitCompletedOnDate = (habit: HabitWithCompletions, date: dayjs.Dayjs): boolean => {
  const dateStr = date.format('YYYY-MM-DD')
  return habit.habit_completions.some(completion => 
    completion.completed_at.split('T')[0] === dateStr
  )
}

// Helper function to check if habit is due on date
const isHabitDueOnDate = (habit: HabitWithCompletions, date: dayjs.Dayjs): boolean => {
  const metadata = parseHabitMetadata(habit.description)
  if (metadata.frequency_days.length === 0) return true // Daily habit
  
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.day()]
  return metadata.frequency_days.includes(dayOfWeek)
}

export default function Calendar() {
  const { user } = useAuth()
  
  // State for calendar view and date
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize data
  const initializeData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const [habitsData, todosData, remindersData] = await Promise.all([
        getHabits(user.id),
        getTodos(user.id),
        getReminders(user.id)
      ])
      
      // Process and generate calendar days with this data
      generateCalendarDays(habitsData, todosData, remindersData)
    } catch (error) {
      console.error('Error loading calendar data:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  
  // Generate days for the calendar based on current view
  const generateCalendarDays = useCallback((
    habits: HabitWithCompletions[],
    todos: TodoWithRelations[],
    reminders: Reminder[]
  ) => {
    let start: dayjs.Dayjs
    let end: dayjs.Dayjs
    
    // Determine date range based on view
    switch (view) {
      case "year":
        // For year view, we'll show each month
        start = dayjs().year(currentDate.year()).month(0).date(1)
        end = dayjs().year(currentDate.year()).month(11).date(31)
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
    const daysInRange = eachDayOfInterval(start, end)
    
    // Map each day to include relevant data
    const days: DayInfo[] = daysInRange.map(date => {
      const isCurrentMonth = isSameMonth(date, currentDate)
      const isToday = date.isToday()
      
      // Filter habits for this day
      const dayHabits = habits.filter(habit => isHabitDueOnDate(habit, date))
      
      // Get habit completion status for this day
      const completedHabits = dayHabits.filter(habit => isHabitCompletedOnDate(habit, date))
      
      // Filter todos relevant to this day (by creation date or due date)
      const dayTodos = todos.filter(todo => {
        // Check if todo was created on this date
        const todoDate = dayjs(todo.created_at)
        return isSameDay(todoDate, date)
      })
      
      // Filter reminders for this specific date
      const dayReminders = reminders.filter(reminder => {
        const reminderDate = dayjs(reminder.reminder_time)
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
  }, [currentDate, view])
  
  // Load data on component mount
  useEffect(() => {
    if (!user) return
    initializeData()
  }, [user, initializeData])
  
  // Navigation functions for changing date
  const goToPreviousPeriod = useCallback(() => {
    switch (view) {
      case "year":
        setCurrentDate(date => date.subtract(1, 'year'))
        break
      case "month":
        setCurrentDate(date => date.subtract(1, 'month'))
        break
      case "week":
        setCurrentDate(date => date.subtract(1, 'week'))
        break
      case "day":
        setCurrentDate(date => date.subtract(1, 'day'))
        break
    }
  }, [view])
  
  const goToNextPeriod = useCallback(() => {
    switch (view) {
      case "year":
        setCurrentDate(date => date.add(1, 'year'))
        break
      case "month":
        setCurrentDate(date => date.add(1, 'month'))
        break
      case "week":
        setCurrentDate(date => date.add(1, 'week'))
        break
      case "day":
        setCurrentDate(date => date.add(1, 'day'))
        break
    }
  }, [view])
  
  const goToToday = useCallback(() => {
    setCurrentDate(dayjs())
    setSelectedDate(dayjs())
  }, [])
  
  // Handler for day click
  const handleDayClick = useCallback((date: dayjs.Dayjs) => {
    setSelectedDate(date)
    
    // If in month or year view, switch to more detailed view of the selected date
    if (view === "year") {
      setCurrentDate(date)
      setView("month")
    } else if (view === "month") {
      setCurrentDate(date)
      setView("day")
    }
  }, [view])
  
  // Render different calendar views
  const renderYearView = () => {
    // For year view, we'll create a grid of months
    const months = Array.from({ length: 12 }, (_, i) => dayjs().year(currentDate.year()).month(i))
    
    return (
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {months.map(month => {
          // Calculate completion stats for this month
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
          const daysInMonth = calendarDays.filter(day => 
            isWithinInterval(day.date, monthStart, monthEnd)
          )
          
          // Count habits completed in this month
          const habitCompletions = daysInMonth.reduce((sum, day) => sum + day.habits.completed, 0)
          const totalHabitOccurrences = daysInMonth.reduce((sum, day) => sum + day.habits.total, 0)
          const completionRate = totalHabitOccurrences > 0 
            ? Math.round((habitCompletions / totalHabitOccurrences) * 100) 
            : 0
          
          // Count reminders in this month
          const reminderCount = daysInMonth.reduce((sum, day) => sum + day.reminders.total, 0)
          const todoCount = daysInMonth.reduce((sum, day) => sum + day.todos.total, 0)
          
          return (
            <motion.div
              key={month.format('YYYY-MM')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card 
                className="overflow-hidden bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg"
                onClick={() => {
                  setCurrentDate(month)
                  setView("month")
                }}
              >
                <CardHeader className="p-4 pb-2 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="text-lg font-semibold text-center">
                    {month.format("MMMM")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Completion rate indicator */}
                    {totalHabitOccurrences > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Flame className="h-4 w-4 text-orange-500" />
                          Habits
                        </span>
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-0">
                          {completionRate}%
                        </Badge>
                      </div>
                    )}
                    
                    {/* Reminder count */}
                    {reminderCount > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Bell className="h-4 w-4 text-amber-500" />
                          Reminders
                        </span>
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-0">
                          {reminderCount}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Todo count */}
                    {todoCount > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <CheckSquare className="h-4 w-4 text-green-500" />
                          Tasks
                        </span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-0">
                          {todoCount}
                        </Badge>
                      </div>
                    )}
                    
                    {/* If no data, show empty state */}
                    {totalHabitOccurrences === 0 && reminderCount === 0 && todoCount === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No events</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    )
  }
  
  const renderMonthView = () => {
    // Day name headers
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map(day => (
            <div key={day} className="text-center py-3 font-semibold text-muted-foreground text-sm bg-muted/30 rounded-lg">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          <AnimatePresence>
            {calendarDays.map((day, index) => (
              <motion.div
                key={day.date.format('YYYY-MM-DD')}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.01 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  min-h-24 p-3 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200
                  ${day.isToday 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg border-2 border-primary/50' 
                    : day.hasItems 
                      ? 'bg-gradient-to-br from-card to-muted/30 hover:from-card hover:to-muted/50 border shadow-sm hover:shadow-md' 
                      : 'bg-card/50 hover:bg-card border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40'
                  }
                  ${!day.isCurrentMonth ? 'opacity-40' : ''}
                `}
                onClick={() => handleDayClick(day.date)}
              >
                {/* Date number */}
                <div className={`text-sm font-bold mb-2 ${day.isToday ? 'text-primary-foreground' : ''}`}>
                  {day.date.format("D")}
                </div>
                
                {/* Activity indicators */}
                <div className="space-y-1">
                  {/* Habit indicator */}
                  {day.habits.total > 0 && (
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        day.habits.completed === day.habits.total ? 'bg-orange-500' : 
                        day.habits.completed > 0 ? 'bg-orange-400' : 'bg-orange-300'
                      }`} />
                      <span className="text-xs font-medium">
                        {day.habits.completed}/{day.habits.total}
                      </span>
                    </div>
                  )}
                  
                  {/* Reminders indicator */}
                  {day.reminders.total > 0 && (
                    <div className="flex items-center gap-1">
                      <Bell className={`h-3 w-3 ${
                        day.reminders.completed < day.reminders.total ? 'text-amber-500' : 'text-muted-foreground'
                      }`} />
                      <span className="text-xs">{day.reminders.total}</span>
                    </div>
                  )}
                  
                  {/* Todos indicator */}
                  {day.todos.total > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckSquare className={`h-3 w-3 ${
                        day.todos.completed < day.todos.total ? 'text-green-500' : 'text-muted-foreground'
                      }`} />
                      <span className="text-xs">
                        {day.todos.completed}/{day.todos.total}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }
  
  const renderWeekView = () => {
    // Filter to just show the current week
    const weekDays = calendarDays.slice(0, 7)
    
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Week header */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => (
            <motion.div 
              key={day.date.format('YYYY-MM-DD')}
              className={`text-center p-4 rounded-xl transition-all ${
                day.isToday ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg' : 'bg-muted/30'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-medium opacity-75">
                {day.date.format("ddd")}
              </div>
              <div className="text-2xl font-bold">
                {day.date.format("D")}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Week schedule */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => (
            <Card
              key={day.date.format('YYYY-MM-DD')}
              className={`min-h-48 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                day.isToday ? 'ring-2 ring-primary/50 shadow-lg' : ''
              }`}
              onClick={() => handleDayClick(day.date)}
            >
              <CardContent className="p-4 h-full">
                {/* Habits section */}
                {day.habits.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold mb-2 flex items-center text-orange-600">
                      <Flame className="h-3 w-3 mr-1" />
                      Habits
                    </h4>
                    <div className="space-y-1">
                      {day.habits.items.map(habit => (
                        <div 
                          key={habit.id}
                          className={`text-xs p-2 rounded-lg transition-colors ${
                            habit.completed ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 border border-green-500/30' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {habit.type === "builder" ? (
                              <ArrowUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className="truncate font-medium">{habit.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Reminders section */}
                {day.reminders.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold mb-2 flex items-center text-amber-600">
                      <Bell className="h-3 w-3 mr-1" />
                      Reminders
                    </h4>
                    <div className="space-y-1">
                      {day.reminders.items.map(reminder => (
                        <div 
                          key={reminder.id}
                          className={`text-xs p-2 rounded-lg ${
                            reminder.completed ? 'bg-muted/50 text-muted-foreground' : 'bg-gradient-to-r from-amber-500/20 to-amber-400/20 border border-amber-500/30'
                          }`}
                        >
                          <span className={`truncate ${reminder.completed ? 'line-through' : 'font-medium'}`}>
                            {reminder.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Todos section */}
                {day.todos.items.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center text-green-600">
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Tasks
                    </h4>
                    <div className="space-y-1">
                      {day.todos.items.map(todo => (
                        <div 
                          key={todo.id}
                          className={`text-xs p-2 rounded-lg ${
                            todo.completed ? 'bg-muted/50 text-muted-foreground' : 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 border border-blue-500/30'
                          }`}
                        >
                          <span className={`truncate ${todo.completed ? 'line-through' : 'font-medium'}`}>
                            {todo.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Empty state */}
                {!day.hasItems && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <CalendarIcon className="h-6 w-6 mx-auto mb-1 opacity-30" />
                      <span className="text-xs">No events</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    )
  }
  
  const renderDayView = () => {
    // Find the selected day's data
    const selectedDayInfo = calendarDays.find(day => 
      isSameDay(day.date, selectedDate)
    ) || calendarDays[0]
    
    if (!selectedDayInfo) return null
    
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Day header */}
        <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl">
          <h3 className="text-3xl font-bold mb-2">
            {selectedDate.format("dddd")}
          </h3>
          <p className="text-lg text-muted-foreground">
            {selectedDate.format("MMMM D, YYYY")}
          </p>
          {selectedDate.isToday() && (
            <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
              <Clock className="h-3 w-3 mr-1" />
              Today
            </Badge>
          )}
        </div>
        
        {/* Day content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habits section */}
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-400/10 border-b">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                Habits
                {selectedDayInfo.habits.total > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedDayInfo.habits.completed}/{selectedDayInfo.habits.total}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedDayInfo.habits.items.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayInfo.habits.items.map(habit => (
                    <motion.div 
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        habit.completed 
                          ? 'border-green-500/50 bg-gradient-to-r from-green-500/20 to-green-400/20' 
                          : 'border-muted bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {habit.type === "builder" ? (
                            <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Builder
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-700 border-red-500/30">
                              <Target className="h-3 w-3 mr-1" />
                              Quitter
                            </Badge>
                          )}
                          <span className="font-medium">{habit.name}</span>
                        </div>
                        <Badge
                          variant={habit.completed ? "default" : "outline"}
                          className={habit.completed ? "bg-green-500 text-white" : ""}
                        >
                          {habit.completed ? "✓ Completed" : "Pending"}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h4 className="font-medium mb-2">No habits scheduled</h4>
                  <p className="text-sm">No habits are scheduled for this day</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Reminders & Tasks section */}
          <div className="space-y-6">
            {/* Reminders */}
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-400/10 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-500" />
                  </div>
                  Reminders
                  {selectedDayInfo.reminders.total > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedDayInfo.reminders.total}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedDayInfo.reminders.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayInfo.reminders.items.map(reminder => (
                      <motion.div 
                        key={reminder.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          reminder.completed 
                            ? 'border-muted bg-muted/30' 
                            : 'border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-amber-400/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}>
                            {reminder.text}
                          </span>
                          <Badge
                            variant={reminder.completed ? "default" : "outline"}
                            className={reminder.completed ? "bg-green-500" : "border-amber-500 text-amber-600"}
                          >
                            {reminder.completed ? "✓ Done" : "Pending"}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <h4 className="font-medium mb-1">No reminders</h4>
                    <p className="text-sm">No reminders for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Tasks */}
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-400/10 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  Tasks
                  {selectedDayInfo.todos.total > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedDayInfo.todos.completed}/{selectedDayInfo.todos.total}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedDayInfo.todos.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayInfo.todos.items.map(todo => (
                      <motion.div 
                        key={todo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          todo.completed 
                            ? 'border-muted bg-muted/30' 
                            : 'border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-blue-400/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                            {todo.text}
                          </span>
                          <Badge
                            variant={todo.completed ? "default" : "outline"}
                            className={todo.completed ? "bg-green-500" : ""}
                          >
                            {todo.completed ? "✓ Done" : "To Do"}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <h4 className="font-medium mb-1">No tasks</h4>
                    <p className="text-sm">No tasks for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <motion.div 
          className="flex items-center gap-3 p-6 rounded-xl bg-muted/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="font-medium">Loading calendar...</span>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header with controls */}
      <motion.div 
        className="flex flex-col lg:flex-row justify-between items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <CalendarIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Calendar</h2>
            <p className="text-sm text-muted-foreground">Track your habits, tasks and reminders</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date navigation */}
          <div className="flex items-center bg-background rounded-xl overflow-hidden shadow-sm border">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousPeriod}
              className="rounded-none h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-sm h-10 rounded-none px-4 font-medium"
            >
              Today
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPeriod}
              className="rounded-none h-10 w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Current period display */}
          <div className="font-bold text-lg min-w-32 text-center px-4 py-2 bg-background rounded-xl shadow-sm border">
            {view === "year" && currentDate.format("YYYY")}
            {view === "month" && currentDate.format("MMMM YYYY")}
            {view === "week" && `Week of ${(calendarDays[0]?.date || currentDate).format("MMM D")}`}
            {view === "day" && currentDate.format("MMMM D, YYYY")}
          </div>
          
          {/* View selector */}
          <Tabs 
            value={view} 
            onValueChange={(value) => setView(value as CalendarView)}
          >
            <TabsList className="h-10 bg-background shadow-sm">
              <TabsTrigger value="year" className="px-4 font-medium">
                Year
              </TabsTrigger>
              <TabsTrigger value="month" className="px-4 font-medium">
                Month
              </TabsTrigger>
              <TabsTrigger value="week" className="px-4 font-medium">
                Week
              </TabsTrigger>
              <TabsTrigger value="day" className="px-4 font-medium">
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>
      
      {/* Calendar content */}
      <div className="min-h-96">
        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {view === "year" && renderYearView()}
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}