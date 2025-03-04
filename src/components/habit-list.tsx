"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, PlusCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSonner } from "sonner"

interface Habit {
  _id: string
  name: string
  description?: string
  type: "build" | "quit"
  streak: number
  completedDates: string[]
}

interface HabitListProps {
  habits: Habit[]
}

export function HabitList({ habits }: HabitListProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { sonner } = useSonner()

  const handleToggleHabit = async (habitId: string) => {
    setIsLoading((prev) => ({ ...prev, [habitId]: true }))

    try {
      const response = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle habit")
      }

      sonner({
        title: "Success!",
        description: "Your habit has been updated.",
      })

      router.refresh()
    } catch (error) {
      sonner({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [habitId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Habits</h2>
        <Link href="/dashboard/habits">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Habit
          </Button>
        </Link>
      </div>
      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="mb-2 text-center text-sm text-muted-foreground">You have not created any habits yet.</p>
            <Link href="/dashboard/habits">
              <Button variant="secondary" size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create your first habit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit) => (
            <Card key={habit._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{habit.name}</CardTitle>
                <CardDescription>
                  {habit.type === "build" ? "Build habit" : "Quit habit"} • {habit.streak} day streak
                </CardDescription>
              </CardHeader>
              {habit.description && (
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                </CardContent>
              )}
              <CardFooter>
                <Button
                  variant={habit.type === "build" ? "default" : "destructive"}
                  size="sm"
                  className="gap-1"
                  onClick={() => handleToggleHabit(habit._id)}
                  disabled={isLoading[habit._id]}
                >
                  {habit.type === "build" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {isLoading[habit._id] ? "Updating..." : habit.type === "build" ? "Mark Complete" : "Mark Avoided"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

