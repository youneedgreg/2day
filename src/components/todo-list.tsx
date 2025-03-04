"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useSonner } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
}

interface TodoListProps {
  todos: Todo[]
}

export function TodoList({ todos }: TodoListProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { sonner } = useSonner()

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    setIsLoading((prev) => ({ ...prev, [todoId]: true }))

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo")
      }

      sonner({
        title: "Success!",
        description: "Your todo has been updated.",
      })

      router.refresh()
    } catch (error) {
      sonner({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [todoId]: false }))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-amber-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your To-Do List</h2>
        <Link href="/dashboard/todos">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </Link>
      </div>
      {todos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="mb-2 text-center text-sm text-muted-foreground">You do not have any pending tasks.</p>
            <Link href="/dashboard/todos">
              <Button variant="secondary" size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create your first task
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <Card key={todo._id} className={cn(todo.completed && "opacity-60")}>
              <CardHeader className="p-4 pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`todo-${todo._id}`}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo._id, todo.completed)}
                      disabled={isLoading[todo._id]}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className={cn("text-base", todo.completed && "line-through")}>{todo.title}</CardTitle>
                      {todo.description && <CardDescription className="mt-1">{todo.description}</CardDescription>}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                </div>
              </CardHeader>
              {todo.dueDate && (
                <CardFooter className="p-4 pt-0">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Due {formatDate(todo.dueDate)}
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

