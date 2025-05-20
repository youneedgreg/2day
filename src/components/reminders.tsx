/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle, Flag, 
  Home, Briefcase, GraduationCap, ShoppingBasket, Car, Utensils, 
  Heart, Plane, Dumbbell, Music, Film, BookOpen, Smile, Wallet,
  Gift, Zap, Coffee, Compass, Check, PenSquare, Settings, PencilRuler,
  Edit, MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { getReminders, createReminder, subscribeToChanges } from '@/lib/utils/database'
import { Database } from '@/lib/types/database'
import { format } from 'date-fns'

// Define types
type Priority = "low" | "medium" | "high"

type Space = {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

type Reminder = Database['public']['Tables']['reminders']['Row']

// Define available icons for spaces
const availableIcons = [
  { name: "Home", icon: Home },
  { name: "Work", icon: Briefcase },
  { name: "School", icon: GraduationCap },
  { name: "Shopping", icon: ShoppingBasket },
  { name: "Transport", icon: Car },
  { name: "Food", icon: Utensils },
  { name: "Health", icon: Heart },
  { name: "Travel", icon: Plane },
  { name: "Fitness", icon: Dumbbell },
  { name: "Music", icon: Music },
  { name: "Entertainment", icon: Film },
  { name: "Study", icon: BookOpen },
  { name: "Personal", icon: Smile },
  { name: "Finance", icon: Wallet },
  { name: "Gifts", icon: Gift },
  { name: "Tasks", icon: Check },
  { name: "Projects", icon: PencilRuler },
  { name: "Notes", icon: PenSquare },
  { name: "Ideas", icon: Zap },
  { name: "Coffee", icon: Coffee },
  { name: "Adventure", icon: Compass },
  { name: "Bell", icon: Bell }
]

// Available colors for spaces
const availableColors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Cyan", value: "bg-cyan-500" }
]

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Local storage functions
const getRemindersFromLocalStorage = (): Reminder[] => {
  if (typeof window === 'undefined') return []
  
  const storedReminders = localStorage.getItem('reminders')
  
  if (!storedReminders) return []
  
  try {
    const parsedReminders = JSON.parse(storedReminders)
    
    // Handle migration from old format
    const migratedReminders = parsedReminders.map((reminder: any) => ({
      ...reminder,
      priority: reminder.priority || "medium", // Default to medium if no priority exists
      spaceId: reminder.spaceId || "default" // Default to default space if no spaceId exists
    }))
    
    return Array.isArray(migratedReminders) ? migratedReminders : []
  } catch (error) {
    console.error('Error parsing reminders from localStorage:', error)
    return []
  }
}

const getSpacesFromLocalStorage = (): Space[] => {
  if (typeof window === 'undefined') return []
  
  const storedSpaces = localStorage.getItem('reminderSpaces')
  
  if (!storedSpaces) {
    // Return default space if no spaces exist
    return [{
      id: "default",
      name: "Default",
      icon: "Bell",
      color: "bg-blue-500",
      createdAt: new Date().toISOString()
    }]
  }
  
  try {
    const parsedSpaces = JSON.parse(storedSpaces)
    return Array.isArray(parsedSpaces) ? parsedSpaces : []
  } catch (error) {
    console.error('Error parsing spaces from localStorage:', error)
    return []
  }
}

const saveRemindersToLocalStorage = (reminders: Reminder[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('reminders', JSON.stringify(reminders))
}

const saveSpacesToLocalStorage = (spaces: Space[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('reminderSpaces', JSON.stringify(spaces))
}

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminder_time: new Date().toISOString(),
    repeat_frequency: 'none',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Fetch initial reminders
    fetchReminders()

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('reminders', (payload) => {
      if (payload.event === 'INSERT') {
        setReminders((prev) => [payload.new as Reminder, ...prev])
      } else if (payload.event === 'UPDATE') {
        setReminders((prev) =>
          prev.map((reminder) =>
            reminder.id === payload.new?.id ? (payload.new as Reminder) : reminder
          )
        )
      } else if (payload.event === 'DELETE') {
        setReminders((prev) => prev.filter((reminder) => reminder.id !== payload.old?.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchReminders = async () => {
    if (!user) return
    try {
      const data = await getReminders(user.id)
      setReminders(data)
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReminder = async () => {
    if (!user || !newReminder.title.trim()) return

    try {
      await createReminder({
        user_id: user.id,
        title: newReminder.title.trim(),
        description: newReminder.description.trim(),
        reminder_time: newReminder.reminder_time,
        repeat_frequency: newReminder.repeat_frequency,
        status: 'pending',
      })
      setNewReminder({
        title: '',
        description: '',
        reminder_time: new Date().toISOString(),
        repeat_frequency: 'none',
      })
    } catch (error) {
      console.error('Error creating reminder:', error)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await updateReminder(reminderId, { status: 'dismissed' })
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  if (loading) {
    return <div>Loading reminders...</div>
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <Input
            value={newReminder.title}
            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
            placeholder="Reminder title..."
          />
          <Input
            value={newReminder.description}
            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            placeholder="Description (optional)..."
          />
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={newReminder.reminder_time.slice(0, 16)}
              onChange={(e) =>
                setNewReminder({ ...newReminder, reminder_time: new Date(e.target.value).toISOString() })
              }
            />
            <select
              value={newReminder.repeat_frequency}
              onChange={(e) =>
                setNewReminder({ ...newReminder, repeat_frequency: e.target.value })
              }
              className="px-3 py-2 border rounded-md"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Button onClick={handleCreateReminder}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reminders
          .filter((reminder) => reminder.status === 'pending')
          .map((reminder) => (
            <Card key={reminder.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">{reminder.title}</h3>
                  {reminder.description && (
                    <p className="text-sm text-gray-500">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(reminder.reminder_time), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {reminder.repeat_frequency !== 'none' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Bell className="h-4 w-4" />
                      <span className="capitalize">{reminder.repeat_frequency}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteReminder(reminder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}