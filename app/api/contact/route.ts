import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const formData = await req.json()
    const { name, email, category, subject, message, attachment } = formData

    // Validate required fields
    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Log the contact submission (in production, save to database)
    console.log("Contact form submission:", {
      name,
      email,
      category,
      subject,
      message,
      timestamp: new Date().toISOString()
    })

    // In production: Save to Supabase/database
    // await supabase.from('contact_submissions').insert({ ... })

    return NextResponse.json({
      success: true,
      message: "Your support request has been submitted successfully. Our team will respond within 24 hours."
    })

  } catch (error: any) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    )
  }
}
