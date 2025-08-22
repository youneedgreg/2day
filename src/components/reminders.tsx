"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle, Flag, 
  Home, Briefcase, GraduationCap, ShoppingBasket, Car, Utensils, 
  Heart, Plane, Dumbbell, Music, Film, BookOpen, Smile, Wallet,
  Gift, Coffee, Compass, Check, PenSquare, Settings, PencilRuler,
  Edit, MoreVertical, Clock, Search, Filter, Star, Archive,
  Share, Bookmark, Tag, MapPin, Users, Lightbulb, X,
  Sparkles, Download, RotateCcw, TrendingUp,
  Target
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from '@/hooks/useAuth'
import { 
   
   
  updateReminder, 
  deleteReminder,
  subscribeToReminders,
  UpdateReminderInput
} from '@/lib/utils/database/reminders'
import { 
  createReminderSpace, 
  deleteReminderSpace,
  type ReminderSpace 
} from '@/lib/utils/database/reminder-spaces'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Initialize dayjs plugins
dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isTomorrow)
dayjs.extend(customParseFormat)

// Define types
type Priority = 'low' | 'medium' | 'high'
type RepeatFrequency = "none" | "daily" | "weekly" | "monthly"
type Reminder = Database['public']['Tables']['reminders']['Row']

type FilterType = 'all' | 'high-priority' | 'today' | 'this-week' | 'overdue' | 'completed' | 'recurring'
type ViewMode = 'card' | 'list' | 'compact'

// Available icons for spaces with enhanced selection
const availableIcons = [
  { name: "Home", icon: Home, category: "Personal" },
  { name: "Work", icon: Briefcase, category: "Professional" },
  { name: "School", icon: GraduationCap, category: "Education" },
  { name: "Shopping", icon: ShoppingBasket, category: "Lifestyle" },
  { name: "Transport", icon: Car, category: "Travel" },
  { name: "Food", icon: Utensils, category: "Lifestyle" },
  { name: "Health", icon: Heart, category: "Personal" },
  { name: "Travel", icon: Plane, category: "Travel" },
  { name: "Fitness", icon: Dumbbell, category: "Health" },
  { name: "Music", icon: Music, category: "Entertainment" },
  { name: "Entertainment", icon: Film, category: "Entertainment" },
  { name: "Study", icon: BookOpen, category: "Education" },
  { name: "Personal", icon: Smile, category: "Personal" },
  { name: "Finance", icon: Wallet, category: "Professional" },
  { name: "Gifts", icon: Gift, category: "Personal" },
  { name: "Tasks", icon: Check, category: "Professional" },
  { name: "Projects", icon: PencilRuler, category: "Professional" },
  { name: "Notes", icon: PenSquare, category: "Personal" },
  { name: "Ideas", icon: Lightbulb, category: "Creative" },
  { name: "Coffee", icon: Coffee, category: "Lifestyle" },
  { name: "Adventure", icon: Compass, category: "Travel" },
  { name: "Bell", icon: Bell, category: "General" },
  { name: "Star", icon: Star, category: "Special" },
  { name: "Target", icon: Target, category: "Goals" },
  { name: "Location", icon: MapPin, category: "Places" },
  { name: "Team", icon: Users, category: "Social" },
  { name: "Bookmark", icon: Bookmark, category: "Reference" }
]

