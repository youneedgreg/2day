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
import { getHabits, createHabit, completeHabit, subscribeToChanges } from '@/lib/utils/database'
import { Database } from '@/lib/types/database'

// Define types directly in this file
type HabitType = "builder" | "quitter"

type HistoryEntry = {
  date: string
  completed: boolean
}

type Habit = Database['public']['Tables']['habits']['Row'] & {
  habit_completions: Database['public']['Tables']['habit_completions']['Row'][]
}

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

const getTodayFormatted = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Debugging function for localStorage
const debugLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const storedHabits = localStorage.getItem('habits')
    console.log('Raw habits from localStorage:', storedHabits)
    if (storedHabits) {
      try {
        const parsed = JSON.parse(storedHabits)
        console.log('Parsed habits:', parsed)
        return parsed
      } catch (error) {
        console.error('Error parsing habits from localStorage:', error)
      }
    } else {
      console.log('No habits found in localStorage')
    }
  }
  return []
}

// Improved localStorage functions
const getHabitsFromLocalStorage = (): Habit[] => {
  if (typeof window === 'undefined') return []
  
  const storedHabits = localStorage.getItem('habits')
  console.log('Getting habits from localStorage:', storedHabits)
  
  if (!storedHabits) return []
  
  try {
    const parsedHabits = JSON.parse(storedHabits)
    console.log('Successfully parsed habits:', parsedHabits)
    return Array.isArray(parsedHabits) ? parsedHabits : []
  } catch (error) {
    console.error('Error parsing habits from localStorage:', error)
    return []
  }
}

const saveHabitsToLocalStorage = (habits: Habit[]): void => {
  if (typeof window === 'undefined') return
  console.log('Saving habits to localStorage:', habits)
  localStorage.setItem('habits', JSON.stringify(habits))
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function HabitTracker() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState("")
  const [habitType, setHabitType] = useState<HabitType>("builder")
  const [frequency, setFrequency] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "builder" | "quitter">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Fetch initial habits
    fetchHabits()

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('habits', (payload) => {
      if (payload.event === 'INSERT') {
        setHabits((prev) => [payload.new as Habit, ...prev])
      } else if (payload.event === 'UPDATE') {
        setHabits((prev) =>
          prev.map((habit) => (habit.id === payload.new?.id ? (payload.new as Habit) : habit))
        )
      } else if (payload.event === 'DELETE') {
        setHabits((prev) => prev.filter((habit) => habit.id !== payload.old?.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchHabits = async () => {
    if (!user) return
    try {
      const data = await getHabits(user.id)
      setHabits(data)
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async () => {
    if (!user || !newHabit.trim()) return

    try {
      await createHabit({
        user_id: user.id,
        title: newHabit.trim(),
        frequency: 'daily',
        streak_count: 0,
      })
      setNewHabit('')
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId)
    } catch (error) {
      console.error('Error completing habit:', error)
    }
  }

  const addHabit = () => {
    if (!newHabit.trim()) return

    const today = getTodayFormatted()

    const habit: Habit = {
      id: generateId(),
      name: newHabit,
      type: habitType,
      frequency,
      streak_count: 0,
      habit_completions: [{ completed_at: today }],
      createdAt: new Date().toISOString(),
    }

    setHabits([...habits, habit])
    setNewHabit("")
    setHabitType("builder")
    setFrequency(["Mon", "Tue", "Wed", "Thu", "Fri"])
    setDialogOpen(false)
  }

  const toggleDay = (day: string) => {
    if (frequency.includes(day)) {
      setFrequency(frequency.filter((d) => d !== day))
    } else {
      setFrequency([...frequency, day])
    }
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  const toggleHabitCompletion = (habitId: string) => {
    const today = getTodayFormatted()

    setHabits(
      habits.map((habit) => {
        if (habit.id !== habitId) return habit

        // Check if we already have an entry for today
        const todayEntry = habit.habit_completions.find((entry) => entry.completed_at.split('T')[0] === today)

        let newHabitCompletions
        let newStreak = habit.streak_count

        if (todayEntry) {
          // Toggle the existing entry
          newHabitCompletions = habit.habit_completions.map((entry) =>
            entry.completed_at.split('T')[0] === today ? { ...entry, completed_at: today } : entry,
          )

          // Update streak
          if (!todayEntry.completed_at.split('T')[0] === today) {
            // If we're marking it complete
            newStreak += 1
          } else {
            // If we're marking it incomplete
            newStreak = Math.max(0, newStreak - 1)
          }
        } else {
          // Add a new entry for today
          newHabitCompletions = [...habit.habit_completions, { completed_at: today }]
          newStreak += 1
        }

        return {
          ...habit,
          habit_completions: newHabitCompletions,
          streak_count: newStreak,
        }
      }),
    )
  }

  // Modified filteredHabits to ensure it works as expected
  const filteredHabits = activeTab === "all" 
    ? habits 
    : habits.filter(habit => habit.type === activeTab)

  // Debug function to log current state
  const debugHabits = () => {
    console.log('All habits:', habits)
    console.log('Active tab:', activeTab)
    console.log('Filtered habits:', filteredHabits)
    console.log('Are there habits to show?', filteredHabits.length > 0)
  }

  // Call debug function
  debugHabits()

  const isHabitDueToday = (habit: Habit) => {
    const today = new Date()
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()]
    return habit.frequency.includes(dayOfWeek)
  }

  const isHabitCompletedToday = (habit: Habit) => {
    const today = getTodayFormatted()
    return habit.habit_completions.some(
      (completion) => completion.completed_at.split('T')[0] === today
    )
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  if (loading) {
    return <div>Loading habits...</div>
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
                <Button onClick={addHabit}>Create Habit</Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as never)}>
          <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-md">
              All
            </TabsTrigger>
            <TabsTrigger value="builder" className="rounded-lg data-[state=active]:shadow-md flex items-center gap-1">
              <ArrowUp className="h-3.5 w-3.5" />
              Builders
            </TabsTrigger>
            <TabsTrigger value="quitter" className="rounded-lg data-[state=active]:shadow-md flex items-center gap-1">
              <ArrowDown className="h-3.5 w-3.5" />
              Quitters
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Render empty state or habit cards */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => (
            <Card
              key={habit.id}
              className={`
                overflow-hidden transition-all duration-200 hover:shadow-md
                ${!isHabitDueToday(habit) ? "opacity-70" : ""}
                ${isHabitCompletedToday(habit) ? "border-green-500 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10" : ""}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {habit.type === "builder" ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                      {habit.name}
                      {habit.streak_count > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 ml-2">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {habit.streak_count}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      {habit.frequency.map((day) => (
                        <span key={day} className="px-1">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleHabitCompletion(habit.id)}
                      disabled={!isHabitDueToday(habit)}
                      className={isHabitCompletedToday(habit) ? "text-green-500" : ""}
                    >
                      {isHabitCompletedToday(habit) ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" /> }
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
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
                    const entry = habit.habit_completions.find((h) => h.completed_at.split('T')[0] === dateStr)

                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 h-2 rounded-full
                          ${entry?.completed_at ? "bg-green-500 dark:bg-green-700" : "bg-muted"}
                        `}
                        title={dateStr}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}