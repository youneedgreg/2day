"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Trash2, ListTodo, CheckCircle2, CircleSlash, Sparkles, 
  Clock, X, Focus, AlignLeft, Edit, Timer, Target,
  Calendar, Archive, MoreVertical, Zap, TrendingUp,
  BookOpen, CheckSquare, Flame, Play, Pause, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { 
  getTodos, 
  createTodo, 
  updateTodo, 
  addNoteToTodo, 
  deleteNote, 
  updateTodoTimer,
  addTimerToTodo,
  subscribeToTodoChanges,
  type TodoWithRelations as DatabaseTodoWithRelations
} from '@/lib/utils/database/todos'
import { toast } from 'sonner'

// Define local types
type TodoPriority = 'low' | 'medium' | 'high'
type TodoWithRelations = Omit<DatabaseTodoWithRelations, 'priority'> & {
  priority: TodoPriority
}

// Mock types and data for demo
type TodoStatus = 'pending' | 'completed' | 'archived'

type TodoNote = {
  id: string
  content: string
  created_at: string
}

type TodoTimer = {
  id: string
  todo_id: string
  duration_minutes: number
  start_time: string | null
  paused_time_remaining: number | null
  is_running: boolean
  completed: boolean
  created_at: string
  updated_at: string
}

// Format time function (mm:ss)
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function TodoList() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<TodoWithRelations[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [activeTimers, setActiveTimers] = useState<{[key: string]: number}>({})
  const [selectedTodoForNote, setSelectedTodoForNote] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newTodoDialogOpen, setNewTodoDialogOpen] = useState(false)
  const [newTodoParentId, setNewTodoParentId] = useState<string | undefined>(undefined)
  const [newTodoTimerDuration, setNewTodoTimerDuration] = useState(25)
  const [newTodoHasTimer, setNewTodoHasTimer] = useState(false)
  const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>('medium')
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedTodos, setSelectedTodos] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    fetchTodos()

    // Subscribe to real-time updates
    const subscription = subscribeToTodoChanges(user.id, (payload) => {
      console.log('Real-time update:', payload)
      // Refetch todos on any change for simplicity
      // In production, you might want to handle specific events for better performance
      fetchTodos()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchTodos = async () => {
    if (!user) return
    try {
      const data = await getTodos(user.id)
      // Convert database todos to local type
      const convertedTodos: TodoWithRelations[] = data.map(todo => ({
        ...todo,
        priority: todo.priority || 'medium' // Convert null to 'medium'
      }))
      setTodos(convertedTodos)
    } catch (error) {
      console.error('Error fetching todos:', error)
      toast.error('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  // Initialize active timers from todos
  useEffect(() => {
    const timers: {[key: string]: number} = {}
    todos.forEach(todo => {
      if (todo.timer?.is_running && todo.timer.start_time) {
        const startTime = new Date(todo.timer.start_time).getTime()
        const durationMs = todo.timer.duration_minutes * 60 * 1000
        const elapsedMs = Date.now() - startTime
        const remainingMs = durationMs - elapsedMs
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
        timers[todo.id] = remainingSeconds
        if (remainingSeconds > 0) {
          setActiveTimerId(todo.id)
        }
      }
    })
    setActiveTimers(timers)
  }, [todos])

  // Timer countdown effect
  useEffect(() => {
    if (Object.keys(activeTimers).length === 0) return

    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const updated = { ...prev }
        let hasActiveTimers = false

        Object.keys(updated).forEach(todoId => {
          if (updated[todoId] > 0) {
            updated[todoId] -= 1
            hasActiveTimers = true
          } else if (updated[todoId] === 0) {
            // Timer completed
            const todo = todos.find(t => t.id === todoId)
            if (todo) {
              // Handle timer completion
              setActiveTimerId(null)
              toast.success(`Timer completed for: ${todo.title}`)
            }
            delete updated[todoId]
          }
        })

        if (!hasActiveTimers) {
          setActiveTimerId(null)
        }

        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeTimers])

  const handleCreateTodo = async () => {
    if (!user || !newTodo.trim()) return

    try {
      const todoInput = {
        title: newTodo.trim(),
        parent_id: newTodoParentId,
        ...(newTodoHasTimer && {
          timer: {
            duration_minutes: newTodoTimerDuration
          }
        })
      }

      await createTodo(user.id, todoInput)
      await fetchTodos() // Refresh the list after creating
      
      // Clear form state
      setNewTodo('')
      setNewTodoHasTimer(false)
      setNewTodoTimerDuration(25)
      setNewTodoPriority('medium')
      setNewTodoDialogOpen(false)
      setNewTodoParentId(undefined)

      toast.success('Todo created successfully')
    } catch (error) {
      console.error('Error creating todo:', error)
      toast.error('Failed to create todo')
    }
  }

  const handleToggleTodo = async (todo: TodoWithRelations) => {
    try {
      await updateTodo(todo.id, {
        status: todo.status === 'completed' ? 'pending' : 'completed',
      })
      
      // If completing a todo with a running timer, stop the timer
      if (todo.status === 'pending' && todo.timer?.is_running) {
        await updateTodoTimer(todo.id, {
          is_running: false,
          completed: true
        })
      }
      
      await fetchTodos() // Refresh the list after updating
      toast.success(todo.status === 'pending' ? 'Todo completed!' : 'Todo reopened')
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await updateTodo(todoId, { status: 'archived' })
      await fetchTodos() // Refresh the list after deleting
      toast.success('Todo deleted')
    } catch (error) {
      console.error('Error deleting todo:', error)
      toast.error('Failed to delete todo')
    }
  }

  const handleUpdateExpansion = async (todoId: string, isExpanded: boolean) => {
    try {
      await updateTodo(todoId, { is_expanded: isExpanded })
      await fetchTodos() // Refresh the list after updating
    } catch (error) {
      console.error('Error updating expansion:', error)
    }
  }

  const handleEditTodo = async (todoId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await updateTodo(todoId, { title: newTitle.trim() })
      await fetchTodos() // Refresh the list after editing
      
      // Clear editing state
      setEditingTodoId(null)
      setEditText("")
      
      toast.success('Todo updated')
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const handleAddNote = async (todoId: string) => {
    if (!newNoteContent.trim()) return
    
    try {
      await addNoteToTodo(todoId, newNoteContent.trim())
      await fetchTodos() // Refresh the list after adding note
      setNewNoteContent("")
      setSelectedTodoForNote(null)
      toast.success('Note added')
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      await fetchTodos() // Refresh the list after deleting note
      toast.success('Note deleted')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const handleAddTimer = async (todoId: string) => {
    try {
      await addTimerToTodo(todoId, 25)
      await fetchTodos() // Refresh the list after adding timer
      toast.success('Timer added')
    } catch (error) {
      console.error('Error adding timer:', error)
      toast.error('Failed to add timer')
    }
  }

  const handleStartTimer = async (todoId: string) => {
    try {
      const todo = findTodoById(todoId)
      if (!todo?.timer) return

      const startTime = todo.timer.paused_time_remaining 
        ? new Date(Date.now() - ((todo.timer.duration_minutes * 60) - todo.timer.paused_time_remaining) * 1000).toISOString()
        : new Date().toISOString()

      await updateTodoTimer(todoId, {
        start_time: startTime,
        paused_time_remaining: null,
        is_running: true,
        completed: false
      })
      
      await fetchTodos() // Refresh the list after starting timer
      setActiveTimerId(todoId)
      toast.success('Timer started')
    } catch (error) {
      console.error('Error starting timer:', error)
      toast.error('Failed to start timer')
    }
  }

  const handlePauseTimer = async (todoId: string) => {
    try {
      const remainingSeconds = activeTimers[todoId] || 0
      
      await updateTodoTimer(todoId, {
        is_running: false,
        paused_time_remaining: remainingSeconds
      })
      
      await fetchTodos() // Refresh the list after pausing timer
      
      if (activeTimerId === todoId) {
        setActiveTimerId(null)
      }
      toast.success('Timer paused')
    } catch (error) {
      console.error('Error pausing timer:', error)
      toast.error('Failed to pause timer')
    }
  }

  const handleResetTimer = async (todoId: string) => {
    try {
      await updateTodoTimer(todoId, {
        start_time: null,
        paused_time_remaining: null,
        is_running: false,
        completed: false
      })
      
      await fetchTodos() // Refresh the list after resetting timer
      
      setActiveTimers(prev => {
        const newTimers = {...prev}
        delete newTimers[todoId]
        return newTimers
      })
      
      if (activeTimerId === todoId) {
        setActiveTimerId(null)
      }
      toast.success('Timer reset')
    } catch (error) {
      console.error('Error resetting timer:', error)
      toast.error('Failed to reset timer')
    }
  }

  const handleTimerComplete = (todoId: string, todoTitle: string) => {
    setTodos(prev => prev.map(t => 
      t.id === todoId && t.timer
        ? { 
            ...t, 
            timer: { 
              ...t.timer, 
              is_running: false,
              completed: true
            } 
          }
        : t
    ))

    if (activeTimerId === todoId) {
      setActiveTimerId(null)
    }

    // Show notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("Timer Completed", { 
        body: `Time's up for: ${todoTitle}`,
        icon: "/favicon.ico"
      })
    }
  }

  const findTodoById = (id: string): TodoWithRelations | null => {
    return todos.find(t => t.id === id) || null
  }

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => t.status !== 'completed'))
  }

  const handleBulkAction = (action: 'delete' | 'complete' | 'archive') => {
    if (selectedTodos.length === 0) return

    setTodos(prev => {
      switch (action) {
        case 'delete':
          return prev.filter(t => !selectedTodos.includes(t.id))
        case 'complete':
          return prev.map(t => 
            selectedTodos.includes(t.id) ? { ...t, status: 'completed' as TodoStatus } : t
          )
        case 'archive':
          return prev.map(t => 
            selectedTodos.includes(t.id) ? { ...t, status: 'archived' as TodoStatus } : t
          )
        default:
          return prev
      }
    })

    setSelectedTodos([])
    setIsSelectionMode(false)
  }

  // Filter logic
  const filteredTodos = todos.filter((todo) => {
    if (todo.status === 'archived') return false
    if (activeTab === 'all') return true
    if (activeTab === 'active') return todo.status === 'pending'
    if (activeTab === 'completed') return todo.status === 'completed'
    return true
  })

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  const getPriorityIcon = (priority: TodoPriority) => {
    switch (priority) {
      case 'high': return <TrendingUp className="h-3 w-3" />
      case 'medium': return <Target className="h-3 w-3" />
      case 'low': return <CheckSquare className="h-3 w-3" />
      default: return <CheckSquare className="h-3 w-3" />
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl border border-blue-500/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl shadow-lg">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Todo List
              </h2>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </motion.div>
            </div>
            <p className="text-lg text-muted-foreground">Organize your tasks and boost productivity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats cards */}
          <div className="flex gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {filteredTodos.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/20">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {filteredTodos.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {filteredTodos.some((todo) => todo.status === 'completed') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompleted}
                className="flex items-center gap-2 rounded-xl border-red-500/20 hover:bg-red-500/10"
              >
                <CircleSlash className="h-4 w-4" />
                Clear Completed
              </Button>
            </motion.div>
          )}

          {filteredTodos.length > 0 && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                setSelectedTodos([])
              }}
              className="rounded-xl"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {isSelectionMode ? 'Exit Select' : 'Select'}
            </Button>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isFocusMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="rounded-xl"
                >
                  <Focus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedTodos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
          >
            <span className="font-medium">
              {selectedTodos.length} todo{selectedTodos.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('complete')}>
                <CheckSquare className="h-4 w-4 mr-2" />
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

      {/* Add Todo Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-card to-muted/20 rounded-xl border border-muted/30"
      >
        <Dialog open={newTodoDialogOpen} onOpenChange={setNewTodoDialogOpen}>
          <Input
            placeholder="What needs to be done? ✨"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (newTodo.trim()) {
                  handleCreateTodo()
                }
              }
            }}
            className="h-12 text-base border-muted/30 focus-visible:ring-primary/30 bg-background/80"
          />
          
          <div className="flex space-x-2">
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 px-4 border-orange-500/30 hover:bg-orange-500/10"
                onClick={() => {
                  if (newTodo.trim()) {
                    setNewTodoHasTimer(true)
                    setNewTodoDialogOpen(true)
                  }
                }}
              >
                <Timer className="h-4 w-4 mr-2" />
                Timer
              </Button>
            </DialogTrigger>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleCreateTodo} className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </motion.div>
          </div>
          
          {/* Enhanced Create Dialog */}
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-500" />
                </div>
                Create New Task
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="todo-title" className="text-sm font-semibold">Task Title</Label>
                <Input 
                  id="todo-title"
                  value={newTodo} 
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="What needs to be done?"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Priority Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as TodoPriority[]).map((priority) => (
                    <Button
                      key={priority}
                      variant={newTodoPriority === priority ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewTodoPriority(priority)}
                      className={cn(
                        "h-12 capitalize transition-all",
                        newTodoPriority === priority 
                          ? getPriorityColor(priority).replace('text-', 'bg-').replace('/10', '/20').replace('/20', '/30') 
                          : ""
                      )}
                    >
                      {getPriorityIcon(priority)}
                      <span className="ml-2">{priority}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-500/5 to-orange-600/5 rounded-xl border border-orange-500/20">
                <Switch 
                  id="timer-switch"
                  checked={newTodoHasTimer}
                  onCheckedChange={setNewTodoHasTimer}
                />
                <Label htmlFor="timer-switch" className="font-medium">Add a focus timer</Label>
              </div>
              
              {newTodoHasTimer && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 p-4 bg-orange-500/5 rounded-xl border border-orange-500/20"
                >
                  <div className="flex justify-between items-center">
                    <Label htmlFor="timer-duration" className="font-medium">
                      Timer Duration: {newTodoTimerDuration} minutes
                    </Label>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Focus Time
                    </Badge>
                  </div>
                  <Slider
                    id="timer-duration"
                    defaultValue={[25]}
                    min={5}
                    max={120}
                    step={5}
                    value={[newTodoTimerDuration]}
                    onValueChange={(vals) => setNewTodoTimerDuration(vals[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 min</span>
                    <span>60 min</span>
                    <span>120 min</span>
                  </div>
                </motion.div>
              )}
            </div>
            
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setNewTodoDialogOpen(false)} className="h-10">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleCreateTodo} className="h-10 px-6 bg-gradient-to-r from-blue-500 to-purple-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="h-12 bg-gradient-to-r from-muted/50 to-muted/30 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="all" className="rounded-lg font-semibold data-[state=active]:shadow-md transition-all">
              All Tasks
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg font-semibold data-[state=active]:shadow-md flex items-center gap-2 transition-all">
              <Zap className="h-3.5 w-3.5" />
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg font-semibold data-[state=active]:shadow-md flex items-center gap-2 transition-all">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {filteredTodos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-gradient-to-br from-muted/10 to-muted/5"
              >
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
                    className="p-4 bg-blue-500/10 rounded-2xl"
                  >
                    <ListTodo className="h-16 w-16 text-blue-500/60" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {activeTab === "all"
                        ? "No tasks yet"
                        : activeTab === "active"
                          ? "No active tasks"
                          : "No completed tasks"}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === "all"
                        ? "Create your first task to get started with organizing your day!"
                        : activeTab === "active"
                          ? "All caught up! Great job completing your tasks."
                          : "Complete some tasks to see them here."}
                    </p>
                  </div>
                  {activeTab !== "completed" && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="h-12 px-6 border-2 border-blue-500/20 hover:border-blue-500/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5"
                        onClick={() => document.querySelector("input")?.focus()}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Task
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
                className="space-y-4"
              >
                <AnimatePresence>
                  {filteredTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{ scale: 1.01, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          "overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-gradient-to-br",
                          todo.status === 'completed' 
                            ? "from-green-50/50 to-green-100/30 border border-green-500/20" 
                            : "from-card to-card/80",
                          isFocusMode && todo.id !== activeTimerId ? "opacity-40" : "",
                          isSelectionMode && selectedTodos.includes(todo.id) ? "ring-2 ring-primary" : ""
                        )}
                      >
                        <CardContent className={cn("p-4", todo.timer ? "pb-2" : "pb-4")}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-grow min-w-0">
                              {isSelectionMode && (
                                <Checkbox 
                                  checked={selectedTodos.includes(todo.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTodos(prev => [...prev, todo.id])
                                    } else {
                                      setSelectedTodos(prev => prev.filter(id => id !== todo.id))
                                    }
                                  }}
                                />
                              )}
                              
                              <Checkbox
                                checked={todo.status === 'completed'}
                                onCheckedChange={() => handleToggleTodo(todo)}
                                className={todo.status === 'completed' ? "border-green-500 bg-green-500" : ""}
                              />
                              
                              <div className="flex-grow min-w-0 space-y-2">
                                {editingTodoId === todo.id ? (
                                  <div className="flex space-x-2">
                                    <Input 
                                      value={editText} 
                                      onChange={(e) => setEditText(e.target.value)} 
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault()
                                          handleEditTodo(todo.id, editText)
                                        }
                                      }}
                                      className="h-9 text-sm"
                                      autoFocus
                                    />
                                    <Button size="sm" onClick={() => handleEditTodo(todo.id, editText)} className="h-9 px-3">
                                      <CheckSquare className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={cn(
                                          "text-base font-medium truncate cursor-pointer transition-colors",
                                          todo.status === 'completed' ? "line-through text-muted-foreground" : ""
                                        )}
                                        onClick={() => handleToggleTodo(todo)}
                                      >
                                        {todo.title}
                                      </span>
                                      
                                      <Badge 
                                        variant="outline" 
                                        className={cn("text-xs px-2 py-0.5 border", getPriorityColor(todo.priority))}
                                      >
                                        {getPriorityIcon(todo.priority)}
                                        <span className="ml-1 capitalize">{todo.priority}</span>
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {todo.timer && (
                                        <Badge 
                                          variant={todo.timer.is_running ? "default" : "outline"}
                                          className="text-xs px-2 py-0.5 flex items-center gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20"
                                        >
                                          <Clock className="h-3 w-3" />
                                          {formatTime(activeTimers[todo.id] || (todo.timer.duration_minutes * 60))}
                                        </Badge>
                                      )}
                                      
                                      {todo.notes && todo.notes.length > 0 && (
                                        <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                          <AlignLeft className="h-3 w-3" />
                                          {todo.notes.length}
                                        </Badge>
                                      )}
                                      
                                      {todo.due_date && (
                                        <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(todo.due_date).toLocaleDateString()}
                                        </Badge>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {todo.timer && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={cn(
                                          "h-9 w-9 rounded-lg",
                                          todo.timer.is_running ? "text-green-500 bg-green-500/10" : "hover:bg-orange-500/10"
                                        )}
                                        onClick={() => {
                                          if (todo.timer?.is_running) {
                                            handlePauseTimer(todo.id)
                                          } else if (!todo.timer?.completed) {
                                            handleStartTimer(todo.id)
                                          } else {
                                            handleResetTimer(todo.id)
                                          }
                                        }}
                                      >
                                        {todo.timer.is_running ? (
                                          <Pause className="h-4 w-4" />
                                        ) : todo.timer.completed ? (
                                          <RotateCcw className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {todo.timer.is_running 
                                        ? "Pause Timer" 
                                        : todo.timer.completed 
                                          ? "Reset Timer" 
                                          : "Start Timer"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 w-9 rounded-lg hover:bg-muted">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingTodoId(todo.id)
                                    setEditText(todo.title)
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => setSelectedTodoForNote(todo.id)}>
                                    <AlignLeft className="h-4 w-4 mr-2" />
                                    Add Note
                                  </DropdownMenuItem>
                                  
                                  {!todo.timer && (
                                    <DropdownMenuItem onClick={() => {
                                      // Add timer logic
                                    }}>
                                      <Timer className="h-4 w-4 mr-2" />
                                      Add Timer
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {todo.timer && (
                            <div className="mt-3 pt-2">
                              <Progress 
                                value={todo.timer.is_running 
                                  ? 100 - ((activeTimers[todo.id] || 0) / (todo.timer.duration_minutes * 60) * 100)
                                  : 0
                                } 
                                className="h-2" 
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </Tabs>
      </motion.div>

      {/* Notes Drawer */}
      <Drawer
        open={selectedTodoForNote !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTodoForNote(null)
        }}
      >
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <AlignLeft className="h-5 w-5 text-blue-500" />
              </div>
              Notes for: {findTodoById(selectedTodoForNote || '')?.title}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {selectedTodoForNote && (
              <>
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Add a note to this task..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <Button onClick={() => handleAddNote(selectedTodoForNote)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {findTodoById(selectedTodoForNote)?.notes?.map(note => (
                    <Card key={note.id} className="p-4 bg-gradient-to-r from-muted/30 to-muted/10">
                      <div className="flex justify-between items-start">
                        <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 ml-3 hover:bg-red-500/10 hover:text-red-500" 
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                  
                  {(findTodoById(selectedTodoForNote)?.notes?.length || 0) === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlignLeft className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <h4 className="font-medium mb-2">No notes yet</h4>
                      <p className="text-sm">Add your first note to keep track of important details!</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <DrawerFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTodoForNote(null)}
              className="w-full"
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Active Timer Floating Card */}
      <AnimatePresence>
        {activeTimerId && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="shadow-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">
                      Focus Timer
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-mono text-3xl font-bold text-orange-600">
                      {formatTime(activeTimers[activeTimerId] || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 max-w-32 truncate">
                      {findTodoById(activeTimerId)?.title}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handlePauseTimer(activeTimerId)}
                      className="border-orange-500/30 hover:bg-orange-500/10"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleResetTimer(activeTimerId)}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-600"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}