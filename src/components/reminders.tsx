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

// Define types
type Priority = "low" | "medium" | "high"

type Space = {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

type Reminder = {
  id: string
  text: string
  date: string
  completed: boolean
  createdAt: string
  priority: Priority
  spaceId: string // Reference to which space this reminder belongs to
}

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
  // State for reminders
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    // This function only runs once during initial render
    if (typeof window !== 'undefined') {
      const storedReminders = localStorage.getItem('reminders')
      if (storedReminders) {
        try {
          const parsed = JSON.parse(storedReminders)
          
          // Handle migration from old format
          const migratedReminders = parsed.map((reminder: any) => ({
            ...reminder,
            priority: reminder.priority || "medium",
            spaceId: reminder.spaceId || "default"
          }))
          
          return Array.isArray(migratedReminders) ? migratedReminders : []
        } catch (error) {
          console.error('Error parsing initial reminders:', error)
        }
      }
    }
    return []
  })
    
  // Function to get default space
  const getDefaultSpace = (): Space => {
    return {
      id: "default",
      name: "Default",
      icon: "Bell",
      color: "bg-blue-500",
      createdAt: new Date().toISOString()
    }
  }
  
  // State for spaces
  const [spaces, setSpaces] = useState<Space[]>(() => {
    if (typeof window !== 'undefined') {
      const storedSpaces = localStorage.getItem('reminderSpaces')
      if (storedSpaces) {
        try {
          const parsed = JSON.parse(storedSpaces)
          return Array.isArray(parsed) ? parsed : [getDefaultSpace()]
        } catch (error) {
          console.error('Error parsing initial spaces:', error)
          return [getDefaultSpace()]
        }
      } else {
        // Create default space if none exists
        return [getDefaultSpace()]
      }
    }
    return [getDefaultSpace()]
  })

  // UI state
  const [newReminderText, setNewReminderText] = useState("")
  const [newReminderDate, setNewReminderDate] = useState("")
  const [newReminderPriority, setNewReminderPriority] = useState<Priority>("medium")
  const [newReminderSpaceId, setNewReminderSpaceId] = useState("default")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedSpaceId, setSelectedSpaceId] = useState("all")
  
  // Space management state
  const [spaceDrawerOpen, setSpaceDrawerOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState("")
  const [newSpaceIcon, setNewSpaceIcon] = useState("Bell")
  const [newSpaceColor, setNewSpaceColor] = useState("bg-blue-500")
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null)
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const loadedReminders = getRemindersFromLocalStorage()
    const loadedSpaces = getSpacesFromLocalStorage()
    
    // Only set reminders and spaces if we actually found some
    if (loadedReminders.length > 0) {
      setReminders(loadedReminders)
    }
    
    if (loadedSpaces.length > 0) {
      setSpaces(loadedSpaces)
    } else {
      // Ensure we always have at least the default space
      setSpaces([getDefaultSpace()])
    }
  }, [])

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    saveRemindersToLocalStorage(reminders)
  }, [reminders])
  
  // Save spaces to localStorage whenever they change
  useEffect(() => {
    saveSpacesToLocalStorage(spaces)
  }, [spaces])

  // Add new reminder
  const addReminder = () => {
    if (!newReminderText.trim() || !newReminderDate) return

    const reminder: Reminder = {
      id: generateId(),
      text: newReminderText,
      date: newReminderDate,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: newReminderPriority,
      spaceId: newReminderSpaceId
    }

    setReminders(prevReminders => [...prevReminders, reminder])
    setNewReminderText("")
    setNewReminderDate("")
    setNewReminderPriority("medium")
    setDialogOpen(false)
  }

  // Toggle reminder completion
  const toggleReminder = (id: string) => {
    setReminders(prevReminders => 
      prevReminders.map((reminder) => (
        reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
      ))
    )
  }

  // Delete reminder
  const deleteReminder = (id: string) => {
    setReminders(prevReminders => prevReminders.filter((reminder) => reminder.id !== id))
  }

  // Update reminder priority
  const updateReminderPriority = (id: string, priority: Priority) => {
    setReminders(prevReminders => 
      prevReminders.map((reminder) => (
        reminder.id === id ? { ...reminder, priority } : reminder
      ))
    )
  }
  
  // Add new space
  const addSpace = () => {
    if (!newSpaceName.trim()) return

    const space: Space = {
      id: generateId(),
      name: newSpaceName,
      icon: newSpaceIcon,
      color: newSpaceColor,
      createdAt: new Date().toISOString()
    }

    setSpaces(prevSpaces => [...prevSpaces, space])
    setNewSpaceName("")
    setNewSpaceIcon("Bell")
    setNewSpaceColor("bg-blue-500")
  }
  
  // Start editing a space
  const startEditSpace = (space: Space) => {
    setEditingSpaceId(space.id)
    setNewSpaceName(space.name)
    setNewSpaceIcon(space.icon)
    setNewSpaceColor(space.color)
  }
  
  // Save edited space
  const saveEditSpace = () => {
    if (!editingSpaceId || !newSpaceName.trim()) return
    
    setSpaces(prevSpaces => 
      prevSpaces.map(space => 
        space.id === editingSpaceId 
          ? { ...space, name: newSpaceName, icon: newSpaceIcon, color: newSpaceColor }
          : space
      )
    )
    
    setEditingSpaceId(null)
    setNewSpaceName("")
    setNewSpaceIcon("Bell")
    setNewSpaceColor("bg-blue-500")
  }
  
  // Delete space and its reminders (except default space)
  const deleteSpace = (spaceId: string) => {
    if (spaceId === "default") return // Prevent deleting default space
    
    // Delete all reminders in this space
    setReminders(prevReminders => 
      prevReminders.filter(reminder => reminder.spaceId !== spaceId)
    )
    
    // Delete the space
    setSpaces(prevSpaces => prevSpaces.filter(space => space.id !== spaceId))
    
    // If we're currently viewing the deleted space, switch to all spaces
    if (selectedSpaceId === spaceId) {
      setSelectedSpaceId("all")
    }
  }

  // Filter reminders based on active tab and selected space
  const filteredReminders = reminders.filter(reminder => {
    // First, filter by space
    if (selectedSpaceId !== "all" && reminder.spaceId !== selectedSpaceId) {
      return false
    }
    
    // Then filter by tab
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

  // Helper functions for UI
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
  
  // Get the icon component for a space
  const getSpaceIcon = (iconName: string) => {
    const iconObj = availableIcons.find(icon => icon.name === iconName)
    if (!iconObj) return <Bell className="h-5 w-5" />
    
    const IconComponent = iconObj.icon
    return <IconComponent className="h-5 w-5" />
  }

  // Calculate counts for tabs
  const remindersCount = {
    all: filteredReminders.length,
    active: filteredReminders.filter(r => !r.completed).length,
    completed: filteredReminders.filter(r => r.completed).length,
    high: filteredReminders.filter(r => r.priority === "high" && !r.completed).length,
    medium: filteredReminders.filter(r => r.priority === "medium" && !r.completed).length,
    low: filteredReminders.filter(r => r.priority === "low" && !r.completed).length,
  }

  return (
    <div className="space-y-6">
      {/* Header with add reminder button */}
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
        <div className="flex items-center gap-2">
          <Drawer open={spaceDrawerOpen} onOpenChange={setSpaceDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                <Settings className="h-4 w-4 mr-2" />
                <span>Manage Spaces</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Manage Reminder Spaces</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                {/* Add new space form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {editingSpaceId ? "Edit Space" : "Add New Space"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="space-name">Name</Label>
                        <Input
                          id="space-name"
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                          placeholder="e.g., Home, Work, School..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {availableIcons.slice(0, 24).map((iconObj) => {
                            const IconComponent = iconObj.icon
                            return (
                              <Button
                                key={iconObj.name}
                                type="button"
                                variant={newSpaceIcon === iconObj.name ? "default" : "outline"}
                                className="h-10 w-10 p-0"
                                onClick={() => setNewSpaceIcon(iconObj.name)}
                              >
                                <IconComponent className="h-5 w-5" />
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((colorObj) => (
                            <Button
                              key={colorObj.name}
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-8 w-8 rounded-full p-0 border-2", 
                                newSpaceColor === colorObj.value ? "border-primary" : "border-transparent"
                              )}
                              onClick={() => setNewSpaceColor(colorObj.value)}
                            >
                              <span className={cn("h-6 w-6 rounded-full", colorObj.value)} />
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        {editingSpaceId && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditingSpaceId(null)
                              setNewSpaceName("")
                              setNewSpaceIcon("Bell")
                              setNewSpaceColor("bg-blue-500")
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button onClick={editingSpaceId ? saveEditSpace : addSpace}>
                          {editingSpaceId ? "Save Changes" : "Add Space"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* List of existing spaces */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Your Spaces</h3>
                  <ScrollArea className="h-[300px]">
                    {spaces.map((space) => (
                      <Card key={space.id} className="mb-2">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full", space.color)}>
                              {getSpaceIcon(space.icon)}
                            </div>
                            <span>{space.name}</span>
                            {space.id === "default" && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => startEditSpace(space)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {space.id !== "default" && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteSpace(space.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                </div>
              </div>
              <DrawerFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setSpaceDrawerOpen(false)}
                >
                  Close
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          
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
                  <Label htmlFor="reminder-space" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Space
                  </Label>
                  <Select 
                    value={newReminderSpaceId} 
                    onValueChange={setNewReminderSpaceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1 rounded-full", space.color)}>
                              {getSpaceIcon(space.icon)}
                            </div>
                            <span>{space.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        </div>
      </motion.div>

      {/* Space selector */}
      {spaces.length > 0 && (
        <div className="flex overflow-x-auto pb-2 gap-2">
          <Button
            variant={selectedSpaceId === "all" ? "default" : "outline"}
            className="rounded-full whitespace-nowrap"
            onClick={() => setSelectedSpaceId("all")}
          >
            <span>All Spaces</span>
          </Button>
          
          {spaces.map(space => (
            <Button
              key={space.id}
              variant={selectedSpaceId === space.id ? "default" : "outline"}
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedSpaceId(space.id)}
            >
              <div className={cn("p-1 rounded-full mr-2", space.color)}>
                {getSpaceIcon(space.icon)}
              </div>
              <span>{space.name}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Priority and status filters */}
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

      {/* Empty state */}
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
          <p className="text-muted-foreground">
            {selectedSpaceId !== "all" ? 
              "No reminders in this space match the current filter." : 
              "No reminders match the current filter."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => {
            // Find the space this reminder belongs to
            const reminderSpace = spaces.find(space => space.id === reminder.spaceId) || spaces[0];
            
            return (
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
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(reminder.date)}
                        </span>
                        
                        {/* Space badge */}
                        <span className="flex items-center gap-1">
                          <div className={cn("h-3 w-3 rounded-full", reminderSpace.color)} />
                          {reminderSpace.name}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Select 
                              value={reminder.priority}
                              onValueChange={(value) => updateReminderPriority(reminder.id, value as Priority)}
                            >
                              <SelectTrigger className="border-0 p-0 h-6 w-full">
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
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Select 
                              value={reminder.spaceId}
                              onValueChange={(value) => {
                                setReminders(prevReminders => 
                                  prevReminders.map(r => 
                                    r.id === reminder.id ? { ...r, spaceId: value } : r
                                  )
                                )
                              }}
                            >
                              <SelectTrigger className="border-0 p-0 h-6 w-full">
                                <SelectValue placeholder="Move to space" />
                              </SelectTrigger>
                              <SelectContent>
                                {spaces.map(space => (
                                  <SelectItem key={space.id} value={space.id} className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("p-1 rounded-full", space.color)}>
                                        {getSpaceIcon(space.icon)}
                                      </div>
                                      <span>{space.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}