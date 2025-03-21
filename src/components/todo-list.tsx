"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, ListTodo, CheckCircle2, CircleSlash, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types
type Todo = {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Local storage functions
const getTodosFromLocalStorage = (): Todo[] => {
  if (typeof window === 'undefined') return []
  
  const storedTodos = localStorage.getItem('todos')
  console.log('Getting todos from localStorage:', storedTodos)
  
  if (!storedTodos) return []
  
  try {
    const parsedTodos = JSON.parse(storedTodos)
    console.log('Successfully parsed todos:', parsedTodos)
    return Array.isArray(parsedTodos) ? parsedTodos : []
  } catch (error) {
    console.error('Error parsing todos from localStorage:', error)
    return []
  }
}

const saveTodosToLocalStorage = (todos: Todo[]): void => {
  if (typeof window === 'undefined') return
  console.log('Saving todos to localStorage:', todos)
  localStorage.setItem('todos', JSON.stringify(todos))
}

// Debug function for localStorage
const debugLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const storedTodos = localStorage.getItem('todos')
    console.log('Raw todos from localStorage:', storedTodos)
    if (storedTodos) {
      try {
        const parsed = JSON.parse(storedTodos)
        console.log('Parsed todos:', parsed)
        return parsed
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error)
      }
    } else {
      console.log('No todos found in localStorage')
    }
  }
  return []
}

export default function TodoList() {
  // Use lazy initialization for todos state
  const [todos, setTodos] = useState<Todo[]>(() => {
    // This function only runs once during initial render
    if (typeof window !== 'undefined') {
      const storedTodos = localStorage.getItem('todos')
      if (storedTodos) {
        try {
          const parsed = JSON.parse(storedTodos)
          console.log('Initially loaded todos:', parsed)
          return Array.isArray(parsed) ? parsed : []
        } catch (error) {
          console.error('Error parsing initial todos:', error)
        }
      }
    }
    return []
  })
  
  const [newTodo, setNewTodo] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")

  // Backup loading from localStorage on component mount
  useEffect(() => {
    console.log('Component mounted, loading todos from localStorage')
    const loadedTodos = getTodosFromLocalStorage()
    console.log('Loaded todos:', loadedTodos)
    
    // Only set todos if we actually found some
    if (loadedTodos.length > 0) {
      setTodos(loadedTodos)
    }
    
    // Manually check localStorage content
    debugLocalStorage()
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    console.log('Saving todos to localStorage:', todos)
    saveTodosToLocalStorage(todos)
  }, [todos])

  const addTodo = () => {
    if (!newTodo.trim()) return

    const todo: Todo = {
      id: generateId(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTodos([...todos, todo])
    setNewTodo("")
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed))
  }

  // Simplified filter logic for clarity
  const filteredTodos = todos.filter((todo) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return !todo.completed
    return todo.completed // if activeTab is "completed"
  })

  // Debug function to log current state
  const debugTodos = () => {
    console.log('All todos:', todos)
    console.log('Active tab:', activeTab)
    console.log('Filtered todos:', filteredTodos)
    console.log('Are there todos to show?', filteredTodos.length > 0)
  }

  // Call debug function
  debugTodos()

  // Debug component for development
  const DebugPanel = () => {
    const [localStorageContent, setLocalStorageContent] = useState<string>('Loading...')
    
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const content = localStorage.getItem('todos') || 'No todos found'
        setLocalStorageContent(content)
      }
    }, [todos]) // Update when todos change
    
    if (process.env.NODE_ENV !== 'development') {
      return null // Only show in development
    }
    
    return (
      <div className="mt-6 p-4 border border-red-300 rounded bg-red-50 text-sm">
        <h3 className="font-bold text-red-800 mb-2">Debug Information</h3>
        <div className="mb-2">
          <strong>Todos in state:</strong> {todos.length}
        </div>
        <div className="mb-2">
          <strong>Filtered todos:</strong> {filteredTodos.length}
        </div>
        <div className="mb-2">
          <strong>Active tab:</strong> {activeTab}
        </div>
        <div>
          <strong>LocalStorage content:</strong>
          <pre className="mt-1 p-2 bg-white border rounded overflow-auto max-h-40 text-xs">
            {localStorageContent}
          </pre>
        </div>
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => console.log('Current todos state:', todos)}
          >
            Log State
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const testTodo = {
                id: generateId(),
                text: "Debug Test Todo",
                completed: false,
                createdAt: new Date().toISOString(),
              };
              setTodos(prev => [...prev, testTodo]);
            }}
          >
            Add Test Todo
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => {
              localStorage.removeItem('todos');
              setTodos([]);
              window.location.reload();
            }}
          >
            Clear & Reload
          </Button>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold">Todo List</h2>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <ListTodo className="h-5 w-5 text-blue-500" />
          </motion.div>
        </div>
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-2"
      >
        <Input
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTodo()
            }
          }}
          className="shadow-sm focus-visible:ring-primary"
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={addTodo} className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as never)}>
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
        </Tabs>
      </motion.div>

      {/* Render empty state or todo cards */}
      {filteredTodos.length === 0 ? (
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
              {activeTab === "all"
                ? "Your task list is empty. Add your first task to get started!"
                : activeTab === "active"
                  ? "No active tasks. Great job!"
                  : "No completed tasks yet. Keep going!"}
            </p>
            {activeTab !== "active" && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
                <Button variant="outline" onClick={() => document.querySelector("input")?.focus()} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add a Task
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => (
            <Card
              key={todo.id}
              className={`
                overflow-hidden transition-all duration-200 hover:shadow-md
                ${todo.completed ? "bg-muted/30" : ""}
              `}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={todo.id}
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className={todo.completed ? "border-primary" : ""}
                  />
                  <label
                    htmlFor={todo.id}
                    className={`${todo.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {todo.text}
                  </label>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug panel - only shows in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  )
}