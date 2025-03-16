"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { type Reminder, getReminders, saveReminders, generateId } from "@/lib/storage"

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminderText, setNewReminderText] = useState("")
  const [newReminderDate, setNewReminderDate] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setReminders(getReminders())
  }, [])

  useEffect(() => {
    saveReminders(reminders)
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
        <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence>
            {sortedReminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                layout
              >
                <Card
                  className={`
                    overflow-hidden transition-all duration-200 hover:shadow-md
                    ${reminder.completed ? "bg-muted/30" : ""}
                    ${!reminder.completed && isOverdue(reminder.date) ? "border-red-500 dark:border-red-700" : ""}
                  `}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <Checkbox
                          id={reminder.id}
                          checked={reminder.completed}
                          onCheckedChange={() => toggleReminder(reminder.id)}
                          className={reminder.completed ? "border-primary" : ""}
                        />
                      </motion.div>
                      <div>
                        <motion.label
                          htmlFor={reminder.id}
                          className={`block ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
                          animate={{
                            opacity: reminder.completed ? 0.6 : 1,
                            scale: reminder.completed ? 0.98 : 1,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {reminder.text}
                        </motion.label>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(reminder.date)}
                          </span>
                          {!reminder.completed && isOverdue(reminder.date) && (
                            <motion.span
                              className="text-red-500 dark:text-red-400 flex items-center gap-1"
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            >
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </motion.span>
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
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
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

