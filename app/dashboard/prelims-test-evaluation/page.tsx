"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import {
  Award,
  ClipboardList,
  CircleSlash,
  CheckCircle,
  XCircle,
  Percent,
  Clock,
  Flag,
  BookOpen,
  Target,
  AlertTriangle,
} from "lucide-react"

type AnyObj = Record<string, any>

type RichRow = {
  test_id?: string
  serial_no?: number
  question_id?: string
  selected_option?: string | null
  time_spent_second?: number
  time_spent_seconds?: number
  marked_for_review?: boolean
  year?: number
  set?: string

  question_text?: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer?: string

  subject?: string
  theme?: string
  sub_theme?: string

  marks_obtained?: number
  difficulty?: string

  core_concept_tested?: string
  correct_answer_justification?: string
  why_upsc_style?: string
  final_elimination_strategy?: string

  option_A_verdict?: string
  option_A_reason?: string
  option_A_error_type?: string
  option_A_elimination_cue?: string

  option_B_verdict?: string
  option_B_reason?: string
  option_B_error_type?: string
  option_B_elimination_cue?: string

  option_C_verdict?: string
  option_C_reason?: string
  option_C_error_type?: string
  option_C_elimination_cue?: string

  option_D_verdict?: string
  option_D_reason?: string
  option_D_error_type?: string
  option_D_elimination_cue?: string

  micro_notes_A?: string
  micro_notes_B?: string
  micro_notes_C?: string
  micro_notes_D?: string

  confidence_verification_note?: string

  // IMPORTANT: exact key with spaces/parentheses
  "Correct Answer (Y/N)"?: boolean | string
}

type UiRow = RichRow & {
  _uiIndex: number
  _tabId: string
}

