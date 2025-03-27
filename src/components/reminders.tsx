/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types
type Priority = "low" | "medium" | "high"

type Reminder = {
  id: string
  text: string
  date: string
  completed: boolean
  createdAt: string
  priority: Priority
}

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Local storage functions
const getRemindersFromLocalStorage = (): Reminder[] => {
  if (typeof window === 'undefined') return []
  
  const storedReminders = localStorage.getItem('reminders')
  console.log('Getting reminders from localStorage:', storedReminders)
  
  if (!storedReminders) return []
  
  try {
    const parsedReminders = JSON.parse(storedReminders)
    console.log('Successfully parsed reminders:', parsedReminders)
    
    // Handle migration from old format without priority
    const migratedReminders = parsedReminders.map((reminder: any) => ({
      ...reminder,
      priority: reminder.priority || "medium" // Default to medium if no priority exists
    }))
    
    return Array.isArray(migratedReminders) ? migratedReminders : []
  } catch (error) {
    console.error('Error parsing reminders from localStorage:', error)
    return []
  }
}

const saveRemindersToLocalStorage = (reminders: Reminder[]): void => {
  if (typeof window === 'undefined') return
  console.log('Saving reminders to localStorage:', reminders)
  localStorage.setItem('reminders', JSON.stringify(reminders))
}

// Debug function for localStorage
const debugLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const storedReminders = localStorage.getItem('reminders')
    console.log('Raw reminders from localStorage:', storedReminders)
    if (storedReminders) {
      try {
        const parsed = JSON.parse(storedReminders)
        console.log('Parsed reminders:', parsed)
        return parsed
      } catch (error) {
        console.error('Error parsing reminders from localStorage:', error)
      }
    } else {
      console.log('No reminders found in localStorage')
    }
  }
  return []
}

