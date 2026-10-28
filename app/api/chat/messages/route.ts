import { NextResponse } from "next/server"

// Mock message storage - In production, use a real database
const messageStore: any[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get("chatId")

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID required" }, { status: 400 })
  }

  const messages = messageStore.filter((msg) => msg.chatId === chatId)

  return NextResponse.json({ messages })
}

export async function POST(request: Request) {
  try {
    const message = await request.json()

    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: "sent",
    }

    messageStore.push(newMessage)

    // Simulate WebSocket broadcast
    // In production, use Socket.io or similar

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
