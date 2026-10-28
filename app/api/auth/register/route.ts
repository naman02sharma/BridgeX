import { NextResponse } from "next/server"
import { register } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const { email, password, name, organization, role } = data

    if (!email || !password || !name || !organization || !role) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    const user = await register({ email, password, name, organization, role })

    return NextResponse.json({
      user,
      message: "Registration successful. Please wait for admin verification.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
