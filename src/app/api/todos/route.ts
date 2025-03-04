import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Todo } from "@/lib/models/todo"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { title, description, dueDate, priority, reminder } = await req.json()

    // Validate input
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Create new todo
    const newTodo = new Todo({
      userId: new mongoose.Types.ObjectId(session.user.id),
      title,
      description,
      dueDate,
      priority: priority || "medium",
      reminder,
    })

    await newTodo.save()

    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    console.error("Create todo error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get all todos for the user
    const todos = await Todo.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
    }).sort({ dueDate: 1, priority: 1 })

    return NextResponse.json(todos, { status: 200 })
  } catch (error) {
    console.error("Get todos error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

