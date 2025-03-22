"use client"

import { useState, useEffect, useCallback } from "react"
import { format, isToday, isTomorrow, isPast, differenceInDays,addDays } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Activity,
  Calendar,
  CheckSquare, 
  Bell, 
  ArrowUp,
  ArrowDown,
  Flame,
  Filter,
  Search,
  AlertTriangle
} from "lucide-react"
import { getHabits, getTodos, getReminders } from "@/lib/storage"

// Define activity item interface
interface ActivityItem {
  id: string;
  type: "habit" | "todo" | "reminder";
  title: string;
  date: Date;
  isCompleted: boolean;
  category?: "builder" | "quitter"; // For habits
  urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future";
  daysUntil: number;
}

// Define filter options
type ActivityFilter = "all" | "habits" | "todos" | "reminders"
type TimelineFilter = "all" | "overdue" | "today" | "upcoming" | "future"

export default function ActivityStream() {
  // State for activities, filters, and search
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([])
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  
  // Load data on component mount
  useEffect(() => {
    setMounted(true)
    loadActivities()
  }, [])
  
  // Apply filters whenever they change
 
  // Load all activities from storage
  const loadActivities = () => {
    const today = new Date()
    const habitList = getHabits()
    const todoList = getTodos().filter(todo => !todo.completed) // Only include incomplete todos
    const reminderList = getReminders()
    
    // Process habits
    const habitActivities: ActivityItem[] = []
    
    habitList.forEach(habit => {
      // For habits, we'll look ahead 7 days
      for (let i = 0; i < 7; i++) {
        const date = addDays(today, i)
        const dayOfWeek = format(date, "EEE")
        const formattedDayOfWeek = dayOfWeek === "Sun" ? "Sun" : 
                                  dayOfWeek === "Mon" ? "Mon" : 
                                  dayOfWeek === "Tue" ? "Tue" : 
                                  dayOfWeek === "Wed" ? "Wed" : 
                                  dayOfWeek === "Thu" ? "Thu" : 
                                  dayOfWeek === "Fri" ? "Fri" : "Sat"
        
        // If this habit is scheduled for this day
        if (habit.frequency.includes(formattedDayOfWeek)) {
          const dateStr = format(date, "yyyy-MM-dd")
          const completed = habit.history.some(entry => entry.date === dateStr && entry.completed)
          
          let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
          if (isToday(date)) urgency = "today"
          else if (isTomorrow(date)) urgency = "tomorrow" 
          else if (isPast(date) && !completed) urgency = "overdue"
          else if (differenceInDays(date, today) > 3) urgency = "future"
          
          habitActivities.push({
            id: `${habit.id}-${dateStr}`,
            type: "habit",
            title: habit.name,
            date: date,
            isCompleted: completed,
            category: habit.type,
            urgency,
            daysUntil: differenceInDays(date, today)
          })
        }
      }
    })
    
    // Process todos
    const todoActivities: ActivityItem[] = todoList.map(todo => {
      // For todos without explicit dates, we'll use their creation date
      const date = new Date(todo.createdAt)
      
      let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
      if (isToday(date)) urgency = "today"
      else if (isTomorrow(date)) urgency = "tomorrow" 
      else if (isPast(date)) urgency = "overdue"
      else if (differenceInDays(date, today) > 3) urgency = "future"
      
      return {
        id: todo.id,
        type: "todo",
        title: todo.text,
        date,
        isCompleted: todo.completed,
        urgency,
        daysUntil: differenceInDays(date, today)
      }
    })
    
    // Process reminders
    const reminderActivities: ActivityItem[] = reminderList.map(reminder => {
      const date = new Date(reminder.date)
      
      let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
      if (isToday(date)) urgency = "today"
      else if (isTomorrow(date)) urgency = "tomorrow" 
      else if (isPast(date) && !reminder.completed) urgency = "overdue"
      else if (differenceInDays(date, today) > 3) urgency = "future"
      
      return {
        id: reminder.id,
        type: "reminder",
        title: reminder.text,
        date,
        isCompleted: reminder.completed,
        urgency,
        daysUntil: differenceInDays(date, today)
      }
    })
    
    // Combine and sort all activities by date
    const allActivities = [...habitActivities, ...todoActivities, ...reminderActivities]
    
    // Sort by date (ascending) and urgency (overdue first)
    allActivities.sort((a, b) => {
      // First sort by urgency priority
      const urgencyPriority = {
        "overdue": 0,
        "today": 1, 
        "tomorrow": 2,
        "upcoming": 3,
        "future": 4
      }
      
      const priorityDiff = urgencyPriority[a.urgency] - urgencyPriority[b.urgency]
      
      if (priorityDiff !== 0) return priorityDiff
      
      // Then sort by date
      return a.date.getTime() - b.date.getTime()
    })
    
    setActivities(allActivities)
  }
  
  // Apply filters to activities
const applyFilters = useCallback(() => {
    let filtered = [...activities]
    
    // Apply activity type filter
    if (activityFilter !== "all") {
      // Convert plural filter name to singular type
      const typeFilter = activityFilter === "habits" ? "habit" : 
                        activityFilter === "todos" ? "todo" : "reminder"
      
      filtered = filtered.filter(activity => activity.type === typeFilter)
    }
    
    // Apply timeline filter
    if (timelineFilter !== "all") {
      filtered = filtered.filter(activity => activity.urgency === timelineFilter)
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query)
      )
    }
    
    setFilteredActivities(filtered)
  }, [activities, activityFilter, timelineFilter, searchQuery])

  useEffect(() => {
    if (!mounted) return
    
    applyFilters()
  }, [mounted, applyFilters])
  
  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  // Format date for display
  const formatActivityDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`
    } else if (differenceInDays(date, new Date()) < 7) {
      return format(date, "EEEE, h:mm a") // Day of week
    } else {
      return format(date, "MMM d, yyyy")
    }
  }
  
  // Get timeline indicator color based on urgency
  const getTimelineColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-red-500"
      case "today":
        return "bg-amber-500"
      case "tomorrow":
        return "bg-blue-500"
      case "upcoming":
        return "bg-green-500"
      case "future":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }
  
  // Get activity icon based on type
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case "habit":
        if (activity.category === "builder") {
          return <ArrowUp className="h-4 w-4 text-green-500" />
        } else {
          return <ArrowDown className="h-4 w-4 text-red-500" />
        }
      case "todo":
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case "reminder":
        return <Bell className="h-4 w-4 text-amber-500" />
      default:
        return <Activity className="h-4 w-4 text-primary" />
    }
  }
  
  // Group activities by date section
  const groupActivitiesBySection = () => {
    const sections: { title: string; items: ActivityItem[] }[] = []
    
    // Check if we have overdue items
    const overdueItems = filteredActivities.filter(a => a.urgency === "overdue" && !a.isCompleted)
    if (overdueItems.length > 0) {
      sections.push({
        title: "Overdue",
        items: overdueItems
      })
    }
    
    // Today's items
    const todayItems = filteredActivities.filter(a => a.urgency === "today")
    if (todayItems.length > 0) {
      sections.push({
        title: "Today",
        items: todayItems
      })
    }
    
    // Tomorrow's items
    const tomorrowItems = filteredActivities.filter(a => a.urgency === "tomorrow")
    if (tomorrowItems.length > 0) {
      sections.push({
        title: "Tomorrow",
        items: tomorrowItems
      })
    }
    
    // This week's items
    const upcomingItems = filteredActivities.filter(a => a.urgency === "upcoming")
    if (upcomingItems.length > 0) {
      sections.push({
        title: "Upcoming",
        items: upcomingItems
      })
    }
    
    // Future items
    const futureItems = filteredActivities.filter(a => a.urgency === "future")
    if (futureItems.length > 0) {
      sections.push({
        title: "Future",
        items: futureItems
      })
    }
    
    return sections
  }
  
  const sections = groupActivitiesBySection()
  
  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Activity Stream</h2>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tabs 
              value={activityFilter} 
              onValueChange={(value) => setActivityFilter(value as ActivityFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
                <TabsTrigger value="habits" className="flex-1 text-xs">Habits</TabsTrigger>
                <TabsTrigger value="todos" className="flex-1 text-xs">Tasks</TabsTrigger>
                <TabsTrigger value="reminders" className="flex-1 text-xs">Reminders</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Timeline filter tabs */}
      <Tabs 
        value={timelineFilter} 
        onValueChange={(value) => setTimelineFilter(value as TimelineFilter)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex-1 relative">
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 left-1"></span>
            Overdue
          </TabsTrigger>
          <TabsTrigger value="today" className="flex-1 relative">
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 left-1"></span>
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 relative">
            <span className="w-2 h-2 rounded-full bg-green-500 absolute top-1 left-1"></span>
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="future" className="flex-1 relative">
            <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-1 left-1"></span>
            Future
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Activity list */}
      <div className="space-y-8">
        {sections.length > 0 ? (
          sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-lg font-medium">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((activity) => (
                  <div 
                    key={activity.id}
                    className={`
                      relative pl-6 py-3 pr-4 border rounded-md flex items-start justify-between
                      ${activity.isCompleted ? 'bg-muted/30 border-muted-foreground/20' : 'bg-card hover:border-muted-foreground/50 transition-colors'}
                    `}
                  >
                    {/* Timeline indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getTimelineColor(activity.urgency)} rounded-l-md`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {/* Activity type icon */}
                        <span className="p-1 rounded-full bg-muted">
                          {getActivityIcon(activity)}
                        </span>
                        
                        {/* Activity title */}
                        <h4 className={`font-medium ${activity.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {activity.title}
                        </h4>
                        
                        {/* Badges */}
                        {activity.urgency === "overdue" && !activity.isCompleted && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1 flex items-center">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            Overdue
                          </Badge>
                        )}
                        
                        {activity.type === "habit" && activity.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center">
                            {activity.category === "builder" ? (
                              <>
                                <ArrowUp className="h-2.5 w-2.5 text-green-500 mr-0.5" />
                                Builder
                              </>
                            ) : (
                              <>
                                <ArrowDown className="h-2.5 w-2.5 text-red-500 mr-0.5" />
                                Quitter
                              </>
                            )}
                          </Badge>
                        )}
                        
                        {activity.isCompleted && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      {/* Time information */}
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatActivityDate(activity.date)}
                        
                        {activity.type === "habit" && activity.daysUntil >= 0 && activity.daysUntil < 3 && !activity.isCompleted && (
                          <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5 text-orange-500" />
                            Keep streak going
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-md border">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No activities found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? 
                "Try a different search term or filter." : 
                "Add some habits, tasks, or reminders to see them here."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}