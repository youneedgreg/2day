import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Habit } from "@/lib/models/habit"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const habitId = params.id

    await connectToDatabase()

    // Find the habit
    const habit = await Habit.findOne({
      _id: habitId,
      userId: new mongoose.Types.ObjectId(session.user.id),
    })

    if (!habit) {
      return NextResponse.json({ message: "Habit not found" }, { status: 404 })
    }

    // Check if habit was already completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStr = today.toISOString().split("T")[0]
    const completedToday = habit.completedDates.some((date) => {
      const dateStr = new Date(date).toISOString().split("T")[0]
      return dateStr === todayStr
    })

    if (completedToday) {
      // Remove today's completion
      habit.completedDates = habit.completedDates.filter((date) => {
        const dateStr = new Date(date).toISOString().split("T")[0]
        return dateStr !== todayStr
      })

      // Decrease streak if it was > 0
      if (habit.streak > 0) {
        habit.streak -= 1
      }
    } else {
      // Add today's completion
      habit.completedDates.push(new Date())

      // Increase streak
      habit.streak += 1
    }

    await habit.save()

    return NextResponse.json(habit, { status: 200 })
  } catch (error) {
    console.error("Toggle habit error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

