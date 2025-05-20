/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Trash2, ListTodo, CheckCircle2, CircleSlash, Sparkles, 
  Clock, BellRing, X, ChevronRight, ChevronDown, 
  Focus, Pencil, AlignLeft, Layers, Edit, Timer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { getTodos, createTodo, updateTodo, subscribeToChanges } from '@/lib/utils/database'
import { Database } from '@/lib/types/database'

// Define types
type TodoNote = {
  id: string
  content: string
  createdAt: string
}

type TodoTimer = {
  duration: number // in minutes
  startTime?: string // ISO string when timer started
  pausedTimeRemaining?: number // remaining seconds when paused
  isRunning: boolean
  completed: boolean
}

type Todo = Database['public']['Tables']['todos']['Row']

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Local storage functions
const getTodosFromLocalStorage = (): Todo[] => {
  if (typeof window === 'undefined') return []
  
  const storedTodos = localStorage.getItem('todos')
  
  if (!storedTodos) return []
  
  try {
    const parsedTodos = JSON.parse(storedTodos)
    
    // Ensure all todos have the required properties
    const migratedTodos = parsedTodos.map((todo: any) => ({
      ...todo,
      notes: todo.notes || [],
      isExpanded: todo.isExpanded ?? true
    }))
    
    return Array.isArray(migratedTodos) ? migratedTodos : []
  } catch (error) {
    console.error('Error parsing todos from localStorage:', error)
    return []
  }
}

const saveTodosToLocalStorage = (todos: Todo[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('todos', JSON.stringify(todos))
}

// Notification helper
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications")
    return false
  }
  
  if (Notification.permission === "granted") {
    return true
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }
  
  return false
}

