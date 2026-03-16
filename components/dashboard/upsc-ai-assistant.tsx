"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Mic, Paperclip, Send, User, Loader2, Copy, Check, RefreshCw } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'

// Types for chat messages
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  error?: boolean
}

// Webhook URL - Replace with your production URL
const WEBHOOK_URL = "https://n8n.srv873027.hstgr.cloud/webhook/upscaiassistant"

export function UpscAiAssistant() {
  const [mode, setMode] = useState<"text" | "audio">("text")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = [
    "Give previous year prelims questions on lakes",
    "Explain the concept of Federalism",
    "Give me top foreign policy current affairs",
    "Create a 30-day study plan for UPSC Prelims",
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Generate unique message ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Send message to webhook
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    }

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Add placeholder for assistant response
    const assistantMessageId = generateId()
    const loadingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText.trim(),
          sessionId: sessionId,
          mode: mode,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract the response - adjust based on your n8n webhook response structure
      // Common response structures from n8n:
      // - data.output (from AI Agent)
      // - data.response
      // - data.message
      // - data.text
      // - data (if it's just a string)
      let assistantContent = ""
      
      if (typeof data === "string") {
        assistantContent = data
      } else if (data.output) {
        assistantContent = data.output
      } else if (data.response) {
        assistantContent = data.response
      } else if (data.message) {
        assistantContent = data.message
      } else if (data.text) {
        assistantContent = data.text
      } else if (data.content) {
        assistantContent = data.content
      } else {
        // Fallback: stringify the entire response
        assistantContent = JSON.stringify(data, null, 2)
      }

      // Update the loading message with actual content
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: assistantContent, isLoading: false }
            : msg
        )
      )
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Update with error message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, I encountered an error while processing your request. Please try again.",
                isLoading: false,
                error: true,
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  // Copy message to clipboard
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Retry failed message
  const retryMessage = (messageIndex: number) => {
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === "user") {
      // Remove the failed assistant message
      setMessages(prev => prev.filter((_, i) => i !== messageIndex))
      // Resend the user message
      sendMessage(messages[userMessageIndex].content)
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages([])
  }

  // Render message content with markdown
  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
        components={{
          // Custom styling for code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className="text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2" {...props}>
              {children}
            </pre>
          ),
          // Custom styling for links
          a: ({ ...props }) => (
            <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          // Custom styling for blockquotes
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Loading dots animation component
  const LoadingDots = () => (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Chat Messages Area */}
      {messages.length === 0 ? (
        // Welcome Screen (when no messages)
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-3xl space-y-8">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-foreground">What can I help with?</h1>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose a mode:</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={mode === "text" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setMode("text")}
                    className={mode === "text" ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    TEXT
                  </Button>
                  <Button
                    variant={mode === "audio" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setMode("audio")}
                    className={mode === "audio" ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    AUDIO
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Suggested questions</p>
              <div className="space-y-3">
                {suggestedQuestions.map((question, index) => (
                  <Card
                    key={index}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-foreground">{question}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Chat Messages (when there are messages)
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                      : "bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3"
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">UPSC Mentor is thinking...</span>
                      <LoadingDots />
                    </div>
                  ) : (
                    <>
                      {message.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="text-sm">
                          {renderMessageContent(message.content)}
                        </div>
                      )}

                      {/* Message Actions for Assistant */}
                      {message.role === "assistant" && !message.isLoading && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          
                          {message.error && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => retryMessage(index)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* User Avatar */}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input Area */}
      <div className="border-t border-border/40 p-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          {/* Clear Chat Button (show only when there are messages) */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear conversation
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center gap-3 bg-background border border-border/50 rounded-xl px-4 py-3 shadow-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about UPSC..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                disabled={isLoading}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mic className="h-5 w-5" />
              </button>
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            UPSC Mentor AI can make mistakes. Verify important information from official sources.
          </p>
        </div>
      </div>
    </div>
  )
}
