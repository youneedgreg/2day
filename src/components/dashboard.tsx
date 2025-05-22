"use client"

import { useState, useEffect, useCallback } from "react"
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
  Plus, Edit, Trash2, Settings, Save, Clock, 
  ArrowUp, ArrowDown, Loader2, Sparkles, Trophy, Activity
} from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { getHabits, type HabitWithCompletions } from '@/lib/utils/database/habits'
import { getTodos, type TodoWithRelations } from '@/lib/utils/database/todos'
import { getReminders } from '@/lib/utils/database/reminders'
import { getNotes } from '@/lib/utils/database/notes'
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
  const today = dayjs().format('YYYY-MM-DD')
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
  const today = dayjs()
  
  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = dayjs(sortedCompletions[i])
    const expectedDate = today.subtract(i, 'day')
    
    if (completionDate.isSame(expectedDate, 'day')) {
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

  // Load all data from database
  const loadData = useCallback(async () => {
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
  }, [user])

  // Load data on component mount
  useEffect(() => {
    setMounted(true)
    if (user) {
      loadData()
    }
  }, [user, loadData])

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

  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <motion.div 
          className="flex items-center gap-3 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="font-medium">Loading dashboard...</span>
        </motion.div>
      </div>
    )
  }

  // Calculate statistics
  const todaysTodos = todos.filter(todo => {
    if (todo.due_date) {
      return dayjs(todo.due_date).isToday()
    }
    return dayjs(todo.created_at).isToday()
  })
  
  const completedTodaysTodos = todaysTodos.filter(todo => todo.status === 'completed').length
  const totalTodaysTodos = todaysTodos.length
  const todoCompletionRate = totalTodaysTodos > 0 ? Math.round((completedTodaysTodos / totalTodaysTodos) * 100) : 0

  const todaysHabits = habits.filter(habit => {
    const metadata = parseHabitMetadata(habit.description)
    if (metadata.frequency_days.length === 0) return true // Daily habit
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayjs().day()]
    return metadata.frequency_days.includes(dayOfWeek)
  })
  
  const completedTodaysHabits = todaysHabits.filter(isHabitCompletedToday).length
  const totalTodaysHabits = todaysHabits.length
  const habitCompletionRate = totalTodaysHabits > 0 ? Math.round((completedTodaysHabits / totalTodaysHabits) * 100) : 0

  const bestStreak = habits.length > 0 ? Math.max(...habits.map(calculateHabitStreak)) : 0
  const pendingReminders = reminders.filter(r => r.status === 'pending').length

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
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
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 dark:from-blue-950/40 dark:via-blue-950/30 dark:to-blue-900/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 px-6 py-4 bg-gradient-to-r from-blue-500/10 to-blue-400/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 shadow-sm">
                  <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative">
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{habitCompletionRate}%</div>
                  {habitCompletionRate === 100 && totalTodaysHabits > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {completedTodaysHabits}/{totalTodaysHabits} completed today
                </p>
                {totalTodaysHabits === 0 && (
                  <Badge variant="outline" className="text-xs mt-2 border-blue-200 text-blue-600">
                    No habits scheduled
                  </Badge>
                )}
                {habitCompletionRate === 100 && totalTodaysHabits > 0 && (
                  <Badge className="text-xs mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    Perfect day! 🎉
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      
      case 'tasks':
        return (
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:from-green-950/40 dark:via-green-950/30 dark:to-green-900/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 px-6 py-4 bg-gradient-to-r from-green-500/10 to-green-400/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-green-500/20 shadow-sm">
                  <IconComponent className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative">
                  <div className="text-4xl font-bold text-green-700 dark:text-green-300">{todoCompletionRate}%</div>
                  {todoCompletionRate === 100 && totalTodaysTodos > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {completedTodaysTodos}/{totalTodaysTodos} done today
                </p>
                {totalTodaysTodos === 0 && (
                  <Badge variant="outline" className="text-xs mt-2 border-green-200 text-green-600">
                    No tasks for today
                  </Badge>
                )}
                {todoCompletionRate === 100 && totalTodaysTodos > 0 && (
                  <Badge className="text-xs mt-2 bg-gradient-to-r from-green-500 to-green-600 text-white">
                    All done! 🏆
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
        
      case 'streak':
        return (
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-purple-900/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 px-6 py-4 bg-gradient-to-r from-purple-500/10 to-purple-400/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 shadow-sm">
                  <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative">
                  <div className="text-4xl font-bold text-purple-700 dark:text-purple-300">{bestStreak}</div>
                  {bestStreak >= 7 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Zap className="h-5 w-5 text-orange-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  days in a row
                </p>
                {bestStreak >= 30 && (
                  <Badge className="text-xs mt-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    🔥 On fire!
                  </Badge>
                )}
                {bestStreak >= 7 && bestStreak < 30 && (
                  <Badge variant="secondary" className="text-xs mt-2 bg-purple-100 text-purple-700">
                    Great streak! ⚡
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
        
      case 'reminders':
        return (
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-amber-900/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 px-6 py-4 bg-gradient-to-r from-amber-500/10 to-amber-400/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 shadow-sm">
                  <IconComponent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative">
                  <div className="text-4xl font-bold text-amber-700 dark:text-amber-300">{pendingReminders}</div>
                  {pendingReminders > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  pending reminders
                </p>
                {pendingReminders === 0 && (
                  <Badge variant="outline" className="text-xs mt-2 border-green-200 text-green-600">
                    All caught up! ✨
                  </Badge>
                )}
                {pendingReminders > 5 && (
                  <Badge variant="destructive" className="text-xs mt-2">
                    Needs attention!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'notes':
        const recentNotes = notes.filter(note => {
          const daysSinceUpdate = dayjs().diff(dayjs(note.updated_at), 'day')
          return daysSinceUpdate <= 7
        }).length

        return (
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:via-indigo-950/30 dark:to-indigo-900/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 px-6 py-4 bg-gradient-to-r from-indigo-500/10 to-indigo-400/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 shadow-sm">
                  <IconComponent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">{recentNotes}</div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  notes this week
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {notes.length} total
                </p>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'habitChart':
        // Get date range based on timeframe
        const getDateRange = () => {
          const now = dayjs()
          switch (timeframe) {
            case 'daily':
              return { start: now.subtract(7, 'day'), end: now, label: 'Last 7 days' }
            case 'weekly':
              return { start: now.subtract(4, 'week'), end: now, label: 'Last 4 weeks' }
            case 'monthly':
              return { start: now.subtract(3, 'month'), end: now, label: 'Last 3 months' }
            default:
              return { start: now.subtract(7, 'day'), end: now, label: 'Last 7 days' }
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
            const completionDate = dayjs(completion.completed_at)
            
            if (completionDate.isSameOrAfter(startDate, 'day') && completionDate.isSameOrBefore(endDate, 'day')) {
              const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][completionDate.day()]
              
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 shadow-sm">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
              {habits.length === 0 ? (
                <div className="h-56 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl flex flex-col items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h4 className="font-medium text-muted-foreground mb-2">No habit data yet</h4>
                  <p className="text-sm text-muted-foreground/70 text-center">
                    Add some habits to see your trends
                  </p>
                </div>
              ) : (
                <div className="h-56">
                  <div className="flex items-end h-40 gap-3 mt-4">
                    {chartData.map((item) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center group">
                        <div 
                          className="w-full bg-primary/10 rounded-t-lg relative transition-all duration-500 group-hover:bg-primary/20"
                          style={{ 
                            height: `${Math.max(12, item.rate * 1.2)}%`,
                            minHeight: item.total > 0 ? '12px' : '0'
                          }}
                        >
                          {item.total > 0 && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${item.rate}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="absolute inset-0 bg-gradient-to-t from-primary to-primary/80 rounded-t-lg" 
                            />
                          )}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                            {item.rate}% ({item.completed}/{item.total})
                          </div>
                        </div>
                        <div className="text-sm font-semibold mt-3 text-muted-foreground">{item.day}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-sm text-center text-muted-foreground bg-muted/20 py-2 rounded-lg">
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 shadow-sm">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
              {todos.length === 0 ? (
                <div className="h-56 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl flex flex-col items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h4 className="font-medium text-muted-foreground mb-2">No task data yet</h4>
                  <p className="text-sm text-muted-foreground/70 text-center">
                    Add some tasks to see your overview
                  </p>
                </div>
              ) : (
                <div className="h-56 space-y-6">
                  {/* Progress overview */}
                  <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-primary">{Math.round((completedTasks / totalTasks) * 100)}%</div>
                    <div className="text-sm text-muted-foreground font-medium">Overall completion</div>
                  </div>

                  {/* Priority breakdown */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-muted-foreground">By Priority</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                        <span className="font-medium">High: {tasksByPriority.high}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm"></div>
                        <span className="font-medium">Medium: {tasksByPriority.medium}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="font-medium">Low: {tasksByPriority.low}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                        <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm"></div>
                        <span className="font-medium">None: {tasksByPriority.none}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div className="flex justify-between text-sm bg-muted/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{completedTasks} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">{pendingTasks} pending</span>
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
          const daysSinceUpdate = dayjs().diff(dayjs(note.updated_at), 'day')
          return daysSinceUpdate <= 1
        }).length

        return (
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 shadow-sm">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 rounded-xl shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{todayCompletedHabits}</div>
                  <div className="text-sm text-muted-foreground font-medium">Habits completed</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30 rounded-xl shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CheckSquare className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{todayCompletedTasks}</div>
                  <div className="text-sm text-muted-foreground font-medium">Tasks finished</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30 rounded-xl shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Edit className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{recentNotesCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Notes today</div>
                </motion.div>
              </div>
              
              <div className="mt-6 pt-6 border-t text-center">
                <div className="text-lg font-medium">
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
    <div className="space-y-8 px-2 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl shadow-lg">
            <BarChart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-lg text-muted-foreground">Your productivity overview</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Tabs 
            value={timeframe} 
            onValueChange={setTimeframe}
            className="mr-2"
          >
            <TabsList className="bg-background shadow-sm">
              <TabsTrigger value="daily" className="font-medium">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="font-medium">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="font-medium">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="h-10 px-4 shadow-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
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
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-3 justify-between items-center bg-gradient-to-r from-muted/30 to-muted/10 p-6 rounded-2xl border shadow-sm"
          >
            <div className="flex gap-3 flex-wrap">
              <Button size="sm" onClick={addCard} className="h-10 shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetToDefaults}
                className="h-10 shadow-sm"
              >
                Reset Layout
              </Button>
            </div>
            <Button
              size="sm"
              onClick={saveCardConfig}
              className="h-10 shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div className="grid grid-cols-4 gap-6">
        <AnimatePresence>
          {displayCards.map((card, index) => (
            <motion.div
              key={card.id}
              custom={index}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={cardVariants}
              className={getColumnSpanClass(card)}
            >
              {isEditMode ? (
                <div className="relative group">
                  {renderCardContent(card)}
                  <motion.div 
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingCard(card)
                          setIsConfigOpen(true)
                        }}
                        className="h-10 w-10 p-0 shadow-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveCardUp(index)}
                        disabled={index === 0}
                        className="h-10 w-10 p-0 shadow-lg"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveCardDown(index)}
                        disabled={index === displayCards.length - 1}
                        className="h-10 w-10 p-0 shadow-lg"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deleteCard(card.id)}
                        className="h-10 w-10 p-0 text-red-500 hover:text-red-600 shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                renderCardContent(card)
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Card configuration dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Configure Card</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardTitle" className="text-right font-medium">
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
                <Label htmlFor="cardType" className="text-right font-medium">
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
                <Label htmlFor="cardIcon" className="text-right font-medium">
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
                <Label htmlFor="cardSize" className="text-right font-medium">
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
                <Label htmlFor="cardEnabled" className="text-right font-medium">
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
              
              <div className="flex justify-end space-x-3 pt-4">
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