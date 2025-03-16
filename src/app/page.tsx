"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs,TabsList, TabsTrigger } from "@/components/ui/tabs"
import HabitTracker from "@/components/habit-tracker"
import TodoList from "@/components/todo-list"
import Reminders from "@/components/reminders"
import Notes from "@/components/notes"
import Dashboard from "@/components/dashboard"
import Image from "next/image"
import { 
  CalendarCheck2, 
  CheckSquare, 
  Bell, 
  StickyNote, 
  BarChart3, 
  Sun, 
  Moon 
} from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isMobile, setIsMobile] = useState(true)

  // Prevent hydration errors with localStorage and handle responsive layout
  useEffect(() => {
    setMounted(true)
    
    // Check system preference for initial theme
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
    
    // Check if mobile or desktop view
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add listener for window resize
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  if (!mounted) return null

  // Navigation items shared between mobile and desktop
  const navItems = [
    { value: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { value: "habits", label: "Habits", icon: <CalendarCheck2 className="h-5 w-5" /> },
    { value: "todos", label: "Todos", icon: <CheckSquare className="h-5 w-5" /> },
    { value: "reminders", label: "Reminders", icon: <Bell className="h-5 w-5" /> },
    { value: "notes", label: "Notes", icon: <StickyNote className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Side Panel for Desktop */}
      {!isMobile && (
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`w-64 p-6 flex-shrink-0 flex flex-col border-r ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-center gap-2 mb-8">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="/logo.png"
                alt="2day Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              2day
            </h1>
          </div>
          
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.value 
                    ? 'bg-primary text-primary-foreground' 
                    : `hover:bg-muted ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`mt-auto p-3 rounded-lg flex items-center gap-3 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-5 w-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-5 w-5" />
                <span>Light Mode</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 p-4 md:p-8 max-w-7xl mx-auto"
      >
        {/* Mobile Header */}
        {isMobile && (
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
                <Image
                  src="/logo.png"
                  alt="2day Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
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
        )}

        {/* Mobile Tab Switcher */}
{isMobile && (
  <Tabs 
    value={activeTab} 
    className="w-full"
    onValueChange={setActiveTab}
  >
    <motion.div 
      initial={{ y: 10, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.1 }}
      className="w-full px-1"
    >
      <TabsList className="h-full w-full flex justify-between mb-8 bg-muted/50 rounded-xl overflow-hidden">
        <TabsTrigger 
          value="dashboard" 
          className="flex-1 flex items-center justify-center py-3"
        >
          <BarChart3 className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger 
          value="habits" 
          className="flex-1 flex items-center justify-center py-3"
        >
          <CalendarCheck2 className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger 
          value="todos" 
          className="flex-1 flex items-center justify-center py-3"
        >
          <CheckSquare className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger 
          value="reminders" 
          className="flex-1 flex items-center justify-center py-3"
        >
          <Bell className="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger 
          value="notes" 
          className="flex-1 flex items-center justify-center py-3"
        >
          <StickyNote className="h-5 w-5" />
        </TabsTrigger>
      </TabsList>
    </motion.div>
  </Tabs>
)}
        {/* Content Section */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard />
            </motion.div>
          )}
          
          {activeTab === "habits" && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <HabitTracker />
            </motion.div>
          )}

          {activeTab === "todos" && (
            <motion.div
              key="todos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TodoList />
            </motion.div>
          )}

          {activeTab === "reminders" && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Reminders />
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Notes />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  )
}