"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Target,
  Award,
  BarChart3,
  Hash,
  FileText,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// -------------------- Types (matches your webhook output) --------------------
type WebhookResponseItem = {
  success?: boolean
  test_id: string
  total_questions?: number
  total_marks_awarded?: number
  total_marks_possible?: number
  percentage?: number
  results?: ResultItem[]
}

type ResultItem = {
  test_id: string
  serial_no?: number
  year?: string
  question_id?: string
  question_text?: string
  paper_no?: string
  paper_name?: string
  subject?: string
  mains_theme?: string
  mini_theme?: string
  micro_theme?: string
  marks?: number
  wordlimit?: number
  difficulty?: string
  evaluation?: EvaluationBlock
}

type EvaluationBlock = {
  relevance_check?: {
    is_relevant?: boolean
    justification?: string
  }
  detailed_evaluation?: {
    introduction_assessment?: SectionAssessment
    body_assessment?: SectionAssessment
    conclusion_assessment?: SectionAssessment
  }
  rubric_wise_marks?: {
    content_accuracy?: RubricItem
    structure_and_flow?: RubricItem
    language_and_presentation?: RubricItem
    examples_usage?: RubricItem
    analysis_and_originality?: RubricItem
  }
  final_marks?: number
  total_marks?: number
  keywords_analysis?: {
    keywords_used_correctly?: string[]
    mandatory_keywords_missing?: string[]
    keywords_misused?: string[]
  }
  strengths?: string[]
  weaknesses?: string[]
  improvement_suggestions?: string[]
  evaluator_comments?: string
  model_answer?: {
    model_answer?: string
    word_count?: number
    structure_check?: {
      has_introduction?: boolean
      has_body?: boolean
      has_conclusion?: boolean
    }
    rubric_alignment?: {
      analysis_present?: boolean
      examples_used?: boolean
      content_accuracy?: boolean
    }
  }
  combinedAnswerWordCount?: number
}

type SectionAssessment = {
  marks_awarded?: number
  marks_possible?: number
  comments?: string
}

type RubricItem = {
  marks_awarded?: number
  marks_possible?: number
  comments?: string
}

// -------------------- Helpers --------------------
function safeNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function safeText(v: unknown, fallback = "") {
  if (v === null || v === undefined) return fallback
  return String(v)
}

function tryParseJsonLoose(input: unknown): unknown {
  // Handles: object, array, stringified JSON, double-stringified JSON
  let v: any = input
  for (let i = 0; i < 3; i++) {
    if (typeof v !== "string") return v
    const s = v.trim()
    if (!s) return null
    try {
      v = JSON.parse(s)
    } catch {
      return v
    }
  }
  return v
}

type Normalized = {
  test_id: string
  total_questions: number
  total_marks_awarded: number
  total_marks_possible: number
  percentage: number
  results: ResultItem[]
}

// Accepts stored payload in many shapes and normalizes it to your schema
function normalizeStoredPayload(stored: unknown, fallbackTestId: string): Normalized | null {
  const parsed = tryParseJsonLoose(stored)
  if (!parsed) return null

  // Your webhook output example is: [ { ... } ]
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0] as WebhookResponseItem
    const results = Array.isArray(first.results) ? first.results : []
    const test_id = safeText(first.test_id || fallbackTestId, fallbackTestId)

    const total_questions = safeNumber(first.total_questions, results.length || 0)
    const total_marks_awarded = safeNumber(first.total_marks_awarded, 0)
    const total_marks_possible = safeNumber(first.total_marks_possible, results.reduce((a, r) => a + safeNumber(r.marks, 0), 0))
    const percentage =
      safeNumber(first.percentage, total_marks_possible > 0 ? Math.round((total_marks_awarded / total_marks_possible) * 100) : 0)

    return {
      test_id,
      total_questions,
      total_marks_awarded,
      total_marks_possible,
      percentage,
      results,
    }
  }

  // Some people store as object directly
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as any

    // If it already matches
    if (obj.test_id && Array.isArray(obj.results)) {
      const test_id = safeText(obj.test_id || fallbackTestId, fallbackTestId)
      const results = obj.results as ResultItem[]
      const total_questions = safeNumber(obj.total_questions, results.length || 0)
      const total_marks_awarded = safeNumber(obj.total_marks_awarded, 0)
      const total_marks_possible = safeNumber(obj.total_marks_possible, results.reduce((a, r) => a + safeNumber(r.marks, 0), 0))
      const percentage =
        safeNumber(obj.percentage, total_marks_possible > 0 ? Math.round((total_marks_awarded / total_marks_possible) * 100) : 0)

      return {
        test_id,
        total_questions,
        total_marks_awarded,
        total_marks_possible,
        percentage,
        results,
      }
    }
  }

  return null
}

function MainsTestEvaluationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get("testId") || ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Normalized | null>(null)

  const [activeIdx, setActiveIdx] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!testId) {
      setError("Test ID not found in URL. Please submit the test again.")
      setLoading(false)
      return
    }

    try {
      // Try multiple keys (so you don't need to change backend/TestTakingPage logic)
      const possibleKeys = [
        `mains_test_results:${testId}`,
        `mains_eval_results:${testId}`,
        `mains-test-evaluation:${testId}`,
        `mains_results:${testId}`,
        `mains_eval:${testId}`,
        `mains_eval_results:last`,
        `mains_test_results:last`,
        `mains_results:last`,
      ]

      let found: string | null = null
      for (const k of possibleKeys) {
        const v = sessionStorage.getItem(k)
        if (v) {
          found = v
          break
        }
      }

      if (!found) {
        setError("Evaluation results not found in session. Please submit the test again.")
        setLoading(false)
        return
      }

      const normalized = normalizeStoredPayload(found, testId)
      if (!normalized) {
        setError("Could not read evaluation payload. (Stored JSON format mismatch)")
        setLoading(false)
        return
      }

      // Ensure stable order by serial_no
      normalized.results = [...(normalized.results || [])].sort((a, b) => safeNumber(a.serial_no, 9999) - safeNumber(b.serial_no, 9999))

      setData(normalized)
      setActiveIdx(0)
      setActiveTab("overview")
    } catch (e) {
      console.error("[mains-test-evaluation] load error:", e)
      setError("Failed to load results")
    } finally {
      setLoading(false)
    }
  }, [testId])

  const computed = useMemo(() => {
    const results = data?.results || []
    const totalQ = safeNumber(data?.total_questions, results.length)

    const attempted = results.length
    const unattempted = Math.max(0, totalQ - attempted)

    const correct = results.filter((r) => r.evaluation?.relevance_check?.is_relevant === true).length
    const incorrect = Math.max(0, attempted - correct)

    const totalMarksAwarded = safeNumber(data?.total_marks_awarded, 0)
    const totalMarksPossible = safeNumber(data?.total_marks_possible, 0)
    const accuracyPct =
      safeNumber(data?.percentage, totalMarksPossible > 0 ? Math.round((totalMarksAwarded / totalMarksPossible) * 100) : 0)

    return {
      results,
      totalQ,
      attempted,
      unattempted,
      correct,
      incorrect,
      totalMarksAwarded,
      totalMarksPossible,
      accuracyPct,
    }
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your evaluation results...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 border-2 border-destructive/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h2 className="text-xl font-bold text-foreground">Error Loading Results</h2>
          </div>
          <p className="text-muted-foreground mb-6">{error || "Could not load evaluation data"}</p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const results = computed.results
  const current = results[activeIdx]

  const currentFinal = safeNumber(current?.evaluation?.final_marks, safeNumber(current?.evaluation?.final_marks, 0))
  const currentTotal = safeNumber(current?.evaluation?.total_marks, safeNumber(current?.marks, 0))
  const currentPct = currentTotal > 0 ? Math.round((currentFinal / currentTotal) * 100) : 0

  const isRelevant = current?.evaluation?.relevance_check?.is_relevant === true

  const wordCount = safeNumber(current?.evaluation?.combinedAnswerWordCount, 0)
  const wordLimit = safeNumber(current?.wordlimit, 0)

  const keywordsUsed = current?.evaluation?.keywords_analysis?.keywords_used_correctly || []
  const keywordsMissing = current?.evaluation?.keywords_analysis?.mandatory_keywords_missing || []
  const keywordsMisused = current?.evaluation?.keywords_analysis?.keywords_misused || []

  const strengths = current?.evaluation?.strengths || []
  const weaknesses = current?.evaluation?.weaknesses || []
  const improvements = current?.evaluation?.improvement_suggestions || []
  const evaluatorComments = safeText(current?.evaluation?.evaluator_comments, "")

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mains Test Results</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your performance across all evaluated answers
          </p>
        </div>

        {/* Top Summary Cards (6) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Total Score</p>
            <p className="text-xl font-bold text-foreground">
              {computed.totalMarksAwarded}/{computed.totalMarksPossible || 0}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Attempted</p>
            <p className="text-xl font-bold text-foreground">{computed.attempted}</p>
          </Card>

          <Card className="p-4 border-l-4 border-slate-500 bg-gradient-to-br from-slate-500/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Unattempted</p>
            <p className="text-xl font-bold text-foreground">{computed.unattempted}</p>
          </Card>

          <Card className="p-4 border-l-4 border-green-600 bg-gradient-to-br from-green-600/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Correct</p>
            <p className="text-xl font-bold text-foreground">{computed.correct}</p>
          </Card>

          <Card className="p-4 border-l-4 border-rose-600 bg-gradient-to-br from-rose-600/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Incorrect</p>
            <p className="text-xl font-bold text-foreground">{computed.incorrect}</p>
          </Card>

          <Card className="p-4 border-l-4 border-violet-600 bg-gradient-to-br from-violet-600/10 to-transparent">
            <p className="text-xs text-muted-foreground mb-1">Accuracy %</p>
            <p className="text-xl font-bold text-foreground">{computed.accuracyPct.toFixed(0)}%</p>
          </Card>
        </div>

        {/* Question Square Tabs (Horizontal) */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm font-medium text-foreground">Questions</p>
            <p className="text-xs text-muted-foreground">Test ID: {data.test_id}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {results.map((r, idx) => {
              const ok = r.evaluation?.relevance_check?.is_relevant === true
              const label = `Q${safeNumber(r.serial_no, idx + 1)}`
              return (
                <button
                  key={`${r.question_id || idx}`}
                  onClick={() => {
                    setActiveIdx(idx)
                    setActiveTab("overview")
                  }}
                  className={cn(
                    "h-10 w-12 flex items-center justify-center rounded-md border text-sm font-semibold transition",
                    activeIdx === idx ? "ring-2 ring-primary" : "hover:bg-muted/40",
                    ok
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-rose-400 bg-rose-50 text-rose-700"
                  )}
                  title={r.question_id || label}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Metadata Tags - ABOVE question card */}
        {current && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {current.test_id && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                  Test: {current.test_id}
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                Serial: {safeNumber(current.serial_no, activeIdx + 1)}
              </span>
              {current.question_id && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                  QID: {current.question_id}
                </span>
              )}
              {current.year && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                  Year: {current.year}
                </span>
              )}
              {current.paper_no && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                  Paper: {current.paper_no}
                </span>
              )}
              {current.subject && (
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200">
                  Subject: {current.subject}
                </span>
              )}
              {current.mains_theme && (
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium border border-teal-200">
                  Theme: {current.mains_theme}
                </span>
              )}
              {current.mini_theme && (
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium border border-teal-200">
                  Sub-theme: {current.mini_theme}
                </span>
              )}
              {current.micro_theme && (
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium border border-teal-200">
                  Micro-theme: {current.micro_theme}
                </span>
              )}
              {current.difficulty && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200">
                  Difficulty: {current.difficulty}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current Question Card - Only Marks, Score, Word Count */}
        {current && (
          <Card className="p-6 mb-6 border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isRelevant ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Answer is Relevant</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-rose-600" />
                      <span className="text-sm font-semibold text-rose-700">Answer is Not Relevant</span>
                    </>
                  )}
                </div>

                <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug mb-4">
                  {safeText(current.question_text, "Question text not available")}
                </h2>

                {/* Only Essential Info: Marks & Word Count */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {typeof current.marks !== "undefined" && (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold border border-emerald-200">
                      Marks: {safeNumber(current.marks, 0)}
                    </span>
                  )}
                  {typeof current.wordlimit !== "undefined" && (
                    <span className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold border border-cyan-200">
                      Word limit: {safeNumber(current.wordlimit, 0)}
                    </span>
                  )}
                </div>

                {/* Word Count Warning */}
                {wordLimit > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-900">
                      📝 {wordCount} words / {wordLimit} limit
                    </p>
                    {wordCount > wordLimit && (
                      <p className="text-xs text-amber-700 mt-1">
                        ⚠️ Exceeded by {wordCount - wordLimit} words
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Score Badge */}
              <div className="flex flex-col items-end gap-3">
                <div className="h-24 w-24 rounded-full bg-orange-500 text-white flex flex-col items-center justify-center shadow-sm">
                  <div className="text-2xl font-bold">{currentPct || 0}%</div>
                  <div className="text-xs opacity-90">ORI</div>
                </div>

                {/* Highlighted score row */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Score</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {safeNumber(currentFinal, 0)}<span className="text-muted-foreground">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs (like screenshots) */}
        {current && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="text-xs md:text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="detailed" className="text-xs md:text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Detailed
              </TabsTrigger>
              <TabsTrigger value="keywords" className="text-xs md:text-sm flex items-center gap-2">
                <Hash className="h-4 w-4" /> Keywords
              </TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs md:text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Feedback
              </TabsTrigger>
              <TabsTrigger value="model" className="text-xs md:text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Model
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Relevance justification */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Relevance Assessment
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {safeText(current.evaluation?.relevance_check?.justification, "No relevance justification provided.")}
                </p>
              </Card>

              {/* Rubric-wise summary (compact) */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Rubric-Wise Marks Breakdown
                </h3>

                <div className="space-y-4">
                  {[
                    ["Content Accuracy", current.evaluation?.rubric_wise_marks?.content_accuracy],
                    ["Structure & Flow", current.evaluation?.rubric_wise_marks?.structure_and_flow],
                    ["Language & Presentation", current.evaluation?.rubric_wise_marks?.language_and_presentation],
                    ["Examples Usage", current.evaluation?.rubric_wise_marks?.examples_usage],
                    ["Analysis & Originality", current.evaluation?.rubric_wise_marks?.analysis_and_originality],
                  ].map(([label, item]) => {
                    const r = item as RubricItem | undefined
                    if (!r) return null
                    const a = safeNumber(r.marks_awarded, 0)
                    const t = Math.max(0.0001, safeNumber(r.marks_possible, 0))
                    const pct = Math.round((a / t) * 100)
                    return (
                      <div key={String(label)} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="font-semibold text-foreground">{label}</div>
                          <div className="text-sm font-bold text-foreground">
                            {a}/{safeNumber(r.marks_possible, 0)}
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{safeText(r.comments, "")}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* Detailed Analysis */}
            <TabsContent value="detailed" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Section-Wise Detailed Evaluation</h3>

                <div className="space-y-4">
                  {[
                    ["Introduction Assessment", current.evaluation?.detailed_evaluation?.introduction_assessment],
                    ["Body Assessment", current.evaluation?.detailed_evaluation?.body_assessment],
                    ["Conclusion Assessment", current.evaluation?.detailed_evaluation?.conclusion_assessment],
                  ].map(([label, sec]) => {
                    const s = sec as SectionAssessment | undefined
                    if (!s) return null
                    const a = safeNumber(s.marks_awarded, 0)
                    const t = Math.max(0.0001, safeNumber(s.marks_possible, 0))
                    const pct = Math.round((a / t) * 100)
                    return (
                      <div key={String(label)} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="font-semibold text-foreground">{label}</div>
                          <div className="text-sm font-bold text-foreground">
                            {a}/{safeNumber(s.marks_possible, 0)}
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{safeText(s.comments, "")}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* Keywords */}
            <TabsContent value="keywords" className="space-y-4 mt-4">
              {keywordsUsed.length > 0 && (
                <Card className="p-6 border-l-4 border-emerald-600">
                  <h3 className="font-semibold text-emerald-700 mb-3">✓ Keywords Used Correctly ({keywordsUsed.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {keywordsUsed.map((kw, idx) => (
                      <span
                        key={`${kw}-${idx}`}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {keywordsMissing.length > 0 && (
                <Card className="p-6 border-l-4 border-rose-600">
                  <h3 className="font-semibold text-rose-700 mb-3">✕ Mandatory Keywords Missing ({keywordsMissing.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {keywordsMissing.map((kw, idx) => (
                      <span
                        key={`${kw}-${idx}`}
                        className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {keywordsMisused.length > 0 && (
                <Card className="p-6 border-l-4 border-amber-600">
                  <h3 className="font-semibold text-amber-800 mb-3">⚠ Keywords Misused ({keywordsMisused.length})</h3>
                  <ul className="space-y-2">
                    {keywordsMisused.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-foreground flex gap-2">
                        <span className="text-amber-700 font-semibold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {keywordsUsed.length === 0 && keywordsMissing.length === 0 && keywordsMisused.length === 0 && (
                <Card className="p-6">
                  <p className="text-muted-foreground">No keyword analysis available</p>
                </Card>
              )}
            </TabsContent>

            {/* Feedback */}
            <TabsContent value="feedback" className="space-y-4 mt-4">
              {strengths.length > 0 && (
                <Card className="p-6 border-l-4 border-emerald-600">
                  <h3 className="font-semibold text-emerald-700 mb-3">✓ Strengths ({strengths.length})</h3>
                  <ul className="space-y-2">
                    {strengths.map((s, idx) => (
                      <li key={`${s}-${idx}`} className="flex gap-2 text-sm text-foreground">
                        <span className="text-emerald-600 font-semibold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {weaknesses.length > 0 && (
                <Card className="p-6 border-l-4 border-rose-600">
                  <h3 className="font-semibold text-rose-700 mb-3">✕ Weaknesses ({weaknesses.length})</h3>
                  <ul className="space-y-2">
                    {weaknesses.map((w, idx) => (
                      <li key={`${w}-${idx}`} className="flex gap-2 text-sm text-foreground">
                        <span className="text-rose-600 font-semibold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {improvements.length > 0 && (
                <Card className="p-6 border-l-4 border-amber-600">
                  <h3 className="font-semibold text-amber-800 mb-3">💡 Improvement Suggestions ({improvements.length})</h3>
                  <ol className="space-y-2">
                    {improvements.map((s, idx) => (
                      <li key={`${s}-${idx}`} className="flex gap-2 text-sm text-foreground">
                        <span className="text-amber-700 font-bold">{idx + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              )}

              {evaluatorComments && (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Evaluator Comments</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{evaluatorComments}</p>
                </Card>
              )}

              {!strengths.length && !weaknesses.length && !improvements.length && !evaluatorComments && (
                <Card className="p-6">
                  <p className="text-muted-foreground">No feedback available</p>
                </Card>
              )}
            </TabsContent>

            {/* Model Answer */}
            <TabsContent value="model" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Model Answer
                  <span className="text-sm text-muted-foreground ml-2">
                    {safeNumber(current.evaluation?.model_answer?.word_count, 0)} words
                  </span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-xl border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Model word count</p>
                    <p className="text-lg font-bold text-foreground">
                      {safeNumber(current.evaluation?.model_answer?.word_count, 0)}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Introduction</p>
                    <p className="text-sm font-semibold text-foreground">
                      {current.evaluation?.model_answer?.structure_check?.has_introduction ? "✓ Present" : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Body</p>
                    <p className="text-sm font-semibold text-foreground">
                      {current.evaluation?.model_answer?.structure_check?.has_body ? "✓ Present" : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Conclusion</p>
                    <p className="text-sm font-semibold text-foreground">
                      {current.evaluation?.model_answer?.structure_check?.has_conclusion ? "✓ Present" : "—"}
                    </p>
                  </div>
                </div>

                {/* Rubric Alignment */}
                {current.evaluation?.model_answer?.rubric_alignment && (
                  <div className="mb-5 p-4 rounded-xl border bg-primary/5">
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Model Answer Rubric Alignment
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {current.evaluation.model_answer.rubric_alignment.content_accuracy && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                          ✓ Content Accuracy
                        </span>
                      )}
                      {current.evaluation.model_answer.rubric_alignment.analysis_present && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                          ✓ Analysis Present
                        </span>
                      )}
                      {current.evaluation.model_answer.rubric_alignment.examples_used && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                          ✓ Examples Used
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Model Answer Text with Yellow Highlighting */}
                <div className="rounded-xl border p-5 bg-gradient-to-br from-primary/5 via-white to-yellow-50">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Model Answer</p>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                    {(() => {
                      // Try multiple possible paths for model answer
                      let modelText = ""
                      
                      if (current.evaluation?.model_answer?.model_answer) {
                        modelText = safeText(current.evaluation.model_answer.model_answer, "")
                      } else if (current.evaluation?.model_answer) {
                        // Check if model_answer object itself contains the text
                        const ma = current.evaluation.model_answer as any
                        if (typeof ma === "string") {
                          modelText = ma
                        } else if (ma.text) {
                          modelText = safeText(ma.text, "")
                        } else if (ma.answer) {
                          modelText = safeText(ma.answer, "")
                        }
                      }
                      
                      // Check for alternative field names
                      if (!modelText && current.evaluation) {
                        const ev = current.evaluation as any
                        if (ev.modelAnswer) {
                          modelText = safeText(ev.modelAnswer, "")
                        } else if (ev.model_ans) {
                          modelText = safeText(ev.model_ans, "")
                        }
                      }
                      
                      if (!modelText || modelText === "No model answer provided" || modelText.trim() === "") {
                        return <p className="text-muted-foreground italic">No model answer provided</p>
                      }
                      
                      // Split by **bold** markers and highlight
                      const parts = modelText.split(/(\*\*.*?\*\*)/g)
                      return parts.map((part, idx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          const boldText = part.slice(2, -2)
                          return (
                            <span key={idx} className="font-bold bg-yellow-300 text-black px-1 rounded">
                              {boldText}
                            </span>
                          )
                        }
                        return <span key={idx}>{part}</span>
                      })
                    })()}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
          >
            ← Previous
          </Button>

          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>

          <Button
            onClick={() => setActiveIdx(Math.min(results.length - 1, activeIdx + 1))}
            disabled={activeIdx === results.length - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <MainsTestEvaluationContent />
    </Suspense>
  )
}
