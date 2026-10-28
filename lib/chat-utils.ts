export interface ChatMessage {
  id: string
  text: string
  translatedText?: string
  sender: "user" | "responder" | "system"
  timestamp: Date
  language: string
  status: "sending" | "sent" | "delivered" | "read" | "failed"
  attachments?: string[]
}

export interface ChatRoom {
  id: string
  alertId: string
  participants: string[]
  createdAt: Date
  status: "active" | "resolved" | "closed"
}

export const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
]

export const detectLanguage = (text: string): string => {
  // Simple language detection - in production use a library or API
  // This is a placeholder that always returns 'en'
  return "en"
}

export const formatMessageTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
