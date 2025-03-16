"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, PieChart, TrendingUp, Award, Target, Zap, CheckSquare, Bell } from "lucide-react"
import { getHabits, getTodos, getReminders, Habit, Todo, Reminder } from "@/lib/storage"

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHabits(getHabits())
    setTodos(getTodos())
    setReminders(getReminders())
  }, [])

  if (!mounted) return null

  const completedTodos = todos.filter((todo) => todo.completed).length
  const totalTodos = todos.length
  const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  const completedHabits = habits.filter((habit) =>
    habit.history.some((entry) => entry.date === new Date().toISOString().split("T")[0] && entry.completed),
  ).length
  const totalHabits = habits.length
  const habitCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <Tabs defaultValue="daily">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="daily" className="text-xs">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="overflow-hidden border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Habit Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-24">
                <div className="text-3xl font-bold">{habitCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedHabits} of {totalHabits} habits completed today
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="overflow-hidden border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                Task Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-24">
                <div className="text-3xl font-bold">{todoCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTodos} of {totalTodos} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="overflow-hidden border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-24">
                <div className="text-3xl font-bold">
                  {habits.length > 0 ? Math.max(...habits.map((habit) => habit.streak)) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">days in a row</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="overflow-hidden border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-24">
                <div className="text-3xl font-bold">{reminders.filter((r) => !r.completed).length}</div>
                <p className="text-xs text-muted-foreground mt-1">pending reminders</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Habit Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] bg-muted/30 rounded-md flex flex-col items-center justify-center p-6">
                <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground text-center">
                  Your habit data will appear here as you build consistency
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 text-center">
                  Complete habits daily to see your progress charts
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] bg-muted/30 rounded-md flex flex-col items-center justify-center p-6">
                <Award className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground text-center">Your task completion data will appear here</p>
                <p className="text-xs text-muted-foreground/70 mt-2 text-center">
                  Complete more tasks to unlock insights about your productivity
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

