"use client"

import { useState, useEffect } from "react"
import { getCurrentAffairById } from "@/app/actions/current-affairs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, Tag, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { CurrentAffair } from "@/types/current-affairs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { CurrentAffairsSidebar } from "@/components/dashboard/current-affairs-sidebar"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CurrentAffairDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [article, setArticle] = useState<CurrentAffair | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarDate, setSidebarDate] = useState(new Date())

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const resolvedParams = await params
        const data = await getCurrentAffairById(resolvedParams.id)
        
        if (!data) {
          setError("Article not found")
          setLoading(false)
          return
        }
        
        setArticle(data)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error loading article:", err)
        setError("Failed to load article")
        setLoading(false)
      }
    }

    loadArticle()
  }, [params])

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderFormattedText = (text: string | undefined | null) => {
    if (!text || typeof text !== "string") return null

    const paragraphs = text.split(/\n\n+/)

    return paragraphs.map((paragraph, pIndex) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g)

      return (
        <p key={pIndex} className="mb-4 last:mb-0">
          {parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={index} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            if (part.includes("\n- ") || part.startsWith("- ")) {
              const items = part.split("\n").filter((line) => line.trim())
              return (
                <ul key={index} className="list-disc list-inside space-y-1 my-2">
                  {items.map((item, i) => {
                    const cleanItem = item.replace(/^-\s*/, "")
                    if (!cleanItem) return null
                    return <li key={i}>{cleanItem}</li>
                  })}
                </ul>
              )
            }
            return <span key={index}>{part}</span>
          })}
        </p>
      )
    })
  }

  const renderArrayContent = (items: string[] | undefined | null) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null

    return (
      <ul className="space-y-3">
        {items.map((item, index) => {
          const parts = item.split(/(\*\*.*?\*\*)/g)
          return (
            <li key={index} className="flex gap-3">
              <span className="text-primary mt-1.5 flex-shrink-0">•</span>
              <span className="flex-1">
                {parts.map((part, pIndex) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={pIndex} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                      </strong>
                    )
                  }
                  return <span key={pIndex}>{part}</span>
                })}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  const handleBack = () => {
    router.push("/dashboard#current-affairs")
  }

  const handleDateSelect = (date: Date) => {
    setSidebarDate(date)
    router.push("/dashboard#current-affairs")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex h-[calc(100vh-4rem)]">
          <DashboardSidebar activeItem="current-affairs" onItemChange={() => {}} />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex h-[calc(100vh-4rem)]">
          <DashboardSidebar activeItem="current-affairs" onItemChange={() => {}} />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-lg text-muted-foreground">{error || "Article not found"}</div>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <DashboardSidebar activeItem="current-affairs" onItemChange={(item) => router.push(`/dashboard#${item}`)} />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="border-b bg-muted/30 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <Button variant="ghost" size="sm" className="mb-4" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="space-y-4">
                {/* Category Tags */}
                <div className="flex gap-2 flex-wrap">
                  {article.category_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-foreground leading-tight">{article.title}</h1>

                {/* Meta Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDisplayDate(article.published_date)}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-16">
            {/* Summary */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h2 className="text-xl font-semibold text-primary mb-4">Summary</h2>
              <div className="text-foreground leading-relaxed">{renderFormattedText(article.summary)}</div>
            </Card>

            {/* Key Points */}
            {article.key_points && article.key_points.length > 0 && (
              <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Key Points
                </h2>
                <div className="text-foreground leading-relaxed">{renderArrayContent(article.key_points)}</div>
              </Card>
            )}

            {/* Why It Matters for UPSC */}
            {article.why_it_matters_for_upsc && article.why_it_matters_for_upsc.length > 0 && (
              <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-amber-600 rounded-full" />
                  Why It Matters for UPSC
                </h2>
                <div className="text-foreground leading-relaxed">
                  {renderArrayContent(article.why_it_matters_for_upsc)}
                </div>
              </Card>
            )}

            {/* Mains Usage */}
            {article.where_to_use_in_mains_usage && article.where_to_use_in_mains_usage.length > 0 && (
              <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-600 rounded-full" />
                  Mains Usage
                </h2>
                <div className="text-foreground leading-relaxed">
                  {renderArrayContent(article.where_to_use_in_mains_usage)}
                </div>
              </Card>
            )}

            {/* Probable Mains Questions */}
            {article.probable_mains_questions && article.probable_mains_questions.length > 0 && (
              <Card className="p-6 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
                <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                  Probable Mains Questions
                </h2>
                <div className="text-foreground leading-relaxed">
                  {renderArrayContent(article.probable_mains_questions)}
                </div>
              </Card>
            )}

            {/* Prelims Pointers */}
            {article.prelims_pointers && article.prelims_pointers.length > 0 && (
              <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <h2 className="text-xl font-semibold text-green-900 dark:text-green-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-green-600 rounded-full" />
                  Prelims Pointers
                </h2>
                <div className="text-foreground leading-relaxed">{renderArrayContent(article.prelims_pointers)}</div>
              </Card>
            )}

            {/* Important Terms */}
            {article.important_terms && article.important_terms.length > 0 && (
              <Card className="p-6 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
                <h2 className="text-xl font-semibold text-rose-900 dark:text-rose-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-rose-600 rounded-full" />
                  Important Terms
                </h2>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-foreground leading-relaxed">
                  {article.important_terms.map((item, index) => {
                    const parts = item.split(/(\*\*.*?\*\*)/g)
                    return (
                      <div key={index} className="flex gap-3">
                        <span className="text-rose-600 mt-1.5 flex-shrink-0">•</span>
                        <span className="flex-1">
                          {parts.map((part, pIndex) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={pIndex} className="font-semibold text-foreground">
                                  {part.slice(2, -2)}
                                </strong>
                              )
                            }
                            return <span key={pIndex}>{part}</span>
                          })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>

        <CurrentAffairsSidebar 
          selectedDate={sidebarDate} 
          onDateSelect={handleDateSelect} 
          articleDate={article ? new Date(article.published_date) : undefined}
        />
      </div>
    </div>
  )
}