// Enhanced color options with gradients
const availableColors = [
  { name: "Crimson", value: "bg-gradient-to-br from-red-500 to-red-600", solid: "bg-red-500" },
  { name: "Ocean", value: "bg-gradient-to-br from-blue-500 to-blue-600", solid: "bg-blue-500" },
  { name: "Forest", value: "bg-gradient-to-br from-green-500 to-green-600", solid: "bg-green-500" },
  { name: "Sunshine", value: "bg-gradient-to-br from-yellow-500 to-yellow-600", solid: "bg-yellow-500" },
  { name: "Royal", value: "bg-gradient-to-br from-purple-500 to-purple-600", solid: "bg-purple-500" },
  { name: "Rose", value: "bg-gradient-to-br from-pink-500 to-pink-600", solid: "bg-pink-500" },
  { name: "Indigo", value: "bg-gradient-to-br from-indigo-500 to-indigo-600", solid: "bg-indigo-500" },
  { name: "Teal", value: "bg-gradient-to-br from-teal-500 to-teal-600", solid: "bg-teal-500" },
  { name: "Orange", value: "bg-gradient-to-br from-orange-500 to-orange-600", solid: "bg-orange-500" },
  { name: "Cyan", value: "bg-gradient-to-br from-cyan-500 to-cyan-600", solid: "bg-cyan-500" }
]

// Helper functions with dayjs
const formatReminderTime = (dateString: string): string => {
  const date = dayjs(dateString)
  
  if (date.isToday()) {
    return `Today at ${date.format('h:mm A')}`
  } else if (date.isTomorrow()) {
    return `Tomorrow at ${date.format('h:mm A')}`
  } else if (dayjs().subtract(1, 'day').isSame(date, 'day')) {
    return `Yesterday at ${date.format('h:mm A')}`
  } else {
    return date.format('MMM D, YYYY h:mm A')
  }
}

const getPriorityIcon = (priority: string | null) => {
  switch (priority) {
    case 'high': return AlertCircle
    case 'medium': return Flag
    case 'low': return CheckCircle
    default: return Flag
  }
}

const getPriorityColor = (priority: string | null): string => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400'
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
    case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400'
    default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400'
  }
}

