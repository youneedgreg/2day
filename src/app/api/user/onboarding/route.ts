import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { authOptions } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Update user onboarding status
    await User.findByIdAndUpdate(session.user.id, {
      isOnboarded: true,
    })

    return NextResponse.json({ message: "Onboarding completed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

s