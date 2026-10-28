"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Languages, Mic, Paperclip, MoreVertical, CheckCheck, Radio } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"
import { useGlobalTranslation } from "@/components/translation-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  text: string
  translatedText?: string
  sender: "user" | "responder"
  timestamp: Date
  language: string
  status: "sent" | "delivered" | "read"
}

interface ChatMessage {
  id: string
  content: string
  translated_content?: string
  sender_type: "user" | "responder"
  language_code: string
  created_at: string
  alert_id?: string
}

export function ChatInterface({ alertId }: { alertId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { t } = useGlobalTranslation()

  useEffect(() => {
    // Fetch initial messages
    if (alertId) {
      fetchMessages()
    }

    // Subscribe to real-time message updates
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: alertId ? `alert_id=eq.${alertId}` : undefined,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          const message: Message = {
            id: newMessage.id,
            text: newMessage.content,
            translatedText: newMessage.translated_content,
            sender: newMessage.sender_type,
            timestamp: new Date(newMessage.created_at),
            language: newMessage.language_code,
            status: "read",
          }
          setMessages(prev => [...prev, message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [alertId])

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (alertId) {
        query = query.eq('alert_id', alertId)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.content,
        translatedText: msg.translated_content,
        sender: msg.sender_type,
        timestamp: new Date(msg.created_at),
        language: msg.language_code,
        status: "read" as const,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim()) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content: inputText,
          sender_type: 'user',
          language_code: selectedLanguage,
          alert_id: alertId,
        })
        .select()
        .single()

      if (error) throw error

      setInputText("")
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] border-2">
      {/* Chat Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-secondary text-secondary-foreground">ER</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">Emergency Response Team</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Active · Responding</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <Radio className="w-3 h-3 mr-1" />
              Emergency
            </Badge>
            <Button size="sm" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    <TranslatedText text={message.text} fallback={message.text} />
                  </p>
                  {message.translatedText && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <div className="flex items-center gap-1 mb-1 opacity-70">
                        <Languages className="w-3 h-3" />
                        <span className="text-xs">{t('translated', 'Translated')}</span>
                      </div>
                      <p className="text-sm italic opacity-90">{message.translatedText}</p>
                    </div>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 mt-1 px-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  {message.sender === "user" && (
                    <CheckCheck
                      className={`w-3 h-3 ${
                        message.status === "read"
                          ? "text-blue-500"
                          : message.status === "delivered"
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            <Languages className="w-3 h-3 mr-1" />
            English
          </Badge>
          <span className="text-xs text-muted-foreground">Messages auto-translate to responder's language</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            placeholder={t('typeYourMessage', 'Type your message...')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
