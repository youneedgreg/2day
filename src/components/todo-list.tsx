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
import { 
  getTodos, 
  createTodo, 
  updateTodo, 
  addNoteToTodo, 
  deleteNote, 
  updateTodoTimer,
  addTimerToTodo,
  subscribeToTodoChanges,
  type TodoWithRelations 
} from '@/lib/utils/database/todos'
import { toast } from 'sonner'

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
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  
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
      setTodos(data)
    } catch (error) {
      console.error('Error fetching todos:', error)
      toast.error('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

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
      setNewTodo('')
      setNewTodoHasTimer(false)
      setNewTodoTimerDuration(25)
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
      
      toast.success(todo.status === 'pending' ? 'Todo completed!' : 'Todo reopened')
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await updateTodo(todoId, { status: 'archived' })
      toast.success('Todo deleted')
    } catch (error) {
      console.error('Error deleting todo:', error)
      toast.error('Failed to delete todo')
    }
  }

  const handleUpdateExpansion = async (todoId: string, isExpanded: boolean) => {
    try {
      await updateTodo(todoId, { is_expanded: isExpanded })
    } catch (error) {
      console.error('Error updating expansion:', error)
    }
  }

  const handleEditTodo = async (todoId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await updateTodo(todoId, { title: newTitle.trim() })
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
      toast.success('Note deleted')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const handleAddTimer = async (todoId: string) => {
    try {
      await addTimerToTodo(todoId, 25)
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

  // Timer update effect
  useEffect(() => {
    const todosWithRunningTimers = getAllTodos().filter(todo => 
      todo.timer?.is_running && !todo.timer?.completed
    )
    
    if (todosWithRunningTimers.length === 0) {
      return
    }
    
    const interval = setInterval(() => {
      const updates: {[key: string]: number} = {}
      let shouldUpdateTimers = false
      
      todosWithRunningTimers.forEach(todo => {
        if (!todo.timer || !todo.timer.duration_minutes) return
        
        const startTime = todo.timer.start_time ? new Date(todo.timer.start_time).getTime() : Date.now()
        const durationMs = todo.timer.duration_minutes * 60 * 1000
        const elapsedMs = Date.now() - startTime
        const remainingMs = durationMs - elapsedMs
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
        
        if (activeTimers[todo.id] !== remainingSeconds) {
          updates[todo.id] = remainingSeconds
          shouldUpdateTimers = true
        }
        
        // Timer completed
        if (remainingSeconds === 0 && todo.timer.is_running) {
          handleTimerComplete(todo.id, todo.title)
        }
      })
      
      if (shouldUpdateTimers) {
        setActiveTimers(prev => ({...prev, ...updates}))
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [todos, activeTimers])

  const handleTimerComplete = async (todoId: string, todoTitle: string) => {
    try {
      await updateTodoTimer(todoId, {
        is_running: false,
        completed: true
      })
      
      if (activeTimerId === todoId) {
        setActiveTimerId(null)
      }
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("Timer Completed", { 
          body: `Time's up for: ${todoTitle}`,
          icon: "/favicon.ico"
        })
      }
      
      toast.success(`Timer completed for: ${todoTitle}`)
    } catch (error) {
      console.error('Error completing timer:', error)
    }
  }

  // Helper functions
  const findTodoById = (id: string): TodoWithRelations | null => {
    const search = (todoList: TodoWithRelations[]): TodoWithRelations | null => {
      for (const todo of todoList) {
        if (todo.id === id) return todo
        if (todo.children) {
          const found = search(todo.children)
          if (found) return found
        }
      }
      return null
    }
    return search(todos)
  }

  const getAllTodos = (): TodoWithRelations[] => {
    const result: TodoWithRelations[] = []
    const traverse = (todoList: TodoWithRelations[]) => {
      todoList.forEach(todo => {
        result.push(todo)
        if (todo.children) {
          traverse(todo.children)
        }
      })
    }
    traverse(todos)
    return result
  }

  const clearCompleted = async () => {
    try {
      const completedTodos = getAllTodos().filter(todo => todo.status === 'completed')
      await Promise.all(completedTodos.map(todo => updateTodo(todo.id, { status: 'archived' })))
      toast.success('Completed todos cleared')
    } catch (error) {
      console.error('Error clearing completed todos:', error)
      toast.error('Failed to clear completed todos')
    }
  }

  // Filter logic
  const filteredTodos = todos.filter((todo) => {
    if (todo.status === 'archived') return false
    if (activeTab === 'all') return true
    if (activeTab === 'active') return todo.status === 'pending'
    if (activeTab === 'completed') return todo.status === 'completed'
    return true
  })

  // Render a todo item with its children
  const renderTodoItem = (todo: TodoWithRelations, level = 0) => {
    const hasChildren = todo.children && todo.children.length > 0
    const hasTimer = !!todo.timer
    const timerRemaining = activeTimers[todo.id] || 
      (todo.timer?.paused_time_remaining || 
       (todo.timer?.duration_minutes || 0) * 60 || 0)
    const timerProgress = hasTimer && todo.timer && todo.timer.duration_minutes
      ? 100 - (timerRemaining / (todo.timer.duration_minutes * 60) * 100)
      : 0
      
    const notesCount = todo.notes?.length || 0
    const marginClass = level === 0 ? "" : 
                        level === 1 ? "ml-6" : 
                        level === 2 ? "ml-12" : "ml-18"
    
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
            todo.status === 'completed' ? "bg-muted/30" : "",
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
                      handleUpdateExpansion(todo.id, !todo.is_expanded)
                    }} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {todo.is_expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
                
                <Checkbox
                  id={todo.id}
                  checked={todo.status === 'completed'}
                  onCheckedChange={() => handleToggleTodo(todo)}
                  className={todo.status === 'completed' ? "border-primary" : ""}
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
                            handleEditTodo(todo.id, editText)
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleEditTodo(todo.id, editText)} className="h-8 px-2">
                        Save
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor={todo.id}
                      className={cn(
                        "block text-sm truncate cursor-pointer",
                        todo.status === 'completed' ? "line-through text-muted-foreground" : ""
                      )}
                    >
                      {todo.title}
                    </label>
                  )}
                  
                  {/* Badges */}
                  <div className="flex mt-1 space-x-1">
                    {hasTimer && (
                      <Badge 
                        variant={todo.timer?.is_running ? "default" : "outline"}
                        className="text-xs px-1.5 flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTime(timerRemaining)}
                      </Badge>
                    )}
                    
                    {hasChildren && (
                      <Badge variant="secondary" className="text-xs px-1.5 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {todo.children?.length}
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
                    <DropdownMenuItem onClick={() => {
                      setEditingTodoId(todo.id)
                      setEditText(todo.title)
                    }}>
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
                      <DropdownMenuItem onClick={() => handleAddTimer(todo.id)}>
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
                            todo.timer?.is_running ? "text-green-500" : "",
                            todo.timer?.completed ? "text-red-500" : ""
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
                          {todo.timer?.is_running ? (
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
                        {todo.timer?.is_running 
                          ? "Pause Timer" 
                          : todo.timer?.completed 
                            ? "Reset Timer" 
                            : "Start Timer"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTodo(todo.id)}>
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
        {todo.is_expanded && hasChildren && (
          <div className="space-y-2">
            {todo.children!.map(childTodo => renderTodoItem(childTodo, level + 1))}
          </div>
        )}
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
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
          {getAllTodos().some((todo) => todo.status === 'completed') && (
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

      {/* Add Todo Input */}
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
                  handleCreateTodo()
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
                onClick={() => {
                  if (newTodo.trim()) {
                    setNewTodoHasTimer(true)
                    setNewTodoDialogOpen(true)
                  }
                }}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleCreateTodo} className="shadow-md">
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
              <Button onClick={handleCreateTodo}>
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
              Notes for: {findTodoById(selectedTodoForNote || '')?.title}
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
                  <Button onClick={() => handleAddNote(selectedTodoForNote)}>
                    Add Note
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {findTodoById(selectedTodoForNote)?.notes?.map(note => (
                    <Card key={note.id} className="p-2">
                      <div className="flex justify-between">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                  
                  {(findTodoById(selectedTodoForNote)?.notes?.length || 0) === 0 && (
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
            {filteredTodos.length === 0 ? (
              <EmptyState tab="all" onAddClick={() => document.querySelector("input")?.focus()} />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTodos.map(todo => renderTodoItem(todo))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {filteredTodos.filter(todo => todo.status === 'pending').length === 0 ? (
              <EmptyState tab="active" onAddClick={() => document.querySelector("input")?.focus()} />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTodos.map(todo => renderTodoItem(todo))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {filteredTodos.filter(todo => todo.status === 'completed').length === 0 ? (
              <EmptyState tab="completed" />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTodos.map(todo => renderTodoItem(todo))}
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
                  {findTodoById(activeTimerId)?.title}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handlePauseTimer(activeTimerId)}>
                    Pause
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleResetTimer(activeTimerId)}>
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