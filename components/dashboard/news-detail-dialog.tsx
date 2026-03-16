"use client"

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "lucide-react"
import { CurrentAffair } from "@/types/current-affairs"

interface NewsDetailDialogProps {
  news: CurrentAffair | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewsDetailDialog({ news, open, onOpenChange }: NewsDetailDialogProps) {
  if (!news) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          {/* Category Tags */}
          <div className="flex gap-2 flex-wrap">
            {news.category_tags.map((tag, index) => (
              <Badge key={index} variant={index === 0 ? "default" : "outline"} className="text-sm px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-balance leading-tight text-foreground">{news.title}</h2>

          {/* Date and News ID */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(news.published_date)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-mono text-xs">{news.news_id}</span>
          </div>
        </DialogHeader>

        <Separator className="my-6" />

        {/* Summary Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Summary</h3>
            <p className="text-base leading-relaxed text-muted-foreground">{news.summary}</p>
          </div>

          {/* Key Points Section */}
          {news.key_points && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Key Points</h3>
              <div className="bg-muted/50 rounded-lg p-6">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:marker:text-primary"
                  dangerouslySetInnerHTML={{ __html: formatKeyPoints(news.key_points) }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatKeyPoints(keyPoints: string): string {
  // Convert plain text key points to HTML with better formatting
  if (!keyPoints) return ""

  // If it's already HTML, return as is
  if (keyPoints.includes("<") && keyPoints.includes(">")) {
    return keyPoints
  }

  // Split by newlines and create list items
  const lines = keyPoints.split("\n").filter((line) => line.trim())

  if (lines.length === 0) return keyPoints

  // Check if lines start with bullet points or numbers
  const hasBullets = lines.some((line) => line.trim().match(/^[•\-\*\d\.]/))

  if (hasBullets) {
    const listItems = lines
      .map((line) => {
        const cleaned = line.replace(/^[•\-\*\d\.\)]\s*/, "").trim()
        return cleaned ? `<li>${cleaned}</li>` : ""
      })
      .filter(Boolean)
      .join("")

    return `<ul class="space-y-2">${listItems}</ul>`
  }

  // If no bullets, create paragraphs
  return lines.map((line) => `<p class="mb-3">${line}</p>`).join("")
}