export default function Reminders() {
  // Use lazy initialization for reminders state
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    // This function only runs once during initial render
    if (typeof window !== 'undefined') {
      const storedReminders = localStorage.getItem('reminders')
      if (storedReminders) {
        try {
          const parsed = JSON.parse(storedReminders)
          console.log('Initially loaded reminders:', parsed)
          
          // Handle migration from old format without priority
          const migratedReminders = parsed.map((reminder: any) => ({
            ...reminder,
            priority: reminder.priority || "medium" // Default to medium if no priority exists
          }))
          
          return Array.isArray(migratedReminders) ? migratedReminders : []
        } catch (error) {
          console.error('Error parsing initial reminders:', error)
        }
      }
    }
    return []
  })
  
  const [newReminderText, setNewReminderText] = useState("")
  const [newReminderDate, setNewReminderDate] = useState("")
  const [newReminderPriority, setNewReminderPriority] = useState<Priority>("medium")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")

  // Backup loading from localStorage on component mount
  useEffect(() => {
    console.log('Component mounted, loading reminders from localStorage')
    const loadedReminders = getRemindersFromLocalStorage()
    console.log('Loaded reminders:', loadedReminders)
    
    // Only set reminders if we actually found some
    if (loadedReminders.length > 0) {
      setReminders(loadedReminders)
    }
    
    // Manually check localStorage content
    debugLocalStorage()
  }, [])

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    console.log('Saving reminders to localStorage:', reminders)
    saveRemindersToLocalStorage(reminders)
  }, [reminders])

  const addReminder = () => {
    if (!newReminderText.trim() || !newReminderDate) return

    const reminder: Reminder = {
      id: generateId(),
      text: newReminderText,
      date: newReminderDate,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: newReminderPriority
    }

    setReminders([...reminders, reminder])
    setNewReminderText("")
    setNewReminderDate("")
    setNewReminderPriority("medium")
    setDialogOpen(false)
  }

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((reminder) => (reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder)),
    )
  }

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const updateReminderPriority = (id: string, priority: Priority) => {
    setReminders(
      reminders.map((reminder) => (reminder.id === id ? { ...reminder, priority } : reminder))
    )
  }

  // Filter reminders based on active tab
  const filteredReminders = reminders.filter(reminder => {
    if (activeFilter === "all") return true
    if (activeFilter === "completed") return reminder.completed
    if (activeFilter === "active") return !reminder.completed
    
    // Priority filters
    if (activeFilter === "high") return reminder.priority === "high" && !reminder.completed
    if (activeFilter === "medium") return reminder.priority === "medium" && !reminder.completed
    if (activeFilter === "low") return reminder.priority === "low" && !reminder.completed
    
    return true
  })

  // Sort reminders by priority, then date
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    // First sort by completion status
    if (a.completed && !b.completed) return 1
    if (!a.completed && b.completed) return -1
    
    // For non-completed items, sort by priority 
    if (!a.completed && !b.completed) {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      
      if (priorityDiff !== 0) return priorityDiff
    }
    
    // Then sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  const isOverdue = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reminderDate = new Date(dateString)
    reminderDate.setHours(0, 0, 0, 0)
    return reminderDate < today
  }

  
  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "outline"
    }
  }

  // Calculate counts for tabs
  const remindersCount = {
    all: reminders.length,
    active: reminders.filter(r => !r.completed).length,
    completed: reminders.filter(r => r.completed).length,
    high: reminders.filter(r => r.priority === "high" && !r.completed).length,
    medium: reminders.filter(r => r.priority === "medium" && !r.completed).length,
    low: reminders.filter(r => r.priority === "low" && !r.completed).length,
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
          <h2 className="text-2xl font-bold">Reminders</h2>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <Bell className="h-5 w-5 text-amber-500" />
          </motion.div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="flex items-center gap-2 rounded-full shadow-md">
                <Plus className="h-4 w-4" />
                <span>Add Reminder</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Set a New Reminder
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-text">What would you like to be reminded about?</Label>
                <Input
                  id="reminder-text"
                  placeholder="e.g., Doctor's appointment, Pay bills..."
                  value={newReminderText}
                  onChange={(e) => setNewReminderText(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  When?
                </Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Priority
                </Label>
                <RadioGroup 
                  value={newReminderPriority} 
                  onValueChange={(value) => setNewReminderPriority(value as Priority)}
                  className="flex space-x-1"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="low" id="r-low" />
                    <Label htmlFor="r-low" className="flex items-center gap-1 text-sm cursor-pointer">
                      <span className="text-green-500">
                        <Flag className="h-3 w-3 fill-green-500" />
                      </span>
                      Low
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="flex items-center gap-1 text-sm cursor-pointer">
                      <span className="text-amber-500">
                        <Flag className="h-3 w-3 fill-amber-500" />
                      </span>
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="high" id="r-high" />
                    <Label htmlFor="r-high" className="flex items-center gap-1 text-sm cursor-pointer">
                      <span className="text-red-500">
                        <Flag className="h-3 w-3 fill-red-500" />
                      </span>
                      High
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={addReminder}>Set Reminder</Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {reminders.length > 0 && (
        <Tabs defaultValue="all" value={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
            <TabsTrigger value="all" className="relative px-4">
              All
              <Badge variant="outline" className="ml-1">{remindersCount.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="relative px-4">
              Active
              <Badge variant="outline" className="ml-1">{remindersCount.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative px-4">
              Completed
              <Badge variant="outline" className="ml-1">{remindersCount.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="high" className="relative px-4">
              <Flag className="h-3 w-3 mr-1 fill-red-500 text-red-500" />
              High
              <Badge variant="outline" className="ml-1">{remindersCount.high}</Badge>
            </TabsTrigger>
            <TabsTrigger value="medium" className="relative px-4">
              <Flag className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              Medium
              <Badge variant="outline" className="ml-1">{remindersCount.medium}</Badge>
            </TabsTrigger>
            <TabsTrigger value="low" className="relative px-4">
              <Flag className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
              Low
              <Badge variant="outline" className="ml-1">{remindersCount.low}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {reminders.length === 0 ? (
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
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
            </motion.div>
            <p className="text-muted-foreground">No reminders yet. Never miss an important date again!</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Reminder
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : sortedReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-12 border rounded-lg bg-muted/20"
        >
          <p className="text-muted-foreground">No reminders match the current filter.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => (
            <Card
              key={reminder.id}
              className={`
                overflow-hidden transition-all duration-200 hover:shadow-md
                ${reminder.completed ? "bg-muted/30" : ""}
                ${!reminder.completed && isOverdue(reminder.date) ? "border-red-500 dark:border-red-700" : ""}
                ${!reminder.completed && reminder.priority === "high" ? "border-l-4 border-l-red-500" : ""}
                ${!reminder.completed && reminder.priority === "medium" ? "border-l-4 border-l-amber-500" : ""}
                ${!reminder.completed && reminder.priority === "low" ? "border-l-4 border-l-green-500" : ""}
              `}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={reminder.id}
                    checked={reminder.completed}
                    onCheckedChange={() => toggleReminder(reminder.id)}
                    className={reminder.completed ? "border-primary" : ""}
                  />
                  <div>
                    <label
                      htmlFor={reminder.id}
                      className={`block ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {reminder.text}
                    </label>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reminder.date)}
                      </span>
                      {!reminder.completed && (
                        <Badge variant={getPriorityBadgeVariant(reminder.priority)} className="text-xs px-1.5 py-0">
                          <Flag className={`h-3 w-3 mr-0.5 ${reminder.priority === "high" ? "fill-current" : ""}`} />
                          {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                        </Badge>
                      )}
                      {!reminder.completed && isOverdue(reminder.date) && (
                        <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </span>
                      )}
                      {reminder.completed && (
                        <span className="text-green-500 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!reminder.completed && (
                    <Select 
                      value={reminder.priority}
                      onValueChange={(value) => updateReminderPriority(reminder.id, value as Priority)}
                    >
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs flex items-center gap-1">
                          <Flag className="h-3 w-3 text-green-500 fill-green-500" />
                          Low
                        </SelectItem>
                        <SelectItem value="medium" className="text-xs flex items-center gap-1">
                          <Flag className="h-3 w-3 text-amber-500 fill-amber-500" />
                          Medium
                        </SelectItem>
                        <SelectItem value="high" className="text-xs flex items-center gap-1">
                          <Flag className="h-3 w-3 text-red-500 fill-red-500" />
                          High
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}