const getStatusColor = (status: string, isOverdue: boolean) => {
  if (status === 'completed') return 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30'
  if (isOverdue) return 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30'
  return 'border-muted bg-gradient-to-br from-card to-muted/30'
}

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [spaces, setSpaces] = useState<ReminderSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "overdue" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReminders, setSelectedReminders] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [viewMode] = useState<ViewMode>('card')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'space'>('date')
  
  // New reminder form state
  const [newReminderDialogOpen, setNewReminderDialogOpen] = useState(false)
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    due_date: '',
    status: 'pending',
    completed: false,
    priority: 'medium',
    repeat_frequency: 'none',
    location: null,
    tags: null
  })
  
  // Edit reminder state
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  
  // New space form state
  const [newSpaceDialogOpen, setNewSpaceDialogOpen] = useState(false)
  const [newSpace, setNewSpace] = useState({
    name: '',
    icon: 'Bell',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    description: ''
  })

  // Quick stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0
  })

  // Define fetchReminders first
  const fetchReminders = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await createClient()
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      setReminders(data || [])

      // Update stats with proper types
      const reminders = data || []
      setStats({
        total: reminders.length,
        completed: reminders.filter((r: Reminder) => r.status === 'completed').length,
        overdue: reminders.filter((r: Reminder) => r.status === 'pending' && dayjs(r.due_date).isBefore(dayjs())).length,
        upcoming: reminders.filter((r: Reminder) => dayjs(r.due_date).isAfter(dayjs())).length
      })
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchReminders()
      const subscription = subscribeToReminders((payload: RealtimePostgresChangesPayload<Reminder>) => {
        if (payload.eventType === 'INSERT') {
          setReminders(prev => [...prev, payload.new as Reminder])
        } else if (payload.eventType === 'UPDATE') {
          setReminders(prev => prev.map(r => r.id === payload.new.id ? payload.new as Reminder : r))
        } else if (payload.eventType === 'DELETE') {
          setReminders(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user, fetchReminders])

  const handleCreateReminder = async () => {
    if (!user || !newReminder.title || !newReminder.due_date) return
    try {
      const { error } = await createClient()
        .from('reminders')
        .insert({
          ...newReminder,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      setNewReminder({
        title: '',
        description: '',
        due_date: '',
        status: 'pending',
        completed: false,
        priority: 'medium',
        repeat_frequency: 'none',
        location: null,
        tags: null
      })
      toast.success('Reminder created successfully')
    } catch (error) {
      console.error('Error creating reminder:', error)
      toast.error('Failed to create reminder')
    }
  }

  const handleUpdateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
    try {
      // Optimistic update
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, ...updates } : r
      ))
      
      const updateData: UpdateReminderInput = {
        title: updates.title,
        description: updates.description || undefined,
        due_date: updates.due_date,
        status: updates.status,
        priority: updates.priority as Priority || undefined,
        repeat_frequency: updates.repeat_frequency as RepeatFrequency || undefined,
        space_id: updates.space_id || undefined
      }
      
      await updateReminder(reminderId, updateData)
      toast.success('Reminder updated successfully')
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Failed to update reminder')
      fetchReminders() // Revert on error
    }
  }

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      // Optimistic update
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, status: 'completed' as const } : r
      ))
      
      await deleteReminder(reminderId)
      toast.success('Reminder completed')
    } catch (error) {
      console.error('Error completing reminder:', error)
      toast.error('Failed to complete reminder')
      fetchReminders() // Revert on error
    }
  }

  const handleDismissReminder = async (reminderId: string) => {
    try {
      // Optimistic update
      setReminders(prev => prev.filter(r => r.id !== reminderId))
      
      await deleteReminder(reminderId)
      toast.success('Reminder deleted')
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Failed to delete reminder')
      fetchReminders() // Revert on error
    }
  }

  const handleCreateSpace = async () => {
    if (!user || !newSpace.name.trim()) return

    try {
      const spaceData = await createReminderSpace(user.id, {
        name: newSpace.name.trim(),
        icon: newSpace.icon,
        color: newSpace.color,
        description: newSpace.description.trim() || undefined
      })
      
      setSpaces(prev => [...prev, spaceData])
      setNewSpace({ name: '', icon: 'Bell', color: 'bg-gradient-to-br from-blue-500 to-blue-600', description: '' })
      setNewSpaceDialogOpen(false)
      
      toast.success('Space created successfully')
    } catch (error) {
      console.error('Error creating space:', error)
      toast.error('Failed to create space')
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      await deleteReminderSpace(spaceId)
      setSpaces(prev => prev.filter(s => s.id !== spaceId))
      toast.success('Space deleted')
    } catch (error) {
      console.error('Error deleting space:', error)
      toast.error('Failed to delete space')
    }
  }

  const handleBulkAction = async (action: 'complete' | 'delete' | 'archive') => {
    try {
      await Promise.all(selectedReminders.map(reminderId => {
        switch (action) {
          case 'complete':
            return deleteReminder(reminderId)
          case 'delete':
            return deleteReminder(reminderId)
          case 'archive':
            return updateReminder(reminderId, { status: 'completed' })
        }
      }))

      setSelectedReminders([])
      setIsSelectionMode(false)
      toast.success(`${selectedReminders.length} reminders ${action}d`)
      fetchReminders()
    } catch {
      toast.error(`Failed to ${action} reminders`)
    }
  }

  const exportReminders = () => {
    const dataStr = JSON.stringify(reminders, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reminders-export-${dayjs().format('YYYY-MM-DD')}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Reminders exported successfully')
  }

  const shareReminder = async (reminder: Reminder) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reminder.title,
          text: `${reminder.title}\n${reminder.description || ''}\nDue: ${formatReminderTime(reminder.due_date)}`,
          url: window.location.href
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${reminder.title}\n${reminder.description || ''}\nDue: ${formatReminderTime(reminder.due_date)}`
      await navigator.clipboard.writeText(shareText)
      toast.success('Reminder copied to clipboard')
    }
  }

  // Update the filteredRemindersList function
  const filteredRemindersList = reminders.filter(reminder => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        reminder.title.toLowerCase().includes(query) ||
        (reminder.description && reminder.description.toLowerCase().includes(query)) ||
        (reminder.location && reminder.location.toLowerCase().includes(query)) ||
        (reminder.tags && reminder.tags.some(tag => tag.toLowerCase().includes(query)))
      if (!matchesSearch) return false
    }

    // Advanced filters
    const now = dayjs()
    const reminderDate = dayjs(reminder.due_date)
    
    switch (activeFilter) {
      case 'high-priority':
        return reminder.priority === 'high'
      case 'today':
        return reminderDate.isToday()
      case 'this-week':
        return reminderDate.isAfter(now) && reminderDate.isBefore(now.add(7, 'day'))
      case 'overdue':
        return reminder.status === 'pending' && reminderDate.isBefore(now)
      case 'completed':
        return reminder.status === 'completed'
      case 'recurring':
        return reminder.repeat_frequency !== 'none'
      default:
        return true
    }
  })

  // Get space details
  const getSpaceDetails = (spaceId: string | null) => {
    if (!spaceId) return { name: 'General', icon: 'Bell', color: 'bg-gradient-to-br from-blue-500 to-blue-600' }
    const space = spaces.find(s => s.id === spaceId)
    return space || { name: 'General', icon: 'Bell', color: 'bg-gradient-to-br from-blue-500 to-blue-600' }
  }

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(i => i.name === iconName)
    return iconData?.icon || Bell
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  // Update the form field handlers
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewReminder(prev => ({
      ...prev,
      description: e.target.value || undefined
    }))
  }

  const handleSpaceIdChange = (value: string) => {
    setNewReminder(prev => ({
      ...prev,
      space_id: value || undefined
    }))
  }

  const handleRepeatFrequencyChange = (value: RepeatFrequency) => {
    setNewReminder(prev => ({
      ...prev,
      repeat_frequency: value || undefined
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <motion.div 
          className="flex items-center gap-3 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <span className="font-medium">Loading reminders...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl shadow-lg">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold">Reminders</h2>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Sparkles className="h-6 w-6 text-amber-500" />
              </motion.div>
            </div>
            <p className="text-lg text-muted-foreground">Never miss what matters most</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-background rounded-xl shadow-sm border">
            <div className="text-center">
              <div className="text-sm font-semibold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">{stats.upcoming}</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
          </div>

          {/* Selection Mode Toggle */}
          {reminders.length > 0 && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                setSelectedReminders([])
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Select
            </Button>
          )}

          {/* Mobile Quick Add Drawer */}
          <div className="lg:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Quick Reminder</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-4">
                  <Input
                    placeholder="What do you need to remember?"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleCreateReminder()} className="w-full">
                      Create
                    </Button>
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
                <DrawerFooter />
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2">
            {/* Spaces Management */}
            <Dialog open={newSpaceDialogOpen} onOpenChange={setNewSpaceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Spaces
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Manage Spaces
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="create" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create New</TabsTrigger>
                    <TabsTrigger value="manage">Manage Existing</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="create" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="space-name">Space Name</Label>
                        <Input
                          id="space-name"
                          placeholder="e.g., Work Projects, Personal Tasks..."
                          value={newSpace.name}
                          onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                          placeholder="What kind of reminders will this space contain?"
                          value={newSpace.description}
                          onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Choose an Icon</Label>
                        <Tabs defaultValue="Personal" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="Personal">Personal</TabsTrigger>
                            <TabsTrigger value="Professional">Work</TabsTrigger>
                            <TabsTrigger value="Lifestyle">Life</TabsTrigger>
                            <TabsTrigger value="Creative">Creative</TabsTrigger>
                          </TabsList>
                          
                          {["Personal", "Professional", "Lifestyle", "Creative"].map(category => (
                            <TabsContent key={category} value={category}>
                              <div className="grid grid-cols-8 gap-2 p-2">
                                {availableIcons.filter(icon => icon.category === category).map((iconItem) => {
                                  const IconComponent = iconItem.icon
                                  return (
                                    <motion.button
                                      key={iconItem.name}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => setNewSpace({ ...newSpace, icon: iconItem.name })}
                                      className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        newSpace.icon === iconItem.name 
                                          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                                          : "border-muted hover:border-muted-foreground/50"
                                      )}
                                      title={iconItem.name}
                                    >
                                      <IconComponent className="h-5 w-5" />
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Choose a Color Theme</Label>
                        <div className="grid grid-cols-5 gap-3">
                          {availableColors.map((color) => (
                            <motion.button
                              key={color.name}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setNewSpace({ ...newSpace, color: color.value })}
                              className={cn(
                                "h-12 rounded-xl border-2 transition-all shadow-sm",
                                color.value,
                                newSpace.color === color.value ? "border-foreground ring-2 ring-foreground/20" : "border-transparent hover:border-muted-foreground/30"
                              )}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <Button onClick={handleCreateSpace} className="w-full h-12">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Space
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="manage" className="mt-6">
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3">
                        {spaces.map((space) => {
                          const IconComponent = getIconComponent(space.icon)
                          return (
                            <motion.div 
                              key={space.id} 
                              className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-card to-muted/20"
                              whileHover={{ scale: 1.01 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg shadow-sm", space.color)}>
                                  <IconComponent className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <span className="font-medium">{space.name}</span>
                                  {space.description && (
                                    <p className="text-sm text-muted-foreground">{space.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Edit functionality could be implemented here
                                    toast.info('Edit functionality coming soon!')
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {space.name !== 'General' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSpace(space.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={exportReminders}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Reminders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Reminder Button */}
            <Dialog open={newReminderDialogOpen} onOpenChange={setNewReminderDialogOpen}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    New Reminder
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    Create New Reminder
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="py-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="timing">Timing</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-title">What do you need to remember?</Label>
                        <Input
                          id="reminder-title"
                          placeholder="e.g., Call dentist, Buy groceries..."
                          value={newReminder.title}
                          onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminder-description">Description (optional)</Label>
                        <Textarea
                          id="reminder-description"
                          placeholder="Additional details or context..."
                          value={newReminder.description || ''}
                          onChange={handleDescriptionChange}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Space</Label>
                        <Select
                          value={newReminder.space_id || ''}
                          onValueChange={handleSpaceIdChange}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.map((space) => {
                              const IconComponent = getIconComponent(space.icon)
                              return (
                                <SelectItem key={space.id} value={space.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={cn("p-1 rounded", space.color)}>
                                      <IconComponent className="h-3 w-3 text-white" />
                                    </div>
                                    {space.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="timing" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-time">When do you want to be reminded?</Label>
                        <Input
                          id="reminder-time"
                          type="datetime-local"
                          value={newReminder.due_date}
                          onChange={(e) => setNewReminder({ ...newReminder, due_date: e.target.value })}
                          className="h-12"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority Level</Label>
                          <RadioGroup
                            value={newReminder.priority}
                            onValueChange={(value: Priority) => setNewReminder({ ...newReminder, priority: value })}
                          >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg">
                              <RadioGroupItem value="low" id="low" />
                              <Label htmlFor="low" className="flex items-center gap-2 cursor-pointer">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Low Priority
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg">
                              <RadioGroupItem value="medium" id="medium" />
                              <Label htmlFor="medium" className="flex items-center gap-2 cursor-pointer">
                                <Flag className="h-4 w-4 text-yellow-500" />
                                Medium Priority
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg">
                              <RadioGroupItem value="high" id="high" />
                              <Label htmlFor="high" className="flex items-center gap-2 cursor-pointer">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                High Priority
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label>Repeat Frequency</Label>
                          <Select
                            value={newReminder.repeat_frequency || 'none'}
                            onValueChange={handleRepeatFrequencyChange}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Repeat</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-location">Location (optional)</Label>
                        <Input
                          id="reminder-location"
                          placeholder="e.g., Home, Office, Grocery Store..."
                          value={newReminder.location ?? ''}
                          onChange={(e) => setNewReminder({ ...newReminder, location: e.target.value || null })}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (optional)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {newReminder.tags?.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                              #{tag}
                              <button
                                onClick={() => setNewReminder(prev => ({
                                  ...prev,
                                  tags: prev.tags?.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault()
                                const newTag = e.currentTarget.value.trim()
                                if (!newReminder.tags?.includes(newTag)) {
                                  setNewReminder(prev => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), newTag]
                                  }))
                                }
                                e.currentTarget.value = ''
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input')
                              if (input?.value.trim()) {
                                const newTag = input.value.trim()
                                if (!newReminder.tags?.includes(newTag)) {
                                  setNewReminder(prev => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), newTag]
                                  }))
                                }
                                input.value = ''
                              }
                            }}
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="gap-3">
                  <Button variant="outline" onClick={() => setNewReminderDialogOpen(false)} className="h-10">
                    Cancel
                  </Button>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => handleCreateReminder()} className="h-10 px-6">
                      Create Reminder
                    </Button>
                  </motion.div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border"
          >
            <span className="font-medium">
              {selectedReminders.length} reminder{selectedReminders.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('complete')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search reminders by title, description, location, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <Select value={sortBy} onValueChange={(value: 'date' | 'priority' | 'space') => setSortBy(value)}>
              <SelectTrigger className="w-32 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="space">By Space</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-muted/20 rounded-xl border space-y-4"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === 'high-priority' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('high-priority')}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  High Priority
                </Button>
                <Button
                  variant={activeFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('today')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Today
                </Button>
                <Button
                  variant={activeFilter === 'this-week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('this-week')}
                >
                  This Week
                </Button>
                <Button
                  variant={activeFilter === 'overdue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('overdue')}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Overdue
                </Button>
                <Button
                  variant={activeFilter === 'recurring' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('recurring')}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Recurring
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => {
            if (value === "all" || value === "upcoming" || value === "overdue" || value === "completed") {
              setActiveTab(value as typeof activeTab)
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
            <TabsTrigger value="all" className="font-semibold">All Reminders</TabsTrigger>
            <TabsTrigger value="upcoming" className="font-semibold">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="overdue" className="font-semibold">
              <AlertCircle className="h-4 w-4 mr-2" />
              Overdue
            </TabsTrigger>
            <TabsTrigger value="completed" className="font-semibold">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Reminders Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {reminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-gradient-to-br from-muted/10 to-muted/5"
          >
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                className="p-4 bg-primary/10 rounded-2xl"
              >
                <Calendar className="h-16 w-16 text-primary/60" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {searchQuery 
                    ? `No reminders found for "${searchQuery}"`
                    : activeTab === 'completed'
                      ? 'No completed reminders yet'
                      : activeTab === 'overdue'
                        ? 'No overdue reminders'
                        : activeTab === 'upcoming'
                          ? 'No upcoming reminders'
                          : 'No reminders yet'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search terms or clear filters'
                    : activeTab === 'completed'
                      ? 'Completed reminders will appear here'
                      : 'Create your first reminder to get started!'
                  }
                </p>
              </div>
              {!searchQuery && activeTab === 'all' && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-12 px-6 border-2 border-primary/20 hover:border-primary/40"
                    onClick={() => setNewReminderDialogOpen(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Reminder
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              viewMode === 'card' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" :
              viewMode === 'list' ? "space-y-3" :
              "grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredRemindersList.map((reminder) => {
                const spaceDetails = getSpaceDetails(reminder.space_id)
                const IconComponent = getIconComponent(spaceDetails.icon)
                const PriorityIcon = getPriorityIcon(reminder.priority)
                const reminderDate = dayjs(reminder.due_date)
                const isOverdue = reminderDate.isBefore(dayjs()) && reminder.status === 'pending'
                const isSelected = selectedReminders.includes(reminder.id)
                
                return (
                  <motion.div
                    key={reminder.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer",
                      getStatusColor(reminder.status, isOverdue),
                      isSelected && "ring-2 ring-primary",
                      isSelectionMode && "hover:ring-2 hover:ring-primary/50"
                    )}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (isSelected) {
                          setSelectedReminders(prev => prev.filter(id => id !== reminder.id))
                        } else {
                          setSelectedReminders(prev => [...prev, reminder.id])
                        }
                      }
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              {isSelectionMode && (
                                <Checkbox checked={isSelected} />
                              )}
                              
                              <div className={cn("p-2 rounded-lg shadow-sm", spaceDetails.color)}>
                                <IconComponent className="h-4 w-4 text-white" />
                              </div>
                              
                              <CardTitle className="text-lg font-semibold line-clamp-2">
                                {reminder.title}
                              </CardTitle>
                            </div>
                            
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 ml-11">
                                {reminder.description}
                              </p>
                            )}

                            {reminder.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-11">
                                <MapPin className="h-3 w-3" />
                                <span>{reminder.location}</span>
                              </div>
                            )}

                            {reminder.tags && reminder.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-11">
                                {reminder.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {reminder.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{reminder.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {!isSelectionMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/60 hover:bg-white/80 backdrop-blur-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {reminder.status === 'pending' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handleCompleteReminder(reminder.id)
                                  }}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingReminder(reminder)
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  shareReminder(reminder)
                                }}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDismissReminder(reminder.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(
                              "font-medium",
                              isOverdue ? "text-red-600" : "text-muted-foreground"
                            )}>
                              {formatReminderTime(reminder.due_date)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs font-medium", getPriorityColor(reminder.priority || 'medium'))}
                              >
                                <PriorityIcon className="h-3 w-3 mr-1" />
                                {reminder.priority || 'medium'}
                              </Badge>
                              
                              {reminder.repeat_frequency !== 'none' && (
                                <Badge variant="secondary" className="text-xs">
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  {reminder.repeat_frequency}
                                </Badge>
                              )}
                            </div>
                            
                            {reminder.status === 'completed' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            
                            {isOverdue && reminder.status === 'pending' && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Reminder Dialog */}
      {editingReminder && (
        <Dialog open={!!editingReminder} onOpenChange={() => setEditingReminder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Edit className="h-6 w-6 text-primary" />
                </div>
                Edit Reminder
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <Input
                value={editingReminder.title}
                onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                placeholder="Reminder title..."
                className="h-12 text-lg"
              />
              
              <Textarea
                value={editingReminder.description || ''}
                onChange={(e) => setEditingReminder({ ...editingReminder, description: e.target.value })}
                placeholder="Description..."
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editingReminder.due_date ? dayjs(editingReminder.due_date).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) => setEditingReminder({ 
                      ...editingReminder, 
                      due_date: e.target.value ? dayjs(e.target.value).toISOString() : ''
                    })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editingReminder.priority || 'medium'}
                    onValueChange={(value: Priority) => setEditingReminder({ ...editingReminder, priority: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Input
                value={editingReminder.location || ''}
                onChange={(e) => setEditingReminder({ ...editingReminder, location: e.target.value })}
                placeholder="Location (optional)..."
                className="h-12"
              />
            </div>
            
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setEditingReminder(null)} className="h-10">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => {
                  if (editingReminder) {
                    handleUpdateReminder(editingReminder.id, {
                      title: editingReminder.title,
                      description: editingReminder.description,
                      due_date: editingReminder.due_date,
                      priority: editingReminder.priority,
                      location: editingReminder.location
                    })
                    setEditingReminder(null)
                  }
                }} className="h-10 px-6">
                  Save Changes
                </Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}