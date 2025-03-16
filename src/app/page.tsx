"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HabitTracker from "@/components/habit-tracker"
import TodoList from "@/components/todo-list"
import Reminders from "@/components/reminders"
import Notes from "@/components/notes"
import Stats from "@/components/stats"
import { CalendarCheck2, CheckSquare, Bell, StickyNote, BarChart3, Sparkles, Sun, Moon } from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("habits")

  // Prevent hydration errors with localStorage
  useEffect(() => {
    setMounted(true)
    // Check system preference for initial theme
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  if (!mounted) return null

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            2day
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-full bg-muted/50"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.button>
      </motion.div>

      <Tabs 
        defaultValue="habits" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <TabsList className="grid grid-cols-5 mb-8 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="habits" className="flex items-center gap-2 rounded-lg">
              <CalendarCheck2 className="h-4 w-4" />
              <span className="hidden md:inline">Habits</span>
            </TabsTrigger>
            <TabsTrigger value="todos" className="flex items-center gap-2 rounded-lg">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden md:inline">Todos</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2 rounded-lg">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2 rounded-lg">
              <StickyNote className="h-4 w-4" />
              <span className="hidden md:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 rounded-lg">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Stats</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "stats" && (
            <TabsContent key="stats" value="stats" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Stats />
              </motion.div>
            </TabsContent>
          )}
          
          {activeTab === "habits" && (
            <TabsContent key="habits" value="habits" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <HabitTracker />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "todos" && (
            <TabsContent key="todos" value="todos" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TodoList />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "reminders" && (
            <TabsContent key="reminders" value="reminders" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Reminders />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "notes" && (
            <TabsContent key="notes" value="notes" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Notes />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </motion.main>
  )
}