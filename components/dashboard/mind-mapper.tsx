"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Download, Lightbulb, Loader2, Sparkles, ZoomIn } from "lucide-react"
import { useState } from "react"

export function MindMapper() {
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [mindMapResult, setMindMapResult] = useState<string | null>(null)
  const [mindMapImage, setMindMapImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    setMindMapResult(null)
    setMindMapImage(null)
    setError(null)

    try {
      const response = await fetch("https://n8n.srv873027.hstgr.cloud/webhook/mindmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topic.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate mind map")
      }

      const contentType = response.headers.get("content-type")
      
      // Handle binary image response directly
      if (contentType?.startsWith("image/")) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        setMindMapImage(imageUrl)
        setMindMapResult(`Mind map generated for: ${topic}`)
        return
      }

      // Handle JSON response
      const data = await response.json()
      setMindMapResult(`Mind map generated for: ${topic}`)
      
      // Check various possible field names for the image
      const imageData = data.image || data.imageUrl || data.url || data.data || data.result
      
      if (imageData) {
        // Handle base64 image data
        if (typeof imageData === "string" && imageData.startsWith("data:image")) {
          setMindMapImage(imageData)
        } else if (typeof imageData === "string" && !imageData.startsWith("http") && !imageData.startsWith("data:")) {
          // Assume it's base64 without prefix
          setMindMapImage(`data:image/png;base64,${imageData}`)
        } else {
          setMindMapImage(imageData)
        }
      }
    } catch (err) {
      console.error("Error generating mind map:", err)
      setError("Failed to generate mind map. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const handleDownload = async () => {
    if (!mindMapImage) return

    const filename = `mindmap-${topic.replace(/\s+/g, "-").toLowerCase()}.png`
    const link = document.createElement("a")
    link.download = filename

    try {
      // Handle blob URLs (from binary response)
      if (mindMapImage.startsWith("blob:")) {
        link.href = mindMapImage
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // Handle base64 data URLs
      if (mindMapImage.startsWith("data:")) {
        link.href = mindMapImage
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // Handle external URLs - fetch and convert to blob
      const response = await fetch(mindMapImage, { mode: "cors" })
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      link.href = blobUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      // Final fallback for CORS issues - try direct download attribute
      link.href = mindMapImage
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const suggestedTopics = [
    "Indian Independence Movement",
    "Constitutional Amendments",
    "Environmental Policies",
    "Economic Reforms 1991",
    "Fundamental Rights",
    "Indian Foreign Policy",
  ]

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto bg-background">
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Lightbulb className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Create Your Mind Map</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Enter any UPSC topic and get a comprehensive mind map to help you understand and memorize key concepts.
            </p>
          </div>

          {/* Input Area */}
          <Card className="p-6 border-border/50">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Enter Topic
              </label>
              <div className="flex gap-3">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Indian Independence Movement, Constitutional Amendments..."
                  className="flex-1 h-12 text-base"
                  disabled={isGenerating}
                />
                <Button
                  size="lg"
                  className="h-12 px-6 bg-primary hover:bg-primary/90"
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggested Topics */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Try these popular topics:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedTopics.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-transparent"
                  onClick={() => setTopic(suggestion)}
                  disabled={isGenerating}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <Card className="p-8 border-primary/30 bg-primary/5">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Generating Mind Map...</h3>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-destructive">Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </Card>
          )}

          {/* Result Area */}
          {mindMapResult && !isGenerating && (
            <Card className="p-6 border-primary/30 bg-primary/5">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Mind Map Generated!</h3>
                <p className="text-muted-foreground">{mindMapResult}</p>
                {mindMapImage && (
                  <div className="mt-6 space-y-4">
                    <div className="relative group">
                      <img
                        src={mindMapImage || "/placeholder.svg"}
                        alt={`Mind map for ${topic}`}
                        className="w-full rounded-lg border border-border shadow-lg"
                        crossOrigin="anonymous"
                      />
                      <a
                        href={mindMapImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View full size"
                      >
                        <ZoomIn className="h-4 w-4 text-foreground" />
                      </a>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        className="bg-transparent"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Mind Map
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-transparent"
                        asChild
                      >
                        <a href={mindMapImage} target="_blank" rel="noopener noreferrer">
                          <ZoomIn className="h-4 w-4 mr-2" />
                          View Full Size
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Upgrade Badge */}
          <div className="text-center pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-lg">
              <span className="text-xs font-bold text-accent-foreground bg-green-500 px-2 py-0.5 rounded">
                ₹83/mo
              </span>
              <span className="text-sm font-semibold text-accent-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Generate 300+ mind maps monthly</p>
          </div>
        </div>
      </div>
    </div>
  )
}
