"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Summary = {
  total_questions: number
  attempted: number
  correct: number
  incorrect: number
  unattempted: number
  score: number
  max_score: number
  percentage: number
  negative_marks: number
}

type DetailedResult = {
  question_id: string | number | null
  serial_no: number | null
  user_answer: string | null
  correct_answer: string
  is_correct: boolean | null
  marks_obtained: number
  explanation: string
}

type EvalResponse = {
  success?: boolean
  message?: string
  test_id: string
  evaluation_id?: string
  exam_type?: string
  evaluated_at?: string
  summary: Summary
  detailed_results: DetailedResult[]
  analytics?: any
}

export default function PrelimsTestEvaluationPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const testId = sp.get("test_id") || ""

  const [data, setData] = useState<EvalResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      if (!testId) {
        setError("Missing test_id. Please submit the test again.")
        return
      }

      const raw = sessionStorage.getItem(`prelims_evaluation:${testId}`)
      if (!raw) {
        setError("Evaluation data not found in session. Please submit again.")
        return
      }

      const parsed = JSON.parse(raw)
      setData(parsed)
    } catch (e) {
      setError("Failed to load evaluation data. Please submit again.")
    }
  }, [testId])

  const results = useMemo(() => {
    if (!data?.detailed_results) return []
    return [...data.detailed_results].sort((a, b) => (a.serial_no ?? 0) - (b.serial_no ?? 0))
  }, [data])

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="mx-auto max-w-3xl p-6">
          <h1 className="text-xl font-semibold">Prelims Test Evaluation</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="mx-auto max-w-3xl p-6">
          <h1 className="text-xl font-semibold">Prelims Test Evaluation</h1>
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        </Card>
      </div>
    )
  }

  const s = data.summary

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Prelims Test Evaluation</h1>
              <div className="mt-1 text-sm text-muted-foreground">
                Test ID: <span className="font-medium text-foreground">{data.test_id}</span>
              </div>
              {data.evaluated_at ? (
                <div className="text-xs text-muted-foreground">
                  Evaluated at: {new Date(data.evaluated_at).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl bg-muted px-4 py-3">
              <div className="text-2xl font-bold text-foreground">
                {s.score} / {s.max_score}
              </div>
              <div className="text-sm text-muted-foreground">{s.percentage}%</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
            <Stat label="Total" value={s.total_questions} />
            <Stat label="Attempted" value={s.attempted} />
            <Stat label="Correct" value={s.correct} />
            <Stat label="Incorrect" value={s.incorrect} />
            <Stat label="Unattempted" value={s.unattempted} />
            <Stat label="Negative" value={s.negative_marks} />
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push("/test-builder")}>
              Take Another Test
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Question-wise Evaluation</h2>

          <div className="mt-4 space-y-4">
            {results.map((r, idx) => (
              <div key={`${r.question_id}-${idx}`} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium">
                      Q{r.serial_no ?? idx + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Question ID: <span className="font-medium text-foreground">{r.question_id ?? "-"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                        r.is_correct === true
                          ? "bg-green-100 text-green-700"
                          : r.is_correct === false
                          ? "bg-red-100 text-red-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.is_correct === true ? "Correct" : r.is_correct === false ? "Wrong" : "N/A"}
                    </span>

                    <span className="text-sm font-semibold">
                      Marks:{" "}
                      <span className={r.marks_obtained < 0 ? "text-red-700" : "text-foreground"}>
                        {r.marks_obtained}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Info label="Your Answer" value={r.user_answer || "-"} />
                  <Info label="Correct Answer" value={r.correct_answer || "-"} />
                  <Info label="Explanation" value={r.explanation || "—"} long />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {data.analytics ? (
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <pre className="mt-3 overflow-auto rounded-xl bg-muted p-4 text-xs">
              {JSON.stringify(data.analytics, null, 2)}
            </pre>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  )
}

function Info({ label, value, long }: { label: string; value: any; long?: boolean }) {
  return (
    <div className={`rounded-xl bg-muted p-3 ${long ? "md:col-span-3" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm whitespace-pre-wrap text-foreground">{String(value)}</div>
    </div>
  )
}
