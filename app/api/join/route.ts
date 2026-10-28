import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const formData = await req.json()
    const {
      organizationType,
      organizationName,
      individualName,
      email,
      phone,
      country,
      city,
      address,
      description,
      acceptedTerms
    } = formData

    // Validate required fields
    if (!organizationType || !email || !phone) {
      return NextResponse.json(
        { error: "Organization type, email, and phone are required" },
        { status: 400 }
      )
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "You must accept the Terms & Conditions" },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Log the application (in production, save to database)
    console.log("Responder application:", {
      organizationType,
      organizationName,
      individualName,
      email,
      phone,
      country,
      city,
      timestamp: new Date().toISOString()
    })

    // In production: Save to Supabase/database
    // await supabase.from('responder_applications').insert({ ... })

    return NextResponse.json({
      success: true,
      message: "Your application has been received. We'll review it and contact you within 2-5 business days."
    })

  } catch (error: any) {
    console.error("Join network error:", error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}
