"use client"

import { useState, useEffect, useCallback } from "react"
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
  AlertTriangle,
  Loader2,
  StickyNote
} from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { getHabits, type HabitWithCompletions } from '@/lib/utils/database/habits'
import { getTodos, type TodoWithRelations } from '@/lib/utils/database/todos'
import { getReminders } from '@/lib/utils/database/reminders'
import { getNotes } from '@/lib/utils/database/notes'
import { Database } from '@/lib/types/database'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { toast } from 'sonner'

// Initialize dayjs plugins
dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isTomorrow)
dayjs.extend(customParseFormat)

// Define activity item interface
interface ActivityItem {
  id: string;
  type: "habit" | "todo" | "reminder" | "note";
  title: string;
  date: dayjs.Dayjs;
  isCompleted: boolean;
  category?: "builder" | "quitter"; // For habits
  urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future";
  daysUntil: number;
  description?: string;
  priority?: string;
  tags?: string[];
}

type Reminder = Database['public']['Tables']['reminders']['Row']
type Note = Database['public']['Tables']['notes']['Row']

// Define filter options
type ActivityFilter = "all" | "habits" | "todos" | "reminders" | "notes"
type TimelineFilter = "all" | "overdue" | "today" | "upcoming" | "future"

// Helper function to parse habit metadata
const parseHabitMetadata = (description: string | null) => {
  if (!description) return { type: 'builder', frequency_days: [] }
  
  try {
    const parsed = JSON.parse(description)
    return {
      type: parsed.type || 'builder',
      frequency_days: parsed.frequency_days || []
    }
  } catch {
    return { type: 'builder', frequency_days: [] }
  }
}

// Helper function to check if habit is completed on date
const isHabitCompletedOnDate = (habit: HabitWithCompletions, date: dayjs.Dayjs): boolean => {
  const dateStr = date.format('YYYY-MM-DD')
  return habit.habit_completions.some(completion => 
    completion.completed_at.split('T')[0] === dateStr
  )
}

// Helper function to check if habit is due on date
const isHabitDueOnDate = (habit: HabitWithCompletions, date: dayjs.Dayjs): boolean => {
  const metadata = parseHabitMetadata(habit.description)
  if (metadata.frequency_days.length === 0) return true // Daily habit
  
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.day()]
  return metadata.frequency_days.includes(dayOfWeek)
}