// Format time function (mm:ss)
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function TodoList() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [activeTimers, setActiveTimers] = useState<{[key: string]: number}>({})
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [timerNotifications, setTimerNotifications] = useState<{[key: string]: boolean}>({})
  const [selectedTodoForNote, setSelectedTodoForNote] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newTodoDialogOpen, setNewTodoDialogOpen] = useState(false)
  const [newTodoParentId, setNewTodoParentId] = useState<string | undefined>(undefined)
  const [newTodoTimerDuration, setNewTodoTimerDuration] = useState(25)
  const [newTodoHasTimer, setNewTodoHasTimer] = useState(false)
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user) return

    // Fetch initial todos
    fetchTodos()

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('todos', (payload) => {
      if (payload.event === 'INSERT') {
        setTodos((prev) => [payload.new as Todo, ...prev])
      } else if (payload.event === 'UPDATE') {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === payload.new?.id ? (payload.new as Todo) : todo))
        )
      } else if (payload.event === 'DELETE') {
        setTodos((prev) => prev.filter((todo) => todo.id !== payload.old?.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchTodos = async () => {
    if (!user) return
    try {
      const data = await getTodos(user.id)
      setTodos(data)
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTodo = async () => {
    if (!user || !newTodo.trim()) return

    try {
      await createTodo({
        user_id: user.id,
        title: newTodo.trim(),
        status: 'pending',
      })
      setNewTodo('')
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await updateTodo(todo.id, {
        status: todo.status === 'completed' ? 'pending' : 'completed',
      })
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await updateTodo(todoId, { status: 'archived' })
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  // Timer update effect with improved dependency management
  useEffect(() => {
    // Find all todos with active timers
    const todosWithRunningTimers = todos.filter(todo => 
      todo.timer?.isRunning && !todo.timer?.completed
    )
    
    // No running timers? Exit early
    if (todosWithRunningTimers.length === 0) {
      return
    }
    
    // Set up interval to update timers every second
    const interval = setInterval(() => {
      const updates: {[key: string]: number} = {}
      let shouldUpdateTimers = false
      
      // Update each running timer
      todosWithRunningTimers.forEach(todo => {
        if (!todo.timer || !todo.timer.duration) return
        
        // Calculate remaining time
        const startTime = todo.timer.startTime ? new Date(todo.timer.startTime).getTime() : Date.now()
        const durationMs = todo.timer.duration * 60 * 1000
        const elapsedMs = Date.now() - startTime
        const remainingMs = durationMs - elapsedMs
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
        
        // Only update if the timer value changed
        if (activeTimers[todo.id] !== remainingSeconds) {
          updates[todo.id] = remainingSeconds
          shouldUpdateTimers = true
        }
        
        // Timer completed
        if (remainingSeconds === 0 && todo.timer.isRunning) {
          // Send notification if enabled
          if (notificationsEnabled && !timerNotifications[todo.id]) {
            try {
              new Notification("Todo Timer Completed", { 
                body: `Time's up for: ${todo.title}`,
                icon: "/favicon.ico"
              })
              
              // Mark this notification as sent
              setTimerNotifications(prev => ({...prev, [todo.id]: true}))
            } catch (error) {
              console.error("Error sending notification:", error)
            }
          }
          
          // Update todo timer state using functional update
          setTodos(currentTodos => currentTodos.map(t => {
            if (t.id === todo.id && t.timer) {
              return {
                ...t,
                timer: {
                  ...t.timer,
                  isRunning: false,
                  completed: true
                }
              }
            }
            return t
          }))
        }
      })
      
      // Update active timers state if any changed
      if (shouldUpdateTimers) {
        setActiveTimers(prev => ({...prev, ...updates}))
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [todos, notificationsEnabled]) // Removed activeTimers from dependencies

  // Save todos to localStorage whenever they change
  useEffect(() => {
    saveTodosToLocalStorage(todos)
  }, [todos])

  // Add new todo
  const addTodo = (parentId?: string) => {
    if (!newTodo.trim()) return

    const todo: Todo = {
      id: generateId(),
      title: newTodo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      parentId,
      notes: [],
      isExpanded: true,
      ...(newTodoHasTimer && {
        timer: {
          duration: newTodoTimerDuration,
          isRunning: false,
          completed: false
        }
      })
    }

    setTodos(prevTodos => [...prevTodos, todo])
    setNewTodo("")
    setNewTodoHasTimer(false)
    setNewTodoTimerDuration(25)
    setNewTodoDialogOpen(false)
    setNewTodoParentId(undefined) // Clear parent ID after adding
  }

  // Toggle todo completion
  const toggleTodo = (id: string) => {
    setTodos(prevTodos => prevTodos.map((todo) => {
      if (todo.id === id) {
        // Also stop timer if completing a todo
        const newTodo = { 
          ...todo, 
          completed: !todo.completed,
        }
        
        // If completing a todo with a running timer, stop the timer
        if (!todo.completed && todo.timer?.isRunning) {
          newTodo.timer = {
            ...todo.timer,
            isRunning: false,
            completed: true
          }
        }
        
        return newTodo
      }
      return todo
    }))
  }

  // Delete todo
  const deleteTodo = (id: string) => {
    // Get all child todos to delete
    const childIds = getAllChildIds(id, todos)
    const idsToDelete = [id, ...childIds]
    
    setTodos(prevTodos => prevTodos.filter((todo) => !idsToDelete.includes(todo.id)))
    
    // Clean up active timers if needed
    const newActiveTimers = {...activeTimers}
    idsToDelete.forEach(id => {
      delete newActiveTimers[id]
    })
    setActiveTimers(newActiveTimers)
    
    // Update active timer if needed
    if (activeTimerId && idsToDelete.includes(activeTimerId)) {
      setActiveTimerId(null)
    }
  }

  // Get all child IDs recursively
  const getAllChildIds = (parentId: string, todoList: Todo[]): string[] => {
    const directChildren = todoList.filter(todo => todo.parentId === parentId)
    const directChildIds = directChildren.map(child => child.id)
    
    const grandChildIds = directChildIds.flatMap(childId => 
      getAllChildIds(childId, todoList)
    )
    
    return [...directChildIds, ...grandChildIds]
  }

  // Clear completed todos
  const clearCompleted = () => {
    // Get IDs of all completed root todos
    const completedRootIds = todos
      .filter(todo => todo.completed && !todo.parentId)
      .map(todo => todo.id)
    
    // Get all child IDs to remove as well
    const allChildIds = completedRootIds.flatMap(id => getAllChildIds(id, todos))
    const allIdsToRemove = [...completedRootIds, ...allChildIds]
    
    setTodos(prevTodos => prevTodos.filter(todo => !allIdsToRemove.includes(todo.id)))
    
    // Clean up active timers for removed todos
    const newActiveTimers = {...activeTimers}
    allIdsToRemove.forEach(id => {
      delete newActiveTimers[id]
    })
    setActiveTimers(newActiveTimers)
    
    // Update active timer if needed
    if (activeTimerId && allIdsToRemove.includes(activeTimerId)) {
      setActiveTimerId(null)
    }
  }

  // Toggle todo expansion (for nested todos)
  const toggleExpand = (id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id ? { ...todo, isExpanded: !todo.isExpanded } : todo
    ))
  }

  // Edit todo
  const startEditTodo = (id: string, text: string) => {
    setEditingTodoId(id)
    setEditText(text)
  }

  const saveEditTodo = () => {
    if (!editingTodoId || !editText.trim()) return
    
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === editingTodoId ? { ...todo, text: editText } : todo
    ))
    
    setEditingTodoId(null)
    setEditText("")
  }

  // Timer controls
  const startTimer = (id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === id && todo.timer) {
        return {
          ...todo,
          timer: {
            ...todo.timer,
            startTime: todo.timer.pausedTimeRemaining 
              ? new Date(Date.now() - ((todo.timer.duration * 60) - todo.timer.pausedTimeRemaining) * 1000).toISOString()
              : new Date().toISOString(),
            pausedTimeRemaining: undefined,
            isRunning: true,
            completed: false
          }
        }
      }
      return todo
    }))
    
    // Reset notification state
    setTimerNotifications(prev => ({...prev, [id]: false}))
    
    // Set this as the active timer
    setActiveTimerId(id)
  }

  const pauseTimer = (id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === id && todo.timer) {
        // Calculate remaining time
        const remainingSeconds = activeTimers[id] || 0
        
        return {
          ...todo,
          timer: {
            ...todo.timer,
            isRunning: false,
            pausedTimeRemaining: remainingSeconds
          }
        }
      }
      return todo
    }))
    
    // Clear active timer
    if (activeTimerId === id) {
      setActiveTimerId(null)
    }
  }

  const resetTimer = (id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === id && todo.timer) {
        return {
          ...todo,
          timer: {
            ...todo.timer,
            startTime: undefined,
            pausedTimeRemaining: undefined,
            isRunning: false,
            completed: false
          }
        }
      }
      return todo
    }))
    
    // Clear this timer from active timers
    setActiveTimers(prev => {
      const newTimers = {...prev}
      delete newTimers[id]
      return newTimers
    })
    
    // Reset notification state
    setTimerNotifications(prev => ({...prev, [id]: false}))
    
    // Clear active timer if this was it
    if (activeTimerId === id) {
      setActiveTimerId(null)
    }
  }
  
  // Note management
  const addNoteToTodo = (todoId: string) => {
    if (!newNoteContent.trim()) return
    
    const newNote: TodoNote = {
      id: generateId(),
      content: newNoteContent,
      createdAt: new Date().toISOString()
    }
    
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          notes: [...(todo.notes || []), newNote]
        }
      }
      return todo
    }))
    
    setNewNoteContent("")
    setSelectedTodoForNote(null)
  }
  
  const deleteNote = (todoId: string, noteId: string) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === todoId && todo.notes) {
        return {
          ...todo,
          notes: todo.notes.filter(note => note.id !== noteId)
        }
      }
      return todo
    }))
  }

  // Handle opening the timer dialog
  const handleOpenTimerDialog = () => {
    if (newTodo.trim()) {
      setNewTodoHasTimer(true)
      setNewTodoDialogOpen(true)
    }
  }

  // Add timer to existing todo
  const addTimerToTodo = (todoId: string) => {
    setTodos(prevTodos => prevTodos.map(t => {
      if (t.id === todoId) {
        return {
          ...t, 
          timer: { 
            duration: 25, 
            isRunning: false, 
            completed: false 
          }
        }
      }
      return t
    }))
  }

  // Filter logic
  const filteredTodos = todos.filter((todo) => {
    if (todo.status === 'archived') return false
    if (activeTab === 'all') return true
    if (activeTab === 'active') return todo.status === 'pending'
    if (activeTab === 'completed') return todo.status === 'completed'
    return true
  })

  // Get root level todos for display
  const rootTodos = filteredTodos.filter(todo => !todo.parentId)
  
  // Render a todo item with its children
  const renderTodoItem = (todo: Todo, level = 0) => {
    const hasChildren = todos.some(t => t.parentId === todo.id)
    const childTodos = filteredTodos.filter(t => t.parentId === todo.id)
    const hasTimer = !!todo.timer
    const timerRemaining = activeTimers[todo.id] || (todo.timer?.pausedTimeRemaining || (todo.timer?.duration || 0) * 60 || 0)
    const timerProgress = hasTimer && todo.timer && todo.timer.duration
      ? 100 - (timerRemaining / (todo.timer.duration * 60) * 100)
      : 0
      
    // Count all notes
    const notesCount = todo.notes?.length || 0
    
    // Determine margin for nested level
    const marginClass = level === 0 ? "" : 
                        level === 1 ? "ml-6" : 
                        level === 2 ? "ml-12" : 
                        level === 3 ? "ml-18" : "ml-24"
    
    return (
      <motion.div 
        key={todo.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-2"
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-200 hover:shadow-md",
            todo.completed ? "bg-muted/30" : "",
            isFocusMode && todo.id !== activeTimerId ? "opacity-40" : "",
            marginClass
          )}
        >
          <CardContent className={cn(
            "p-3", 
            hasTimer ? "pb-1" : "pb-3",
            "transition-all duration-200"
          )}>
            {/* Top section - Todo content and controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-grow min-w-0">
                {hasChildren && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(todo.id)
                    }} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {todo.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
                
                <Checkbox
                  id={todo.id}
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  className={todo.completed ? "border-primary" : ""}
                />
                
                <div className="flex-grow min-w-0">
                  {editingTodoId === todo.id ? (
                    <div className="flex space-x-2">
                      <Input 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            saveEditTodo()
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={saveEditTodo} className="h-8 px-2">Save</Button>
                    </div>
                  ) : (
                    <label
                      htmlFor={todo.id}
                      className={cn(
                        "block text-sm truncate",
                        todo.completed ? "line-through text-muted-foreground" : ""
                      )}
                    >
                      {todo.text}
                    </label>
                  )}
                  
                  {/* Badges */}
                  <div className="flex mt-1 space-x-1">
                    {hasTimer && (
                      <Badge 
                        variant={todo.timer?.isRunning ? "default" : "outline"}
                        className="text-xs px-1.5 flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTime(timerRemaining)}
                      </Badge>
                    )}
                    
                    {hasChildren && (
                      <Badge variant="secondary" className="text-xs px-1.5 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {childTodos.length}
                      </Badge>
                    )}
                    
                    {notesCount > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 flex items-center gap-1">
                        <AlignLeft className="h-3 w-3" />
                        {notesCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Action buttons */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditTodo(todo.id, todo.text)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      setNewTodoParentId(todo.id)
                      setNewTodoDialogOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtask
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => setSelectedTodoForNote(todo.id)}>
                      <AlignLeft className="h-4 w-4 mr-2" />
                      Add Note
                    </DropdownMenuItem>
                    
                    {!todo.timer && (
                      <DropdownMenuItem onClick={() => addTimerToTodo(todo.id)}>
                        <Timer className="h-4 w-4 mr-2" />
                        Add Timer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {hasTimer && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8",
                            todo.timer?.isRunning ? "text-green-500" : "",
                            todo.timer?.completed ? "text-red-500" : ""
                          )}
                          onClick={() => {
                            if (todo.timer?.isRunning) {
                              pauseTimer(todo.id)
                            } else if (!todo.timer?.completed) {
                              startTimer(todo.id)
                            } else {
                              resetTimer(todo.id)
                            }
                          }}
                        >
                          {todo.timer?.isRunning ? (
                            <div className="animate-pulse">
                              <Clock className="h-4 w-4" />
                            </div>
                          ) : todo.timer?.completed ? (
                            <BellRing className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {todo.timer?.isRunning 
                          ? "Pause Timer" 
                          : todo.timer?.completed 
                            ? "Reset Timer" 
                            : "Start Timer"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Timer progress bar */}
            {hasTimer && (
              <div className="mt-1 pt-1">
                <Progress value={timerProgress} className="h-1" />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Render children if expanded */}
        {todo.isExpanded && hasChildren && (
          <div className="space-y-2">
            {childTodos.map(childTodo => renderTodoItem(childTodo, level + 1))}
          </div>
        )}
      </motion.div>
    )
  }

  // Main component render
  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Todo List</h2>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <ListTodo className="h-5 w-5 text-blue-500" />
          </motion.div>
        </div>
        <div className="flex gap-2">
          {todos.some((todo) => todo.completed) && (
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
                className="flex items-center gap-2 rounded-full"
              >
                <CircleSlash className="h-4 w-4" />
                <span>Clear Completed</span>
              </Button>
            </motion.div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isFocusMode ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="rounded-full"
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

      {/* Add Todo Input or Dialog Trigger */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-2"
      >
        <Dialog open={newTodoDialogOpen} onOpenChange={setNewTodoDialogOpen}>
          <Input
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (newTodo.trim()) {
                  addTodo()
                }
              }
            }}
            className="shadow-sm focus-visible:ring-primary"
          />
          
          <div className="flex space-x-2">
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="shadow-sm"
                onClick={handleOpenTimerDialog}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => addTodo()} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </motion.div>
          </div>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Todo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="todo-title">Todo Title</Label>
                <Input 
                  id="todo-title"
                  value={newTodo} 
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="What needs to be done?"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="timer-switch"
                  checked={newTodoHasTimer}
                  onCheckedChange={setNewTodoHasTimer}
                />
                <Label htmlFor="timer-switch">Add a timer</Label>
              </div>
              
              {newTodoHasTimer && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="timer-duration">Timer Duration: {newTodoTimerDuration} minutes</Label>
                  </div>
                  <Slider
                    id="timer-duration"
                    defaultValue={[25]}
                    min={1}
                    max={120}
                    step={1}
                    value={[newTodoTimerDuration]}
                    onValueChange={(vals) => setNewTodoTimerDuration(vals[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1m</span>
                    <span>60m</span>
                    <span>120m</span>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTodoDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => addTodo(newTodoParentId)}>
                Create {newTodoParentId ? "Subtask" : "Todo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <DrawerTitle>
              Notes for: {todos.find(t => t.id === selectedTodoForNote)?.text}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {selectedTodoForNote && (
              <>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button onClick={() => addNoteToTodo(selectedTodoForNote)}>
                    Add Note
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {todos.find(t => t.id === selectedTodoForNote)?.notes?.map(note => (
                    <Card key={note.id} className="p-2">
                      <div className="flex justify-between">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => deleteNote(selectedTodoForNote, note.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                  
                  {(todos.find(t => t.id === selectedTodoForNote)?.notes?.length || 0) === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlignLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet. Add your first note!</p>
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
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Tabs & Todo List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-md">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:shadow-md flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:shadow-md flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {rootTodos.length === 0 ? (
              <EmptyState tab="all" onAddClick={() => document.querySelector("input")?.focus()} />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {rootTodos.map(todo => renderTodoItem(todo))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {rootTodos.filter(todo => !todo.completed).length === 0 ? (
              <EmptyState tab="active" onAddClick={() => document.querySelector("input")?.focus()} />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {rootTodos.map(todo => renderTodoItem(todo))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {rootTodos.filter(todo => todo.completed).length === 0 ? (
              <EmptyState tab="completed" />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {rootTodos.map(todo => renderTodoItem(todo))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Active Timer Information */}
      {activeTimerId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="shadow-lg border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="font-mono text-2xl font-bold">
                  {formatTime(activeTimers[activeTimerId] || 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {todos.find(t => t.id === activeTimerId)?.text}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => pauseTimer(activeTimerId)}>
                    Pause
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => resetTimer(activeTimerId)}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// Empty state component
const EmptyState = ({ 
  tab, 
  onAddClick 
}: { 
  tab: "all" | "active" | "completed",
  onAddClick?: () => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-center py-16 border rounded-lg bg-muted/20"
    >
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
        >
          <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-2" />
        </motion.div>
        <p className="text-muted-foreground">
          {tab === "all"
            ? "Your task list is empty. Add your first task to get started!"
            : tab === "active"
              ? "No active tasks. Great job!"
              : "No completed tasks yet. Keep going!"}
        </p>
        {(tab !== "completed" && onAddClick) && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
            <Button variant="outline" onClick={onAddClick} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add a Task
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}