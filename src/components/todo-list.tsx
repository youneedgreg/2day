"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ListTodo, CheckCircle2, CircleSlash, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Todo, getTodos, saveTodos, generateId } from "@/lib/storage"

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")

  useEffect(() => {
    setTodos(getTodos())
  }, [])

  useEffect(() => {
    saveTodos(todos)
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

  const filteredTodos = todos.filter((todo) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return !todo.completed
    if (activeTab === "completed") return todo.completed
    return true
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
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
        <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence>
            {filteredTodos.map((todo) => (
              <motion.div
                key={todo.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                layout
              >
                <Card
                  className={`
                  overflow-hidden transition-all duration-200 hover:shadow-md
                  ${todo.completed ? "bg-muted/30" : ""}
                `}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <Checkbox
                          id={todo.id}
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className={todo.completed ? "border-primary" : ""}
                        />
                      </motion.div>
                      <motion.label
                        htmlFor={todo.id}
                        className={`${todo.completed ? "line-through text-muted-foreground" : ""}`}
                        animate={{
                          opacity: todo.completed ? 0.6 : 1,
                          scale: todo.completed ? 0.98 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {todo.text}
                      </motion.label>
                    </div>
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