function safeParse(v: any) {
  if (typeof v !== "string") return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

function unwrapPayload(raw: any) {
  let v = raw
  for (let i = 0; i < 6; i++) {
    v = safeParse(v)
    v = v?.body ?? v?.json ?? v?.data ?? v?.results ?? v?.items ?? v?.output ?? v
  }
  return safeParse(v)
}

function toNum(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeBoolYN(v: any): boolean | null {
  if (typeof v === "boolean") return v
  if (typeof v === "string") {
    const t = v.trim().toLowerCase()
    if (["y", "yes", "true", "correct"].includes(t)) return true
    if (["n", "no", "false", "incorrect"].includes(t)) return false
  }
  return null
}

function isAttempted(row: RichRow) {
  const sel = (row.selected_option ?? "").toString().trim()
  if (!sel) return false
  if (sel === "-" || sel.toLowerCase() === "na" || sel.toLowerCase() === "null") return false
  return true
}

function isCorrectRow(row: RichRow) {
  const yn = normalizeBoolYN((row as AnyObj)["Correct Answer (Y/N)"])
  if (yn !== null) return yn

  // fallback: compare selected vs correct if both present
  const sel = (row.selected_option ?? "").toString().trim().toUpperCase()
  const cor = (row.correct_answer ?? "").toString().trim().toUpperCase()
  if (sel && cor) return sel === cor
  return false
}

function getTimeSpent(row: RichRow) {
  if (row.time_spent_second !== undefined) return row.time_spent_second
  if (row.time_spent_seconds !== undefined) return row.time_spent_seconds
  return undefined
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-background border border-border text-muted-foreground">
      {children}
    </span>
  )
}

export default function PrelimsEvaluationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams?.get("test_id")

  const [rows, setRows] = useState<RichRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("")

  // ✅ DO NOT change backend logic (sessionStorage fetch approach kept)
  useEffect(() => {
    if (!testId) {
      setError("No test ID provided")
      setLoading(false)
      return
    }

    try {
      const keys = [
        `prelims_eval_results:${testId}`,
        `prelims_eval_results:last`,
        `prelims_evaluation:${testId}`,
        `prelims_evaluation:last`,
      ]

      let found: any = null

      for (const k of keys) {
        const raw = typeof window !== "undefined" ? sessionStorage?.getItem(k) : null
        if (!raw) continue
        found = unwrapPayload(raw)
        if (found) break
      }

      if (!found) {
        setError("Results not found. Please submit the test again.")
        setLoading(false)
        return
      }

      let normalized: RichRow[] = []

      if (Array.isArray(found)) normalized = found
      else if (Array.isArray(found?.data)) normalized = found.data
      else if (Array.isArray(found?.results)) normalized = found.results
      else if (Array.isArray(found?.items)) normalized = found.items
      else if (Array.isArray(found?.output)) normalized = found.output
      else if (found?.raw && Array.isArray(found.raw)) normalized = found.raw
      else if (found && typeof found === "object" && (found.test_id || found.question_id)) normalized = [found]

      if (!normalized || normalized.length === 0) {
        setError("No question data found in results. Data may not have been stored properly.")
        setLoading(false)
        return
      }

      // keep sort but UI tab will not use serial_no as unique id
      normalized.sort((a, b) => (a.serial_no || 0) - (b.serial_no || 0))

      setRows(normalized)
      setError(null)
    } catch (err: any) {
      setError(err?.message || "Failed to load results")
    } finally {
      setLoading(false)
    }
  }, [testId])

  const uiRows: UiRow[] = useMemo(() => {
    return rows.map((r, idx) => {
      const qid = (r.question_id ?? "").toString().trim()
      const tabId = qid ? qid : `idx-${idx + 1}` // never use serial_no (can repeat)
      return { ...r, _uiIndex: idx + 1, _tabId: tabId }
    })
  }, [rows])

  useEffect(() => {
    if (!uiRows.length) return
    if (!activeTab) setActiveTab(uiRows[0]._tabId)
    else if (!uiRows.some((r) => r._tabId === activeTab)) setActiveTab(uiRows[0]._tabId)
  }, [uiRows, activeTab])

  // ===== Top cards stats =====
  const stats = useMemo(() => {
    const total = uiRows.length
    const attempted = uiRows.filter(isAttempted).length
    const unattempted = total - attempted
    const correct = uiRows.filter(isCorrectRow).length
    const incorrect = total - correct

    const totalMarks = uiRows.reduce((s, r) => s + toNum(r.marks_obtained, 0), 0)
    const maxMarks = total * 2 // your prelims scoring: +2 correct (assumption). Can replace if you store max.

    const accuracy = total > 0 ? (correct / total) * 100 : 0

    return { total, attempted, unattempted, correct, incorrect, totalMarks, maxMarks, accuracy }
  }, [uiRows])

  const optionText = (r: RichRow, opt: "A" | "B" | "C" | "D") => {
    if (opt === "A") return r.option_a
    if (opt === "B") return r.option_b
    if (opt === "C") return r.option_c
    return r.option_d
  }

  const getOptionStatus = (opt: "A" | "B" | "C" | "D", row: RichRow) => {
    const sel = (row.selected_option ?? "").toString().trim().toUpperCase()
    const cor = (row.correct_answer ?? "").toString().trim().toUpperCase()

    if (opt === cor) return "correct"
    if (opt === sel && sel && sel !== cor) return "incorrect"
    if (opt === sel && sel && sel === cor) return "correct"
    return "neutral"
  }

  const renderOptions = (row: RichRow) => {
    const opts: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"]

    return (
      <div className="space-y-3">
        {opts.map((o) => {
          const status = getOptionStatus(o, row)
          const isOk = status === "correct"
          const isBad = status === "incorrect"
          const isSelected = (row.selected_option ?? "").toString().trim().toUpperCase() === o
          const text = optionText(row, o)

          return (
            <div
              key={o}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                isOk && "border-emerald-400/60 bg-emerald-50/50",
                isBad && "border-rose-400/60 bg-rose-50/50",
                status === "neutral" && "border-border bg-background"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm flex-shrink-0",
                    isOk && "border-emerald-500 bg-emerald-100 text-emerald-700",
                    isBad && "border-rose-500 bg-rose-100 text-rose-700",
                    status === "neutral" && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {o}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words">{text || "-"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isSelected && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                        ✓ Your answer
                      </span>
                    )}
                    {((row.correct_answer ?? "").toString().trim().toUpperCase() === o) && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-700">
                        ✓ Correct answer
                      </span>
                    )}
                  </div>
                </div>

                {isOk && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                {isBad && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderOptionAccordion = (row: RichRow) => {
    const opts: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"]

    const get = (k: string) => (row as AnyObj)[k] as string | undefined

    return (
      <Accordion type="single" collapsible className="w-full">
        {opts.map((o) => {
          const verdict = get(`option_${o}_verdict`) || "-"
          const reason = get(`option_${o}_reason`) || "-"
          const errType = get(`option_${o}_error_type`) || "-"
          const elimCue = get(`option_${o}_elimination_cue`) || "-"

          const v = verdict.toString().trim().toLowerCase()
          const isCorrect = v === "correct"
          const isIncorrect = v === "incorrect"

          return (
            <AccordionItem key={o} value={o} className="border-b last:border-0">
              <AccordionTrigger className="hover:bg-muted/40 px-3 rounded-md">
                <div className="flex items-center gap-3 w-full">
                  <span className="font-semibold text-foreground">Option {o}</span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded border",
                      isCorrect && "bg-emerald-100 text-emerald-700 border-emerald-200",
                      isIncorrect && "bg-rose-100 text-rose-700 border-rose-200",
                      !isCorrect && !isIncorrect && "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {verdict}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-3 pb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reason}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border bg-background">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Error Type</p>
                      <p className="text-sm text-foreground">{errType}</p>
                    </div>
                    <div className="p-3 rounded-md border bg-background">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Elimination Cue</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{elimCue}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary">
        <Card className="p-8 max-w-md w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <Card className="p-8 max-w-md w-full border-destructive/20 bg-destructive/5">
          <h1 className="text-2xl font-bold text-foreground mb-4">Prelims Test Results</h1>
          <p className="text-destructive mb-6">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/dashboard")} className="flex-1" variant="default">
              Go to Dashboard
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="flex-1">
              Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Prelims Test Results</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your performance on all questions</p>
        </div>

        {/* ✅ 6 TOP CARDS (different colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-5 border border-emerald-200 bg-emerald-50/60 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-emerald-800/80">Total Score</p>
                <p className="text-2xl font-bold text-emerald-900 mt-2">
                  {stats.totalMarks.toFixed(2)}/{stats.maxMarks}
                </p>
              </div>
              <Award className="w-7 h-7 text-emerald-700/60" />
            </div>
          </Card>

          <Card className="p-5 border border-sky-200 bg-sky-50/60 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-800/80">Attempted</p>
                <p className="text-2xl font-bold text-sky-900 mt-2">{stats.attempted}</p>
              </div>
              <ClipboardList className="w-7 h-7 text-sky-700/60" />
            </div>
          </Card>

          <Card className="p-5 border border-slate-200 bg-slate-50/70 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-800/80">Unattempted</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.unattempted}</p>
              </div>
              <CircleSlash className="w-7 h-7 text-slate-700/60" />
            </div>
          </Card>

          <Card className="p-5 border border-emerald-200 bg-emerald-50/60 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-emerald-800/80">Correct</p>
                <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.correct}</p>
              </div>
              <CheckCircle className="w-7 h-7 text-emerald-700/60" />
            </div>
          </Card>

          <Card className="p-5 border border-rose-200 bg-rose-50/60 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-rose-800/80">Incorrect</p>
                <p className="text-2xl font-bold text-rose-900 mt-2">{stats.incorrect}</p>
              </div>
              <XCircle className="w-7 h-7 text-rose-700/60" />
            </div>
          </Card>

          <Card className="p-5 border border-violet-200 bg-violet-50/60 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-violet-800/80">Accuracy</p>
                <p className="text-2xl font-bold text-violet-900 mt-2">{stats.accuracy.toFixed(1)}%</p>
              </div>
              <Percent className="w-7 h-7 text-violet-700/60" />
            </div>
          </Card>
        </div>

        {/* ✅ Horizontal Q Tabs */}
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-4 border-b border-border bg-muted/10">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Questions</p>

              <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2">
                {uiRows.map((r) => {
                  const ok = isCorrectRow(r)
                  const isActive = activeTab === r._tabId
                  return (
                    <TabsTrigger
                      key={r._tabId}
                      value={r._tabId}
                      className={cn(
                        "h-11 w-14 rounded-xl p-0 border-2 font-bold",
                        "data-[state=active]:shadow-sm",
                        ok ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50",
                        isActive && "ring-2 ring-primary/30"
                      )}
                    >
                      <span className={cn("text-xs", ok ? "text-emerald-700" : "text-rose-700")}>
                        Q{r._uiIndex}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Details */}
            <div className="p-6">
              {uiRows.map((row) => {
                const ok = isCorrectRow(row)
                const timeSpent = getTimeSpent(row)

                return (
                  <TabsContent key={row._tabId} value={row._tabId} className="mt-0 space-y-6">
                    {/* Question + Meta */}
                    <div
                      className={cn(
                        "p-6 rounded-lg border-2",
                        ok ? "bg-emerald-50/50 border-emerald-300/70" : "bg-rose-50/50 border-rose-300/70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Question {row._uiIndex}
                          </p>
                          <h2 className="text-lg font-bold text-foreground break-words">
                            {row.question_text || "-"}
                          </h2>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className={cn("text-sm font-semibold", ok ? "text-emerald-700" : "text-rose-700")}>
                            {ok ? "Correct" : "Incorrect"}
                          </p>
                          <p className={cn("text-2xl font-bold", ok ? "text-emerald-800" : "text-rose-800")}>
                            {row.marks_obtained ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {row.test_id && <Chip>Test: {row.test_id}</Chip>}
                        {row.serial_no !== undefined && <Chip>Serial: {row.serial_no}</Chip>}
                        {row.question_id && <Chip>QID: {row.question_id}</Chip>}
                        {row.year !== undefined && <Chip>Year: {row.year}</Chip>}
                        {row.set && <Chip>Set: {row.set}</Chip>}
                        {timeSpent !== undefined && (
                          <Chip>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeSpent}s
                            </span>
                          </Chip>
                        )}
                        {row.marked_for_review && (
                          <Chip>
                            <span className="inline-flex items-center gap-1">
                              <Flag className="w-3 h-3" /> Marked
                            </span>
                          </Chip>
                        )}
                        {row.selected_option ? <Chip>Selected: {row.selected_option}</Chip> : <Chip>Selected: -</Chip>}
                        {row.correct_answer && <Chip>Correct: {row.correct_answer}</Chip>}
                        {row.difficulty && <Chip>Difficulty: {row.difficulty}</Chip>}
                        {row.subject && <Chip>Subject: {row.subject}</Chip>}
                        {row.theme && <Chip>Theme: {row.theme}</Chip>}
                        {row.sub_theme && <Chip>Sub-theme: {row.sub_theme}</Chip>}
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Options
                      </h3>
                      {renderOptions(row)}
                    </div>

                    {/* Sections: Explanation / Strategy / Analysis */}
                    <div className="rounded-lg border bg-background p-4">
                      <Tabs defaultValue="explanation" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-secondary">
                          <TabsTrigger value="explanation">Explanation</TabsTrigger>
                          <TabsTrigger value="strategy">Strategy</TabsTrigger>
                          <TabsTrigger value="analysis">Analysis</TabsTrigger>
                        </TabsList>

                        <TabsContent value="explanation" className="mt-4 space-y-4">
                          <div className="p-4 rounded-md border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-1 inline-flex items-center gap-2">
                              <BookOpen className="w-4 h-4" /> Core Concept Tested
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {row.core_concept_tested || "-"}
                            </p>
                          </div>

                          <div className="p-4 rounded-md border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Correct Answer Justification</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {row.correct_answer_justification || "-"}
                            </p>
                          </div>

                          <div className="p-4 rounded-md border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Why UPSC Style</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {row.why_upsc_style || "-"}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="strategy" className="mt-4">
                          <div className="p-4 rounded-md border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Final Elimination Strategy</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {row.final_elimination_strategy || "-"}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="analysis" className="mt-4 space-y-4">
                          <div className="p-4 rounded-md border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-3">
                              Option-wise Analysis (Verdict • Reason • Error Type • Elimination Cue)
                            </p>
                            {renderOptionAccordion(row)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-md border bg-background">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Micro Notes A</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{row.micro_notes_A || "-"}</p>
                            </div>
                            <div className="p-4 rounded-md border bg-background">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Micro Notes B</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{row.micro_notes_B || "-"}</p>
                            </div>
                            <div className="p-4 rounded-md border bg-background">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Micro Notes C</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{row.micro_notes_C || "-"}</p>
                            </div>
                            <div className="p-4 rounded-md border bg-background">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Micro Notes D</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{row.micro_notes_D || "-"}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded-md border bg-amber-50/60 border-amber-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-amber-900 mb-1">Confidence / Verification Note</p>
                                <p className="text-sm text-amber-900 whitespace-pre-wrap">
                                  {row.confidence_verification_note || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </TabsContent>
                )
              })}
            </div>
          </Tabs>
        </Card>

        <div className="flex gap-3 mt-8">
          <Button onClick={() => router.push("/dashboard")} className="flex-1" variant="default">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
