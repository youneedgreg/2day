"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, X, Check, Trash2, ArrowUp, ArrowDown, Flame, Calendar, Sparkles } from "lucide-react"
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
  }, [user])

  // Handle real-time updates
  const handleRealTimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      // Refetch habits to get updated data with relations
      fetchHabits()
    }
  }

  const fetchHabits = async () => {
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
  }

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

  // Filter logic
  const filteredHabits = habits.filter(habit => {
    if (activeTab === "all") return true
    if (activeTab === "daily") return habit.frequency === 'daily'
    if (activeTab === "weekly") return habit.frequency === 'weekly'
    return true
  })

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Habit Tracker</h2>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <Sparkles className="h-5 w-5 text-amber-500" />
          </motion.div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button className="flex items-center gap-2 rounded-full shadow-md">
                <Plus className="h-4 w-4" />
                <span>New Habit</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" aria-describedby="habit-form-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Create a New Habit
              </DialogTitle>
              <p id="habit-form-description" className="text-sm text-muted-foreground">
                Create a new habit to track and build your routine.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="habit-name">What habit would you like to track?</Label>
                <Input
                  id="habit-name"
                  placeholder="e.g., Morning meditation, Drink water..."
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Habit Type</Label>
                <RadioGroup
                  defaultValue="builder"
                  value={habitType}
                  onValueChange={(value) => setHabitType(value as HabitType)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="builder" id="builder" />
                    <Label htmlFor="builder" className="flex items-center gap-1">
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      Builder
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quitter" id="quitter" />
                    <Label htmlFor="quitter" className="flex items-center gap-1">
                      <ArrowDown className="h-4 w-4 text-red-500" />
                      Quitter
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>How often?</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <motion.div key={day} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="button"
                        variant={frequency.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day)}
                        className={frequency.includes(day) ? "shadow-md" : ""}
                      >
                        {day}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleCreateHabit}>Create Habit</Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Render habits or empty state */}
      {filteredHabits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 border rounded-lg bg-muted/20"
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
            >
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
            </motion.div>
            <p className="text-muted-foreground">No habits yet. Start building better routines today!</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Habit
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredHabits.map((habit) => {
            const metadata = parseHabitMetadata(habit.description)
            const isDueToday = isHabitDueToday(habit)
            const isCompletedToday = isHabitCompletedToday(habit)
            
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`
                    overflow-hidden transition-all duration-200 hover:shadow-md
                    ${!isDueToday ? "opacity-70" : ""}
                    ${isCompletedToday ? "border-green-500 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10" : ""}
                  `}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {metadata.type === "builder" ? (
                            <ArrowUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-500" />
                          )}
                          {habit.title}
                          {habit.streak_count > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1 ml-2">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {habit.streak_count}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex gap-1 text-xs text-muted-foreground">
                          {metadata.frequency_days.length > 0 ? (
                            metadata.frequency_days.map((day) => (
                              <span key={day} className="px-1">
                                {day}
                              </span>
                            ))
                          ) : (
                            <span>Daily</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCompleteHabit(habit.id)}
                          disabled={!isDueToday}
                          className={isCompletedToday ? "text-green-500" : ""}
                        >
                          {isCompletedToday ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteHabit(habit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - 6 + i)
                        const dateStr = date.toISOString().split("T")[0]
                        const isCompleted = isHabitCompletedOnDate(habit, dateStr)

                        return (
                          <div
                            key={i}
                            className={`
                              flex-1 h-2 rounded-full transition-colors
                              ${isCompleted ? "bg-green-500 dark:bg-green-700" : "bg-muted"}
                            `}
                            title={dateStr}
                          />
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}