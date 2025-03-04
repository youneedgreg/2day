import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models/user"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isOnboarded: false,
    })

    await newUser.save()

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

