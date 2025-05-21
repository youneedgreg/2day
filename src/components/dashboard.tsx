"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, PieChart, TrendingUp, Award, Target, Zap, CheckSquare, Bell, 
  Plus, Edit, Trash2, Move, Settings, Save, Calendar, Clock, 
  ArrowUp, ArrowDown, Loader2, Sparkles, Trophy, TrendingDown, Activity
} from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { getHabits, type HabitWithCompletions } from '@/lib/utils/database/habits'
import { getTodos, type TodoWithRelations } from '@/lib/utils/database/todos'
import { getReminders } from '@/lib/utils/database/reminders'
import { getNotes } from '@/lib/utils/database/notes'
import { Database } from '@/lib/types/database'
import { 
  format, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  isWithinInterval,
  parseISO,
  differenceInDays
} from 'date-fns'
import { toast } from 'sonner'

// Types from database
type Reminder = Database['public']['Tables']['reminders']['Row']
type Note = Database['public']['Tables']['notes']['Row']

// Card configuration types
export type CardType = 'habits' | 'tasks' | 'streak' | 'reminders' | 'notes' | 'habitChart' | 'taskChart' | 'activitySummary'
export type CardConfig = {
  id: string;
  type: CardType;
  title: string;
  icon: string;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

const defaultCards: CardConfig[] = [
  { id: 'habits', type: 'habits', title: 'Daily Habits', icon: 'Target', enabled: true, position: 0, size: 'small' },
  { id: 'tasks', type: 'tasks', title: 'Tasks Today', icon: 'CheckSquare', enabled: true, position: 1, size: 'small' },
  { id: 'streak', type: 'streak', title: 'Best Streak', icon: 'Zap', enabled: true, position: 2, size: 'small' },
  { id: 'reminders', type: 'reminders', title: 'Reminders', icon: 'Bell', enabled: true, position: 3, size: 'small' },
  { id: 'habitChart', type: 'habitChart', title: 'Habit Trends', icon: 'BarChart', enabled: true, position: 4, size: 'medium' },
  { id: 'taskChart', type: 'taskChart', title: 'Task Overview', icon: 'PieChart', enabled: true, position: 5, size: 'medium' },
  { id: 'activitySummary', type: 'activitySummary', title: 'Activity Summary', icon: 'Activity', enabled: true, position: 6, size: 'large' },
]

// Map icon strings to components
const iconMap = {
  Target: Target,
  CheckSquare: CheckSquare,
  Zap: Zap,
  Bell: Bell,
  BarChart: BarChart,
  PieChart: PieChart,
  TrendingUp: TrendingUp,
  Award: Award,
  Activity: Activity,
  Sparkles: Sparkles,
  Trophy: Trophy,
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

// Helper function to check if habit is completed today
const isHabitCompletedToday = (habit: HabitWithCompletions): boolean => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return habit.habit_completions.some(completion => 
    completion.completed_at.split('T')[0] === today
  )
}

// Helper function to calculate habit streaks
const calculateHabitStreak = (habit: HabitWithCompletions): number => {
  const sortedCompletions = habit.habit_completions
    .map(c => c.completed_at.split('T')[0])
    .sort()
    .reverse()

  if (sortedCompletions.length === 0) return 0

  let streak = 0
  const today = new Date()
  
  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i])
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (format(completionDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export default function Dashboard() {
  const { user } = useAuth()
  
  // Data state
  const [habits, setHabits] = useState<HabitWithCompletions[]>([])
  const [todos, setTodos] = useState<TodoWithRelations[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [mounted, setMounted] = useState(false)
  const [cards, setCards] = useState<CardConfig[]>([])
  const [editingCard, setEditingCard] = useState<CardConfig | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [timeframe, setTimeframe] = useState('daily')
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Load data on component mount
  useEffect(() => {
    setMounted(true)
    if (user) {
      loadData()
    }
  }, [user])

  // Load saved card configuration
  useEffect(() => {
    if (mounted) {
      const savedCards = localStorage.getItem('dashboardCards')
      if (savedCards) {
        setCards(JSON.parse(savedCards))
      } else {
        setCards(defaultCards)
      }
    }
  }, [mounted])

  // Save card configuration when it changes
  useEffect(() => {
    if (cards.length > 0 && mounted) {
      localStorage.setItem('dashboardCards', JSON.stringify(cards))
    }
  }, [cards, mounted])

  // Load all data from database
  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const [habitsData, todosData, remindersData, notesData] = await Promise.all([
        getHabits(user.id),
        getTodos(user.id),
        getReminders(user.id),
        getNotes(user.id)
      ])
      
      setHabits(habitsData)
      setTodos(todosData.filter(todo => todo.status !== 'archived'))
      setReminders(remindersData.filter(reminder => reminder.status !== 'dismissed'))
      setNotes(notesData.filter(note => !note.is_archived))
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const todaysTodos = todos.filter(todo => {
    if (todo.due_date) {
      return isToday(parseISO(todo.due_date))
    }
    return isToday(parseISO(todo.created_at))
  })
  
  const completedTodaysTodos = todaysTodos.filter(todo => todo.status === 'completed').length
  const totalTodaysTodos = todaysTodos.length
  const todoCompletionRate = totalTodaysTodos > 0 ? Math.round((completedTodaysTodos / totalTodaysTodos) * 100) : 0

  const todaysHabits = habits.filter(habit => {
    const metadata = parseHabitMetadata(habit.description)
    if (metadata.frequency_days.length === 0) return true // Daily habit
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()]
    return metadata.frequency_days.includes(dayOfWeek)
  })
  
  const completedTodaysHabits = todaysHabits.filter(isHabitCompletedToday).length
  const totalTodaysHabits = todaysHabits.length
  const habitCompletionRate = totalTodaysHabits > 0 ? Math.round((completedTodaysHabits / totalTodaysHabits) * 100) : 0

  const bestStreak = habits.length > 0 ? Math.max(...habits.map(calculateHabitStreak)) : 0
  const pendingReminders = reminders.filter(r => r.status === 'pending').length

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  }

  const saveCardConfig = () => {
    localStorage.setItem('dashboardCards', JSON.stringify(cards))
    setIsEditMode(false)
    toast.success('Dashboard layout saved!')
  }

  const resetToDefaults = () => {
    setCards(defaultCards)
    localStorage.setItem('dashboardCards', JSON.stringify(defaultCards))
    toast.success('Dashboard reset to default layout!')
  }

  const addCard = () => {
    const newId = `card-${Date.now()}`
    const newCard: CardConfig = {
      id: newId,
      type: 'habits',
      title: 'New Card',
      icon: 'Target',
      enabled: true,
      position: cards.length,
      size: 'small',
    }
    setCards([...cards, newCard])
    setEditingCard(newCard)
    setIsConfigOpen(true)
  }

  const updateCard = (updatedCard: CardConfig) => {
    setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card))
    setEditingCard(null)
    setIsConfigOpen(false)
    toast.success('Card updated!')
  }

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id).map((card, index) => ({
      ...card,
      position: index
    })))
    toast.success('Card removed!')
  }

  const moveCardUp = (index: number) => {
    if (index <= 0) return
    const newCards = [...cards]
    const temp = newCards[index - 1].position
    newCards[index - 1].position = newCards[index].position
    newCards[index].position = temp
    setCards(newCards.sort((a, b) => a.position - b.position))
  }

  const moveCardDown = (index: number) => {
    if (index >= cards.length - 1) return
    const newCards = [...cards]
    const temp = newCards[index + 1].position
    newCards[index + 1].position = newCards[index].position
    newCards[index].position = temp
    setCards(newCards.sort((a, b) => a.position - b.position))
  }

  // Render card content based on type
  const renderCardContent = (card: CardConfig) => {
    const IconComponent = iconMap[card.icon as keyof typeof iconMap] || Target

    switch (card.type) {
      case 'habits':
        return (
          <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{habitCompletionRate}%</div>
                  {habitCompletionRate === 100 && totalTodaysHabits > 0 && (
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {completedTodaysHabits}/{totalTodaysHabits} completed today
                </p>
                {totalTodaysHabits === 0 && (
                  <Badge variant="outline" className="text-xs mt-2">No habits scheduled</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      
      case 'tasks':
        return (
          <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <IconComponent className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">{todoCompletionRate}%</div>
                  {todoCompletionRate === 100 && totalTodaysTodos > 0 && (
                    <Trophy className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {completedTodaysTodos}/{totalTodaysTodos} done today
                </p>
                {totalTodaysTodos === 0 && (
                  <Badge variant="outline" className="text-xs mt-2">No tasks for today</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
        
      case 'streak':
        return (
          <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{bestStreak}</div>
                  {bestStreak >= 7 && (
                    <div className="absolute -top-1 -right-1 flex">
                      <Zap className="h-4 w-4 text-orange-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  days in a row
                </p>
                {bestStreak >= 30 && (
                  <Badge variant="secondary" className="text-xs mt-2">🔥 On fire!</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
        
      case 'reminders':
        return (
          <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <IconComponent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{pendingReminders}</div>
                  {pendingReminders > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  pending reminders
                </p>
                {pendingReminders === 0 && (
                  <Badge variant="outline" className="text-xs mt-2">All caught up!</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'notes':
        const recentNotes = notes.filter(note => {
          const daysSinceUpdate = differenceInDays(new Date(), parseISO(note.updated_at))
          return daysSinceUpdate <= 7
        }).length

        return (
          <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20">
            <CardHeader className="pb-2 px-4 py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10">
                  <IconComponent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{recentNotes}</div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  notes this week
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {notes.length} total
                </p>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'habitChart':
        // Get date range based on timeframe
        const getDateRange = () => {
          const now = new Date()
          switch (timeframe) {
            case 'daily':
              return { start: subDays(now, 7), end: now, label: 'Last 7 days' }
            case 'weekly':
              return { start: subWeeks(now, 4), end: now, label: 'Last 4 weeks' }
            case 'monthly':
              return { start: subMonths(now, 3), end: now, label: 'Last 3 months' }
            default:
              return { start: subDays(now, 7), end: now, label: 'Last 7 days' }
          }
        }

        const { start: startDate, end: endDate, label: periodLabel } = getDateRange()

        // Calculate completion rates by day of week
        const habitsByDay: { [key: string]: { total: number; completed: number } } = {
          "Mon": { total: 0, completed: 0 },
          "Tue": { total: 0, completed: 0 },
          "Wed": { total: 0, completed: 0 },
          "Thu": { total: 0, completed: 0 },
          "Fri": { total: 0, completed: 0 },
          "Sat": { total: 0, completed: 0 },
          "Sun": { total: 0, completed: 0 },
        }

        habits.forEach(habit => {
          const metadata = parseHabitMetadata(habit.description)
          
          habit.habit_completions.forEach(completion => {
            const completionDate = parseISO(completion.completed_at)
            
            if (isWithinInterval(completionDate, { start: startDate, end: endDate })) {
              const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][completionDate.getDay()]
              
              // Check if habit was scheduled for this day
              if (metadata.frequency_days.length === 0 || metadata.frequency_days.includes(dayOfWeek)) {
                habitsByDay[dayOfWeek].total += 1
                habitsByDay[dayOfWeek].completed += 1
              }
            }
          })
        })

        const chartData = Object.entries(habitsByDay).map(([day, data]) => ({
          day,
          rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
          completed: data.completed,
          total: data.total
        }))

        const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        chartData.sort((a, b) => orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day))

        return (
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="pb-3 px-4 py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              {habits.length === 0 ? (
                <div className="h-48 bg-muted/30 rounded-lg flex flex-col items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Add some habits to see your trends
                  </p>
                </div>
              ) : (
                <div className="h-48">
                  <div className="flex items-end h-32 gap-2 mt-4">
                    {chartData.map((item) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center group">
                        <div 
                          className="w-full bg-primary/10 rounded-t-md relative transition-all duration-300 group-hover:bg-primary/20"
                          style={{ 
                            height: `${Math.max(8, item.rate * 0.8)}%`,
                            minHeight: item.total > 0 ? '8px' : '0'
                          }}
                        >
                          {item.total > 0 && (
                            <div 
                              className="absolute inset-0 bg-primary rounded-t-md transition-all duration-300" 
                              style={{ height: `${item.rate}%` }} 
                            />
                          )}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {item.rate}% ({item.completed}/{item.total})
                          </div>
                        </div>
                        <div className="text-xs font-medium mt-2 text-muted-foreground">{item.day}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-xs text-center text-muted-foreground">
                    Completion rates by day • {periodLabel}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'taskChart':
        const tasksByPriority = {
          high: todos.filter(t => t.priority === 'high').length,
          medium: todos.filter(t => t.priority === 'medium').length,
          low: todos.filter(t => t.priority === 'low').length,
          none: todos.filter(t => !t.priority || t.priority === null).length
        }

        const completedTasks = todos.filter(t => t.status === 'completed').length
        const pendingTasks = todos.filter(t => t.status === 'pending').length
        const totalTasks = todos.length

        return (
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="pb-3 px-4 py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              {todos.length === 0 ? (
                <div className="h-48 bg-muted/30 rounded-lg flex flex-col items-center justify-center">
                  <PieChart className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Add some tasks to see your overview
                  </p>
                </div>
              ) : (
                <div className="h-48 space-y-4">
                  {/* Progress overview */}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round((completedTasks / totalTasks) * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Overall completion</div>
                  </div>

                  {/* Priority breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">By Priority</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High: {tasksByPriority.high}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span>Medium: {tasksByPriority.medium}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Low: {tasksByPriority.low}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>None: {tasksByPriority.none}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-green-500" />
                      <span>{completedTasks} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>{pendingTasks} pending</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'activitySummary':
        const todayCompletedHabits = completedTodaysHabits
        const todayCompletedTasks = completedTodaysTodos
        const recentNotesCount = notes.filter(note => {
          const daysSinceUpdate = differenceInDays(new Date(), parseISO(note.updated_at))
          return daysSinceUpdate <= 1
        }).length

        return (
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="pb-3 px-4 py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{todayCompletedHabits}</div>
                  <div className="text-xs text-muted-foreground">Habits completed</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{todayCompletedTasks}</div>
                  <div className="text-xs text-muted-foreground">Tasks finished</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg">
                  <Edit className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{recentNotesCount}</div>
                  <div className="text-xs text-muted-foreground">Notes today</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t text-center">
                <div className="text-sm text-muted-foreground">
                  {todayCompletedHabits + todayCompletedTasks > 5 ? 
                    "🎉 Productive day! Keep it up!" : 
                    todayCompletedHabits + todayCompletedTasks > 0 ?
                    "👍 Good progress today!" :
                    "✨ Ready to start your day?"
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Unknown Card Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This card type is not supported</p>
            </CardContent>
          </Card>
        )
    }
  }

  // Get column span class based on card size
  const getColumnSpanClass = (card: CardConfig) => {
    switch (card.size) {
      case 'small':
        return 'col-span-1'
      case 'medium':
        return 'col-span-2'
      case 'large':
        return 'col-span-4'
      default:
        return 'col-span-1'
    }
  }

  // Sort and filter cards for display
  const displayCards = cards
    .filter(card => card.enabled)
    .sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-6 px-2 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <BarChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Your productivity overview</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Tabs 
            value={timeframe} 
            onValueChange={setTimeframe}
            className="mr-2"
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1" />
            {isEditMode ? "Done" : "Customize"}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 justify-between items-center bg-muted/30 p-4 rounded-xl border"
          >
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={addCard} className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Add Card
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetToDefaults}
                className="h-8"
              >
                Reset Layout
              </Button>
            </div>
            <Button
              size="sm"
              onClick={saveCardConfig}
              className="h-8"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Layout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div className="grid grid-cols-4 gap-4">
        {displayCards.map((card, index) => (
          <motion.div
            key={card.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={getColumnSpanClass(card)}
          >
            {isEditMode ? (
              <div className="relative group">
                {renderCardContent(card)}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingCard(card)
                        setIsConfigOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveCardUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveCardDown(index)}
                      disabled={index === displayCards.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => deleteCard(card.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              renderCardContent(card)
            )}
          </motion.div>
        ))}
      </div>

      {/* Card configuration dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Card</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardTitle" className="text-right">
                  Title
                </Label>
                <Input
                  id="cardTitle"
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({...editingCard, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardType" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingCard.type}
                  onValueChange={(value) => setEditingCard({...editingCard, type: value as CardType})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habits">Habits</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="reminders">Reminders</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="habitChart">Habit Chart</SelectItem>
                    <SelectItem value="taskChart">Task Chart</SelectItem>
                    <SelectItem value="activitySummary">Activity Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardIcon" className="text-right">
                  Icon
                </Label>
                <Select
                  value={editingCard.icon}
                  onValueChange={(value) => setEditingCard({...editingCard, icon: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Target">Target</SelectItem>
                    <SelectItem value="CheckSquare">CheckSquare</SelectItem>
                    <SelectItem value="Zap">Zap</SelectItem>
                    <SelectItem value="Bell">Bell</SelectItem>
                    <SelectItem value="BarChart">BarChart</SelectItem>
                    <SelectItem value="PieChart">PieChart</SelectItem>
                    <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                    <SelectItem value="Award">Award</SelectItem>
                    <SelectItem value="Activity">Activity</SelectItem>
                    <SelectItem value="Sparkles">Sparkles</SelectItem>
                    <SelectItem value="Trophy">Trophy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardSize" className="text-right">
                  Size
                </Label>
                <Select
                  value={editingCard.size}
                  onValueChange={(value) => setEditingCard({...editingCard, size: value as 'small' | 'medium' | 'large'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1 column)</SelectItem>
                    <SelectItem value="medium">Medium (2 columns)</SelectItem>
                    <SelectItem value="large">Large (4 columns)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardEnabled" className="text-right">
                  Visible
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="cardEnabled"
                    checked={editingCard.enabled}
                    onCheckedChange={(checked) =>
                      setEditingCard({...editingCard, enabled: checked})
                    }
                  />
                  <Label htmlFor="cardEnabled" className="text-sm font-normal">
                    {editingCard.enabled ? "Show on dashboard" : "Hide from dashboard"}
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCard(null)
                    setIsConfigOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => updateCard(editingCard)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}