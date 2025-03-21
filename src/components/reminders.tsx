"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Define types
type Reminder = {
  id: string
  text: string
  date: string
  completed: boolean
  createdAt: string
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
    return Array.isArray(parsedReminders) ? parsedReminders : []
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
          return Array.isArray(parsed) ? parsed : []
        } catch (error) {
          console.error('Error parsing initial reminders:', error)
        }
      }
    }
    return []
  })
  
  const [newReminderText, setNewReminderText] = useState("")
  const [newReminderDate, setNewReminderDate] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

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
    }

    setReminders([...reminders, reminder])
    setNewReminderText("")
    setNewReminderDate("")
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

  // Sort reminders by date (upcoming first)
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed && !b.completed) return 1
    if (!a.completed && b.completed) return -1
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

  // Debug function to log current state
  const debugReminders = () => {
    console.log('All reminders:', reminders)
    console.log('Sorted reminders:', sortedReminders)
    console.log('Are there reminders to show?', reminders.length > 0)
  }

  // Call debug function
  debugReminders()

  // Debug component for development
  const DebugPanel = () => {
    const [localStorageContent, setLocalStorageContent] = useState<string>('Loading...')
    
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const content = localStorage.getItem('reminders') || 'No reminders found'
        setLocalStorageContent(content)
      }
    }, [reminders]) // Update when reminders change
    
    if (process.env.NODE_ENV !== 'development') {
      return null // Only show in development
    }
    
    return (
      <div className="mt-6 p-4 border border-red-300 rounded bg-red-50 text-sm">
        <h3 className="font-bold text-red-800 mb-2">Debug Information</h3>
        <div className="mb-2">
          <strong>Reminders in state:</strong> {reminders.length}
        </div>
        <div className="mb-2">
          <strong>Sorted reminders:</strong> {sortedReminders.length}
        </div>
        <div>
          <strong>LocalStorage content:</strong>
          <pre className="mt-1 p-2 bg-white border rounded overflow-auto max-h-40 text-xs">
            {localStorageContent}
          </pre>
        </div>
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => console.log('Current reminders state:', reminders)}
          >
            Log State
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const today = new Date();
              const testReminder = {
                id: generateId(),
                text: "Debug Test Reminder",
                date: today.toISOString().split('T')[0],
                completed: false,
                createdAt: today.toISOString(),
              };
              setReminders(prev => [...prev, testReminder]);
            }}
          >
            Add Test Reminder
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => {
              localStorage.removeItem('reminders');
              setReminders([]);
              window.location.reload();
            }}
          >
            Clear & Reload
          </Button>
        </div>
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
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => (
            <Card
              key={reminder.id}
              className={`
                overflow-hidden transition-all duration-200 hover:shadow-md
                ${reminder.completed ? "bg-muted/30" : ""}
                ${!reminder.completed && isOverdue(reminder.date) ? "border-red-500 dark:border-red-700" : ""}
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
                <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Debug panel - only shows in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  )
}