export default function ActivityStream() {
  const { user } = useAuth()
  
  // State for activities, filters, and search
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([])
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  
  // Process data into activity items
  const processActivities = useCallback((
    habitList: HabitWithCompletions[], 
    todoList: TodoWithRelations[], 
    reminderList: Reminder[],
    noteList: Note[]
  ) => {
    const today = dayjs()
    const allActivities: ActivityItem[] = []
    
    // Process habits - look ahead 7 days
    habitList.forEach(habit => {
      for (let i = 0; i < 7; i++) {
        const date = today.add(i, 'day')
        
        if (isHabitDueOnDate(habit, date)) {
          const completed = isHabitCompletedOnDate(habit, date)
          const metadata = parseHabitMetadata(habit.description)
          
          let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
          if (date.isToday()) urgency = "today"
          else if (date.isTomorrow()) urgency = "tomorrow" 
          else if (date.isBefore(today) && !completed) urgency = "overdue"
          else if (date.diff(today, 'day') > 3) urgency = "future"
          
          allActivities.push({
            id: `${habit.id}-${date.format('YYYY-MM-DD')}`,
            type: "habit",
            title: habit.title,
            date: date,
            isCompleted: completed,
            category: metadata.type as "builder" | "quitter",
            urgency,
            daysUntil: date.diff(today, 'day'),
            description: habit.description || undefined
          })
        }
      }
    })
    
    // Process todos
    todoList.forEach(todo => {
      // Use creation date as activity date (or due_date if available)
      const date = todo.due_date ? dayjs(todo.due_date) : dayjs(todo.created_at)
      
      let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
      if (date.isToday()) urgency = "today"
      else if (date.isTomorrow()) urgency = "tomorrow" 
      else if (date.isBefore(today) && todo.status === 'pending') urgency = "overdue"
      else if (date.diff(today, 'day') > 3) urgency = "future"
      
      allActivities.push({
        id: todo.id,
        type: "todo",
        title: todo.title,
        date,
        isCompleted: todo.status === 'completed',
        urgency,
        daysUntil: date.diff(today, 'day'),
        description: todo.description || undefined,
        priority: todo.priority || undefined
      })
    })
    
    // Process reminders
    reminderList.forEach(reminder => {
      const date = dayjs(reminder.reminder_time)
      
      let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
      if (date.isToday()) urgency = "today"
      else if (date.isTomorrow()) urgency = "tomorrow" 
      else if (date.isBefore(today) && reminder.status === 'pending') urgency = "overdue"
      else if (date.diff(today, 'day') > 3) urgency = "future"
      
      allActivities.push({
        id: reminder.id,
        type: "reminder",
        title: reminder.title,
        date,
        isCompleted: reminder.status === 'completed',
        urgency,
        daysUntil: date.diff(today, 'day'),
        description: reminder.description || undefined,
        priority: reminder.priority || undefined
      })
    })
    
    // Process notes (recent ones only - last 7 days)
    noteList.forEach(note => {
      const date = dayjs(note.updated_at)
      const daysSinceUpdate = today.diff(date, 'day')
      
      // Only show notes from the last 7 days
      if (daysSinceUpdate <= 7) {
        let urgency: "overdue" | "today" | "tomorrow" | "upcoming" | "future" = "upcoming"
        if (date.isToday()) urgency = "today"
        else if (date.isTomorrow()) urgency = "tomorrow" 
        else if (date.diff(today, 'day') > 3) urgency = "future"
        
        allActivities.push({
          id: note.id,
          type: "note",
          title: note.title,
          date,
          isCompleted: false, // Notes don't have completion status
          urgency,
          daysUntil: date.diff(today, 'day'),
          description: note.content || undefined,
          tags: note.tags || undefined
        })
      }
    })
    
    // Sort activities by urgency priority then by date
    allActivities.sort((a, b) => {
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
      return a.date.valueOf() - b.date.valueOf()
    })
    
    setActivities(allActivities)
  }, [])
  
  // Load all activities from database
  const loadActivities = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const [habitsData, todosData, remindersData, notesData] = await Promise.all([
        getHabits(user.id),
        getTodos(user.id),
        getReminders(user.id),
        getNotes(user.id)
      ])
      
      // Process all data into activities
      processActivities(
        habitsData,
        todosData.filter(todo => todo.status !== 'archived'),
        remindersData.map(reminder => ({
          ...reminder,
          reminder_time: reminder.due_date,
          repeat_frequency: null,
          status: reminder.completed ? 'completed' as const : 'pending' as const,
          priority: null,
          completed_at: reminder.completed ? reminder.updated_at : null,
          updated_at: reminder.updated_at || reminder.created_at,
          is_recurring: false,
          reminder_metadata: null
        })),
        notesData.map(note => ({
          ...note,
          content: note.content || null,
          color: null,
          tags: null,
          note_type: 'text' as const,
          metadata: null,
          space_id: null,
          is_pinned: false,
          is_archived: false,
          updated_at: note.updated_at || note.created_at,
          word_count: note.content ? note.content.split(/\s+/).length : 0,
          character_count: note.content ? note.content.length : 0
        }))
      )
      
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [user, processActivities])
  
  // Load data on component mount
  useEffect(() => {
    if (!user) return
    
    loadActivities()
  }, [user, loadActivities])
  
  // Apply filters to activities
  const applyFilters = useCallback(() => {
    let filtered = [...activities]
    
    // Apply activity type filter
    if (activityFilter !== "all") {
      // Convert plural filter name to singular type
      const typeFilter = activityFilter === "habits" ? "habit" : 
                        activityFilter === "todos" ? "todo" : 
                        activityFilter === "reminders" ? "reminder" : "note"
      
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
        activity.title.toLowerCase().includes(query) ||
        (activity.description && activity.description.toLowerCase().includes(query)) ||
        (activity.tags && activity.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }
    
    setFilteredActivities(filtered)
  }, [activities, activityFilter, timelineFilter, searchQuery])
  
  // Apply filters whenever they change
  useEffect(() => {
    if (!loading) {
      applyFilters()
    }
  }, [activities, activityFilter, timelineFilter, searchQuery, loading, applyFilters])
  
  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  // Format date for display
  const formatActivityDate = (date: dayjs.Dayjs) => {
    if (date.isToday()) {
      return `Today, ${date.format("h:mm A")}`
    } else if (date.isTomorrow()) {
      return `Tomorrow, ${date.format("h:mm A")}`
    } else if (Math.abs(date.diff(dayjs(), 'day')) < 7) {
      return date.format("dddd, h:mm A") // Day of week
    } else {
      return date.format("MMM D, YYYY")
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
      case "note":
        return <StickyNote className="h-4 w-4 text-blue-500" />
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading activities...</span>
        </div>
      </div>
    )
  }
  
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
                <TabsTrigger value="notes" className="flex-1 text-xs">Notes</TabsTrigger>
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{section.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        
                        {activity.priority && activity.priority !== 'medium' && (
                          <Badge 
                            variant={activity.priority === 'high' ? 'destructive' : 'secondary'} 
                            className="text-[10px] h-4 px-1"
                          >
                            {activity.priority}
                          </Badge>
                        )}
                        
                        {activity.isCompleted && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            Completed
                          </Badge>
                        )}
                        
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex gap-1">
                            {activity.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-[10px] h-4 px-1">
                                #{tag}
                              </Badge>
                            ))}
                            {activity.tags.length > 2 && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                +{activity.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Description */}
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      
                      {/* Time information */}
                      <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-2">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatActivityDate(activity.date)}
                        </div>
                        
                        {activity.type === "habit" && activity.daysUntil >= 0 && activity.daysUntil < 3 && !activity.isCompleted && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-0.5">
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