import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Todo } from "@/lib/models/todo"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const todoId = params.id
    const updates = await req.json()

    await connectToDatabase()

    // Find and update the todo
    const todo = await Todo.findOneAndUpdate(
      {
        _id: todoId,
        userId: new mongoose.Types.ObjectId(session.user.id),
      },
      updates,
      { new: true },
    )

    if (!todo) {
      return NextResponse.json({ message: "Todo not found" }, { status: 404 })
    }

    return NextResponse.json(todo, { status: 200 })
  } catch (error) {
    console.error("Update todo error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const todoId = params.id

    await connectToDatabase()

    // Find and delete the todo
    const todo = await Todo.findOneAndDelete({
      _id: todoId,
      userId: new mongoose.Types.ObjectId(session.user.id),
    })

    if (!todo) {
      return NextResponse.json({ message: "Todo not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Todo deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete todo error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

