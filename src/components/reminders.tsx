"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Trash2, Calendar, Bell, AlertCircle, CheckCircle, Flag, 
  Home, Briefcase, GraduationCap, ShoppingBasket, Car, Utensils, 
  Heart, Plane, Dumbbell, Music, Film, BookOpen, Smile, Wallet,
  Gift, Zap, Coffee, Compass, Check, PenSquare, Settings, PencilRuler,
  Edit, MoreVertical, Clock, Search, Filter
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { 
  getReminders, 
  createReminder, 
  updateReminder,
  completeReminder,
  dismissReminder,
  getUpcomingReminders,
  getOverdueReminders,
  subscribeToReminderChanges 
} from '@/lib/utils/database/reminders'
import { 
  getReminderSpaces, 
  createReminderSpace, 
  updateReminderSpace, 
  deleteReminderSpace,
  getDefaultReminderSpace,
  type ReminderSpace 
} from '@/lib/utils/database/reminder-spaces'
import { Database } from '@/lib/types/database'
import { format, isToday, isTomorrow, isYesterday, isPast, isFuture } from 'date-fns'
import { toast } from 'sonner'

// Define types
type Priority = "low" | "medium" | "high"
type Reminder = Database['public']['Tables']['reminders']['Row']

// Available icons for spaces
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
const formatReminderTime = (dateString: string): string => {
  const date = new Date(dateString)
  
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`
  } else {
    return format(date, 'MMM d, yyyy h:mm a')
  }
}

const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'high': return 'text-red-500 bg-red-50 border-red-200'
    case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
    case 'low': return 'text-green-500 bg-green-50 border-green-200'
    default: return 'text-gray-500 bg-gray-50 border-gray-200'
  }
}

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case 'high': return AlertCircle
    case 'medium': return Flag
    case 'low': return CheckCircle
    default: return Flag
  }
}

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [spaces, setSpaces] = useState<ReminderSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "overdue" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // New reminder form state
  const [newReminderDialogOpen, setNewReminderDialogOpen] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminder_time: '',
    repeat_frequency: 'none' as const,
    priority: 'medium' as Priority,
    space_id: ''
  })
  
  // New space form state
  const [newSpaceDialogOpen, setNewSpaceDialogOpen] = useState(false)
  const [newSpace, setNewSpace] = useState({
    name: '',
    icon: 'Bell',
    color: 'bg-blue-500'
  })

  useEffect(() => {
    if (!user) return

    initializeData()

    // Subscribe to real-time updates
    const subscription = subscribeToReminderChanges(user.id, (payload) => {
      console.log('Real-time reminder update:', payload)
      handleRealTimeUpdate(payload)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const initializeData = async () => {
    if (!user) return
    
    try {
      // Fetch spaces first
      const spacesData = await getReminderSpaces(user.id)
      
      // If no spaces exist, create a default one
      if (spacesData.length === 0) {
        const defaultSpace = await getDefaultReminderSpace(user.id)
        setSpaces([defaultSpace])
        setNewReminder(prev => ({ ...prev, space_id: defaultSpace.id }))
      } else {
        setSpaces(spacesData)
        setNewReminder(prev => ({ ...prev, space_id: spacesData[0].id }))
      }
      
      // Fetch reminders
      await fetchReminders()
    } catch (error) {
      console.error('Error initializing data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRealTimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      fetchReminders()
    }
  }

  const fetchReminders = async () => {
    if (!user) return
    try {
      const data = await getReminders(user.id)
      setReminders(data)
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Failed to load reminders')
    }
  }

  const handleCreateReminder = async () => {
    if (!user || !newReminder.title.trim()) return

    // Set default time if not provided
    const reminderTime = newReminder.reminder_time || 
      new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now

    try {
      const reminderData = await createReminder(user.id, {
        title: newReminder.title.trim(),
        description: newReminder.description.trim() || undefined,
        reminder_time: reminderTime,
        repeat_frequency: newReminder.repeat_frequency,
        priority: newReminder.priority,
        space_id: newReminder.space_id
      })
      
      // Optimistic update
      setReminders(prev => [reminderData, ...prev])
      
      // Reset form
      setNewReminder({
        title: '',
        description: '',
        reminder_time: '',
        repeat_frequency: 'none',
        priority: 'medium',
        space_id: spaces[0]?.id || ''
      })
      setNewReminderDialogOpen(false)
      
      toast.success('Reminder created successfully')
      
      // Refetch to ensure consistency
      setTimeout(fetchReminders, 100)
    } catch (error) {
      console.error('Error creating reminder:', error)
      toast.error('Failed to create reminder')
    }
  }

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      // Optimistic update
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, status: 'completed' as const } : r
      ))
      
      await completeReminder(reminderId)
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
      
      await dismissReminder(reminderId)
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
        color: newSpace.color
      })
      
      setSpaces(prev => [...prev, spaceData])
      setNewSpace({ name: '', icon: 'Bell', color: 'bg-blue-500' })
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

  // Filter reminders based on active tab and search
  const filteredReminders = reminders.filter(reminder => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        reminder.title.toLowerCase().includes(query) ||
        (reminder.description && reminder.description.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        return reminder.status === 'pending' && isFuture(new Date(reminder.reminder_time))
      case 'overdue':
        return reminder.status === 'pending' && isPast(new Date(reminder.reminder_time))
      case 'completed':
        return reminder.status === 'completed'
      default:
        return reminder.status === 'pending'
    }
  })

  // Get space details
  const getSpaceDetails = (spaceId: string | null) => {
    if (!spaceId) return { name: 'General', icon: 'Bell', color: 'bg-blue-500' }
    const space = spaces.find(s => s.id === spaceId)
    return space || { name: 'General', icon: 'Bell', color: 'bg-blue-500' }
  }

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(i => i.name === iconName)
    return iconData?.icon || Bell
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <Bell className="h-5 w-5 text-blue-500" />
          </motion.div>
        </div>
        
        <div className="flex gap-2">
          {/* New Space Button */}
          <Dialog open={newSpaceDialogOpen} onOpenChange={setNewSpaceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Spaces
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Spaces</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Create new space */}
                <div className="space-y-3 border-b pb-4">
                  <h4 className="font-medium">Create New Space</h4>
                  <Input
                    placeholder="Space name..."
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  />
                  
                  <div className="grid grid-cols-6 gap-2">
                    {availableIcons.slice(0, 12).map((iconItem) => {
                      const IconComponent = iconItem.icon
                      return (
                        <button
                          key={iconItem.name}
                          onClick={() => setNewSpace({ ...newSpace, icon: iconItem.name })}
                          className={cn(
                            "p-2 rounded-md border",
                            newSpace.icon === iconItem.name ? "border-primary bg-primary/10" : "border-border"
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewSpace({ ...newSpace, color: color.value })}
                        className={cn(
                          "h-8 rounded-md border-2",
                          color.value,
                          newSpace.color === color.value ? "border-foreground" : "border-transparent"
                        )}
                      />
                    ))}
                  </div>
                  
                  <Button onClick={handleCreateSpace} className="w-full">
                    Create Space
                  </Button>
                </div>

                {/* Existing spaces */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="font-medium">Existing Spaces</h4>
                  {spaces.map((space) => {
                    const IconComponent = getIconComponent(space.icon)
                    return (
                      <div key={space.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-md", space.color)}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm">{space.name}</span>
                        </div>
                        {space.name !== 'General' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSpace(space.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Reminder Button */}
          <Dialog open={newReminderDialogOpen} onOpenChange={setNewReminderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Reminder</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-title">Title</Label>
                  <Input
                    id="reminder-title"
                    placeholder="What do you need to remember?"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-description">Description (optional)</Label>
                  <Textarea
                    id="reminder-description"
                    placeholder="Additional details..."
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-time">When?</Label>
                  <Input
                    id="reminder-time"
                    type="datetime-local"
                    value={newReminder.reminder_time}
                    onChange={(e) => setNewReminder({ ...newReminder, reminder_time: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newReminder.priority}
                      onValueChange={(value: Priority) => setNewReminder({ ...newReminder, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Repeat</Label>
                    <Select
                      value={newReminder.repeat_frequency}
                      onValueChange={(value) => setNewReminder({ ...newReminder, repeat_frequency: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Space</Label>
                  <Select
                    value={newReminder.space_id}
                    onValueChange={(value) => setNewReminder({ ...newReminder, space_id: value })}
                  >
                    <SelectTrigger>
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
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewReminderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReminder}>
                  Create Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Reminders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filteredReminders.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4 mx-auto" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No reminders found for "${searchQuery}"`
                : activeTab === 'completed'
                  ? 'No completed reminders yet'
                  : activeTab === 'overdue'
                    ? 'No overdue reminders'
                    : activeTab === 'upcoming'
                      ? 'No upcoming reminders'
                      : 'No reminders yet. Create your first reminder!'
              }
            </p>
            {!searchQuery && activeTab === 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setNewReminderDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Reminder
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredReminders.map((reminder) => {
                const spaceDetails = getSpaceDetails(reminder.space_id)
                const IconComponent = getIconComponent(spaceDetails.icon)
                const PriorityIcon = getPriorityIcon(reminder.priority || 'medium')
                const isOverdue = isPast(new Date(reminder.reminder_time)) && reminder.status === 'pending'
                
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all duration-200 hover:shadow-md",
                      reminder.status === 'completed' && "border-green-500 bg-green-50/30",
                      isOverdue && "border-red-500 bg-red-50/30"
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={cn("p-1.5 rounded-md", spaceDetails.color)}>
                                <IconComponent className="h-3 w-3 text-white" />
                              </div>
                              <CardTitle className="text-sm font-medium">
                                {reminder.title}
                              </CardTitle>
                            </div>
                            
                            {reminder.description && (
                              <p className="text-xs text-muted-foreground">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {reminder.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleCompleteReminder(reminder.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDismissReminder(reminder.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className={isOverdue ? "text-red-600" : ""}>
                              {formatReminderTime(reminder.reminder_time)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getPriorityColor(reminder.priority || 'medium'))}
                              >
                                <PriorityIcon className="h-3 w-3 mr-1" />
                                {reminder.priority || 'medium'}
                              </Badge>
                              
                              {reminder.repeat_frequency !== 'none' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  {reminder.repeat_frequency}
                                </Badge>
                              )}
                            </div>
                            
                            {reminder.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}