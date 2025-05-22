"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Check, Trash2, ArrowUp, ArrowDown, Flame, Calendar, Sparkles, Target, TrendingUp, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/hooks/useAuth'
import { 
  getHabits, 
  createHabit, 
  completeHabit, 
  uncompleteHabit, 
  deleteHabit, 
  subscribeToHabitChanges,
  type HabitWithCompletions 
} from '@/lib/utils/database/habits'
import { toast } from 'sonner'

// Define types
type HabitType = "builder" | "quitter"

// Type for real-time subscription payload
type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: unknown;
  old?: unknown;
  table: string;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Helper functions
const getTodayFormatted = (): string => {
  return new Date().toISOString().split('T')[0]
}

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

export default function HabitTracker() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<HabitWithCompletions[]>([])
  const [newHabit, setNewHabit] = useState("")
  const [habitType, setHabitType] = useState<HabitType>("builder")
  const [frequency, setFrequency] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "weekly">("all")
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!user) return
    try {
      console.log('Fetching habits for user:', user.id)
      const data = await getHabits(user.id)
      console.log('Fetched habits:', data.length)
      setHabits(data)
    } catch (error) {
      console.error('Error fetching habits:', error)
      toast.error('Failed to load habits')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      // Refetch habits to get updated data with relations
      fetchHabits()
    }
  }, [fetchHabits])

  useEffect(() => {
    if (!user) return

    fetchHabits()

    // Subscribe to real-time updates
    const subscription = subscribeToHabitChanges(user.id, (payload) => {
      console.log('Real-time habit update:', payload)
      handleRealTimeUpdate(payload)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchHabits, handleRealTimeUpdate])

  const handleCreateHabit = async () => {
    if (!user || !newHabit.trim()) return

    try {
      const habitInput = {
        title: newHabit.trim(),
        frequency: 'daily',
        habit_type: habitType,
        frequency_days: frequency,
      }

      const newHabitData = await createHabit(user.id, habitInput)
      
      // Optimistic update
      setHabits(currentHabits => [newHabitData, ...currentHabits])
      
      // Clear form
      setNewHabit("")
      setHabitType("builder")
      setFrequency(["Mon", "Tue", "Wed", "Thu", "Fri"])
      setDialogOpen(false)
      
      toast.success('Habit created successfully')
      
      // Refetch to ensure consistency
      setTimeout(() => {
        fetchHabits()
      }, 100)
    } catch (error) {
      console.error('Error creating habit:', error)
      toast.error('Failed to create habit')
      fetchHabits() // Refetch on error
    }
  }

  const handleCompleteHabit = async (habitId: string, date?: string) => {
    const targetDate = date || getTodayFormatted()
    
    // Find the habit
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    // Check if already completed for this date
    const isCompleted = isHabitCompletedOnDate(habit, targetDate)
    
    try {
      if (isCompleted) {
        // Uncomplete the habit
        await uncompleteHabit(habitId, targetDate)
        toast.success('Habit unmarked')
      } else {
        // Complete the habit
        await completeHabit({ 
          habit_id: habitId, 
          completed_at: new Date(`${targetDate}T12:00:00Z`).toISOString() 
        })
        toast.success('Habit completed!')
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error)
      toast.error('Failed to update habit')
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    // Optimistic update
    setHabits(currentHabits => currentHabits.filter(h => h.id !== habitId))
    
    try {
      await deleteHabit(habitId)
      toast.success('Habit deleted')
    } catch (error) {
      console.error('Error deleting habit:', error)
      toast.error('Failed to delete habit')
      fetchHabits() // Refetch on error
    }
  }

  const toggleDay = (day: string) => {
    if (frequency.includes(day)) {
      setFrequency(frequency.filter((d) => d !== day))
    } else {
      setFrequency([...frequency, day])
    }
  }

  const isHabitDueToday = (habit: HabitWithCompletions) => {
    const metadata = parseHabitMetadata(habit.description)
    if (metadata.frequency_days.length === 0) return true // Daily habit
    
    const today = new Date()
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()]
    return metadata.frequency_days.includes(dayOfWeek)
  }

  const isHabitCompletedOnDate = (habit: HabitWithCompletions, date: string) => {
    return habit.habit_completions.some(
      (completion) => completion.completed_at.split('T')[0] === date
    )
  }

  const isHabitCompletedToday = (habit: HabitWithCompletions) => {
    return isHabitCompletedOnDate(habit, getTodayFormatted())
  }

  // Calculate completion rate for the week
  const getWeeklyCompletionRate = (habit: HabitWithCompletions) => {
    const completedDays = Array.from({ length: 7 }).filter((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + i)
      const dateStr = date.toISOString().split("T")[0]
      return isHabitCompletedOnDate(habit, dateStr)
    }).length
    return Math.round((completedDays / 7) * 100)
  }

  // Filter logic
  const filteredHabits = habits.filter(habit => {
    if (activeTab === "all") return true
    if (activeTab === "daily") return habit.frequency === 'daily'
    if (activeTab === "weekly") return habit.frequency === 'weekly'
    return true
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <motion.div 
          className="flex items-center gap-3 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <span className="font-medium">Loading habits...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl shadow-lg">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold">Habit Tracker</h2>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Sparkles className="h-6 w-6 text-amber-500" />
              </motion.div>
            </div>
            <p className="text-lg text-muted-foreground">Build lasting habits, one day at a time</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button size="lg" className="flex items-center gap-3 rounded-xl shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">New Habit</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" aria-describedby="habit-form-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Create a New Habit
              </DialogTitle>
              <p id="habit-form-description" className="text-sm text-muted-foreground">
                Create a new habit to track and build your routine.
              </p>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="habit-name" className="text-sm font-semibold">What habit would you like to track?</Label>
                <Input
                  id="habit-name"
                  placeholder="e.g., Morning meditation, Drink water..."
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  className="focus-visible:ring-primary h-12"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Habit Type</Label>
                <RadioGroup
                  defaultValue="builder"
                  value={habitType}
                  onValueChange={(value) => setHabitType(value as HabitType)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <RadioGroupItem value="builder" id="builder" />
                    <Label htmlFor="builder" className="flex items-center gap-2 font-medium">
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      Builder
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <RadioGroupItem value="quitter" id="quitter" />
                    <Label htmlFor="quitter" className="flex items-center gap-2 font-medium">
                      <ArrowDown className="h-4 w-4 text-red-500" />
                      Quitter
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">How often?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <motion.div key={day} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="button"
                        variant={frequency.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day)}
                        className={`w-full h-10 ${frequency.includes(day) ? "shadow-md bg-primary" : ""}`}
                      >
                        {day}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleCreateHabit} className="h-10 px-6">Create Habit</Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50">
            <TabsTrigger value="all" className="font-semibold">All Habits</TabsTrigger>
            <TabsTrigger value="daily" className="font-semibold">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="font-semibold">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Render habits or empty state */}
      <AnimatePresence mode="wait">
        {filteredHabits.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-gradient-to-br from-muted/10 to-muted/5"
          >
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                className="p-4 bg-primary/10 rounded-2xl"
              >
                <Calendar className="h-16 w-16 text-primary/60" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No habits yet</h3>
                <p className="text-muted-foreground">Start building better routines today! Create your first habit to begin tracking your progress.</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(true)} 
                  className="h-12 px-6 border-2 border-primary/20 hover:border-primary/40"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Habit
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="habits-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {filteredHabits.map((habit) => {
                const metadata = parseHabitMetadata(habit.description)
                const isDueToday = isHabitDueToday(habit)
                const isCompletedToday = isHabitCompletedToday(habit)
                const completionRate = getWeeklyCompletionRate(habit)
                
                return (
                  <motion.div
                    key={habit.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`
                        overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg
                        ${!isDueToday ? "opacity-80" : ""}
                        ${isCompletedToday 
                          ? "bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:from-green-950/40 dark:via-green-950/30 dark:to-green-900/30 ring-2 ring-green-500/20" 
                          : "bg-gradient-to-br from-card to-muted/10"
                        }
                      `}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <CardTitle className="flex items-center gap-3 text-lg">
                              <div className={`p-2 rounded-xl shadow-sm ${
                                metadata.type === "builder" 
                                  ? "bg-green-500/20" 
                                  : "bg-red-500/20"
                              }`}>
                                {metadata.type === "builder" ? (
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <span className="truncate">{habit.title}</span>
                            </CardTitle>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1 text-xs text-muted-foreground">
                                {metadata.frequency_days.length > 0 ? (
                                  <div className="flex gap-1">
                                    {metadata.frequency_days.map((day) => (
                                      <Badge key={day} variant="outline" className="text-xs px-2 py-0">
                                        {day}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Daily</Badge>
                                )}
                              </div>
                              
                              {habit.streak_count > 0 && (
                                <Badge className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                  <Flame className="h-3 w-3" />
                                  {habit.streak_count}
                                </Badge>
                              )}
                              
                              {completionRate === 100 && (
                                <Badge className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  <Award className="h-3 w-3" />
                                  Perfect!
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCompleteHabit(habit.id)}
                                disabled={!isDueToday}
                                className={`h-10 w-10 rounded-xl ${
                                  isCompletedToday 
                                    ? "text-green-500 bg-green-500/20 hover:bg-green-500/30" 
                                    : "hover:bg-primary/10"
                                }`}
                              >
                                {isCompletedToday ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Weekly progress bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-muted-foreground">This week</span>
                              <span className="text-sm font-bold">{completionRate}%</span>
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: 7 }).map((_, i) => {
                                const date = new Date()
                                date.setDate(date.getDate() - 6 + i)
                                const dateStr = date.toISOString().split("T")[0]
                                const isCompleted = isHabitCompletedOnDate(habit, dateStr)
                                const isToday = dateStr === getTodayFormatted()

                                return (
                                  <motion.div
                                    key={i}
                                    className={`
                                      flex-1 h-3 rounded-full transition-all duration-300 relative
                                      ${isCompleted 
                                        ? "bg-gradient-to-r from-green-500 to-green-400 shadow-sm" 
                                        : "bg-muted/60"
                                      }
                                      ${isToday ? "ring-2 ring-primary/50" : ""}
                                    `}
                                    title={`${dateStr} ${isCompleted ? '✓' : '○'}`}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                  />
                                )
                              })}
                            </div>
                          </div>

                          {/* Performance indicator */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className={`h-4 w-4 ${
                                completionRate >= 70 ? "text-green-500" : 
                                completionRate >= 40 ? "text-yellow-500" : "text-red-500"
                              }`} />
                              <span className="text-muted-foreground">
                                {completionRate >= 70 ? "Excellent progress!" : 
                                 completionRate >= 40 ? "Good momentum" : "Keep going!"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}