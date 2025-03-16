"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Check, Trash2, ArrowUp, ArrowDown, Flame, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Habit, type HabitType, getHabits, saveHabits, generateId, getTodayFormatted } from "@/lib/storage"

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState("")
  const [habitType, setHabitType] = useState<HabitType>("builder")
  const [frequency, setFrequency] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "builder" | "quitter">("all")

  useEffect(() => {
    setHabits(getHabits())
  }, [])

  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  const addHabit = () => {
    if (!newHabit.trim()) return

    const today = getTodayFormatted()

    const habit: Habit = {
      id: generateId(),
      name: newHabit,
      type: habitType,
      frequency,
      streak: 0,
      history: [{ date: today, completed: false }],
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
        const todayEntry = habit.history.find((entry) => entry.date === today)

        let newHistory
        let newStreak = habit.streak

        if (todayEntry) {
          // Toggle the existing entry
          newHistory = habit.history.map((entry) =>
            entry.date === today ? { ...entry, completed: !entry.completed } : entry,
          )

          // Update streak
          if (!todayEntry.completed) {
            // If we're marking it complete
            newStreak += 1
          } else {
            // If we're marking it incomplete
            newStreak = Math.max(0, newStreak - 1)
          }
        } else {
          // Add a new entry for today
          newHistory = [...habit.history, { date: today, completed: true }]
          newStreak += 1
        }

        return {
          ...habit,
          history: newHistory,
          streak: newStreak,
        }
      }),
    )
  }

  const filteredHabits = habits.filter((habit) => {
    if (activeTab === "all") return true
    return habit.type === activeTab
  })

  const isHabitDueToday = (habit: Habit) => {
    const today = new Date()
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()]
    return habit.frequency.includes(dayOfWeek)
  }

  const isHabitCompletedToday = (habit: Habit) => {
    const today = getTodayFormatted()
    const todayEntry = habit.history.find((entry) => entry.date === today)
    return todayEntry?.completed || false
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Create a New Habit
              </DialogTitle>
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
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredHabits.map((habit) => (
              <motion.div
                key={habit.id}
                variants={itemVariants}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                layout
              >
                <Card
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
                          {habit.streak > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 10 }}
                            >
                              <Badge variant="outline" className="flex items-center gap-1 ml-2">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {habit.streak}
                              </Badge>
                            </motion.div>
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
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleHabitCompletion(habit.id)}
                            disabled={!isHabitDueToday(habit)}
                            className={isHabitCompletedToday(habit) ? "text-green-500" : ""}
                          >
                            {isHabitCompletedToday(habit) ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - 6 + i)
                        const dateStr = date.toISOString().split("T")[0]
                        const entry = habit.history.find((h) => h.date === dateStr)

                        return (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className={`
                              flex-1 h-2 rounded-full
                              ${entry?.completed ? "bg-green-500 dark:bg-green-700" : "bg-muted"}
                            `}
                            title={dateStr}
                          />
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

