"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  BookOpen,
  Trophy,
  XCircle,
  MinusCircle,
  Upload,
  FileText,
  X,
  Camera,
  Smartphone,
  PenLine
} from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface TestMetadata {
  exam_type: "prelims" | "mains"
  paper_type: string
  language: string
  total_questions?: number
  number_of_questions?: number
  question_source: string
  time_limit_minutes: number
  total_marks: number
}

interface Question {
  question_id?: string
  questionId?: string
  serial_no?: number
  year?: number
  question_text?: string
  questionText?: string
  source?: "pyq" | "mock"
  options?: {
    A: string
    B: string
    C: string
    D: string
  }
  subject?: string
  theme?: string
  subTheme?: string
  sub_theme?: string
  difficulty?: string
  marks?: number
  wordLimit?: number
  word_limit?: number
  keyPoints?: string
  key_points?: string
  modelAnswer?: string
  model_answer?: string
  metadata?: {
    subject: string
    theme: string
    sub_theme?: string
    difficulty: string
    correct_answer?: string
  }
}

interface TestData {
  test_id: string
  status: string
  created_at: string
  test_metadata: TestMetadata
  questions: Question[]
  answer_key?: Record<string, {
    correct_answer: string
    explanation: string
  }>
}

interface UploadedFile {
  file: File
  preview: string
  type: "image" | "pdf"
}

interface UserAnswer {
  question_id: string
  serial_no: number
  selected_option?: string | null
  written_answer?: string
  uploaded_files?: UploadedFile[]
  time_spent_seconds: number
  marked_for_review: boolean
}

interface EvaluationResult {
  test_id: string
  evaluation_id: string
  summary: {
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
  detailed_results: Array<{
    question_id: string
    serial_no: number
    user_answer: string | null
    correct_answer: string
    is_correct: boolean
    marks_obtained: number
    explanation: string
  }>
  analytics: {
    subject_wise: Record<string, { correct: number; total: number; percentage: number }>
    difficulty_wise: Record<string, { correct: number; total: number }>
    time_analysis: {
      total_time: string
      avg_time_per_question: string
    }
  }
}

// ============================================
// DATA NORMALIZATION - CRITICAL FIX
// ============================================


// NOTE: N8N/webhooks sometimes alter key casing or wrap payloads.
// These helpers make field access tolerant without changing Prelims UI rendering.
function getLoose(obj: any, keys: string[]): any {
  if (!obj) return undefined

  // direct hit
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k]
  }

  // case-insensitive / punctuation-insensitive hit
  const normalized = (s: string) => String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, "")
  const want = new Set(keys.map(normalized))
  for (const k of Object.keys(obj)) {
    if (want.has(normalized(k))) return obj[k]
  }

  return undefined
}

function asArrayMaybe<T = any>(v: any): T[] {
  if (!v) return []
  if (Array.isArray(v)) return v as T[]
  if (typeof v === "object") return Object.values(v) as T[] // handles {"0": {...}, "1": {...}}
  return []
}

// Next.js / n8n responses sometimes arrive as JSON strings inside wrappers (e.g., { body: "{...}" }).
// This helper safely parses ONLY when it looks like JSON.
function tryParseJsonMaybe(v: any): any {
  if (typeof v !== "string") return v
  const s = v.trim()
  if (!s) return v
  const looksJson = (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))
  if (!looksJson) return v
  try {
    return JSON.parse(s)
  } catch {
    return v
  }
}

function normalizeTestData(rawData: any): TestData {
  console.log('[normalizeTestData] Input:', rawData)
  
  // Step 1: Unwrap the data from any wrappers
  let data: any = tryParseJsonMaybe(rawData)

  // Unwrap a few layers safely (n8n + Next.js routes often nest / stringify payloads)
  for (let i = 0; i < 6; i++) {
    data = tryParseJsonMaybe(data)
    if (Array.isArray(data)) data = data[0]

    const next =
      (data?.json ??
        data?.body ??
        data?.output ??
        data?.result ??
        data?.payload ??
        data?.testData ??
        data?.test_data ??
        // axios-style wrapper
        (data?.data && !data?.questions && !data?.test_metadata ? data.data : undefined))

    if (next === undefined) break
    data = next
  }

  data = tryParseJsonMaybe(data)
  if (Array.isArray(data)) data = data[0]
  
  console.log('[normalizeTestData] After unwrap:', data)
  
  if (!data) {
    return createEmptyTestData()
  }
  
  // Step 2: Extract metadata - support both total_questions and number_of_questions
  const totalQuestions = data?.test_metadata?.total_questions || 
                         data?.test_metadata?.number_of_questions || 
                         data?.total_questions || 
                         data?.number_of_questions || 
                         0
  
  const testMetadata: TestMetadata = {
    exam_type: data?.test_metadata?.exam_type || data?.exam_type || 'mains',
    paper_type: data?.test_metadata?.paper_type || data?.paper_type || 'GS1',
    language: data?.test_metadata?.language || data?.language || 'en',
    total_questions: totalQuestions,
    number_of_questions: totalQuestions,
    question_source: data?.test_metadata?.question_source || data?.question_source || 'pyq',
    time_limit_minutes: data?.test_metadata?.time_limit_minutes || data?.time_limit_minutes || 60,
    total_marks: data?.test_metadata?.total_marks || data?.total_marks || 0
  }
  
  // Step 3: Extract and normalize questions - PRESERVE ORIGINAL DATA
  let questions: any[] = asArrayMaybe(getLoose(data, ['questions','Questions']))
  
  console.log('[normalizeTestData] Raw questions:', questions)
  
  // Map questions while PRESERVING the questionText field
  const normalizedQuestions = questions.map((q: any, index: number) => {
    // CRITICAL: Get questionText directly from the source
    const questionText = mainsText(getLoose(q, ['questionText','question_text','Question_Text','QuestionText','text','question','Question']))
    
    console.log(`[normalizeTestData] Q${index + 1} text:`, questionText.substring(0, 50))
    
    const qId = mainsText(
      getLoose(q, [
        'questionId',
        'question_id',
        'questionID',
        'questionid',
        'QuestionId',
        'Question_ID',
        'QuestionID',
      ])
    ).trim() || `Q${index + 1}`

    return {
      questionId: qId,
      question_id: qId,
      serial_no: q.serial_no || q.serialNo || index + 1,
      year: q.year || null,
      // CRITICAL: Store the text in BOTH fields
      questionText: questionText,
      question_text: questionText,
      subject: mainsText(getLoose(q, ['subject','Subject'])) || mainsText(q?.metadata?.subject) || 'General Studies',
      theme: mainsText(getLoose(q, ['theme','Theme'])) || mainsText(q?.metadata?.theme) || '',
      subTheme: mainsText(getLoose(q, ['subTheme','sub_theme','SubTheme','Sub_Theme','sub_theme_name','subThemeName'])) || mainsText(q?.metadata?.sub_theme) || '',
      sub_theme: mainsText(getLoose(q, ['subTheme','sub_theme','SubTheme','Sub_Theme','sub_theme_name','subThemeName'])) || mainsText(q?.metadata?.sub_theme) || '',
      difficulty: mainsText(getLoose(q, ['difficulty','Difficulty'])) || mainsText(q?.metadata?.difficulty) || 'Medium',
      marks: Number(getLoose(q, ['marks','Marks'])) || 10,
      wordLimit: Number(getLoose(q, ['wordLimit','word_limit','WordLimit','Word_Limit'])) || 150,
      word_limit: Number(getLoose(q, ['wordLimit','word_limit','WordLimit','Word_Limit'])) || 150,
      keyPoints: mainsText(getLoose(q, ['keyPoints','key_points','KeyPoints','Key_Points'])) || '',
      modelAnswer: mainsText(getLoose(q, ['modelAnswer','model_answer','ModelAnswer','Model_Answer'])) || '',
      options: (getLoose(q, ['options','Options']) as any) || null,
      metadata: q.metadata || null,
      source: q.source || 'pyq'
    }
  })
  
  // Recalculate totals if needed
  if (testMetadata.total_marks === 0 && normalizedQuestions.length > 0) {
    testMetadata.total_marks = normalizedQuestions.reduce((sum, q) => sum + (q.marks || 10), 0)
  }
  
  if ((testMetadata.total_questions || 0) === 0) {
    testMetadata.total_questions = normalizedQuestions.length
    testMetadata.number_of_questions = normalizedQuestions.length
  }
  
  const result: TestData = {
    test_id: data?.test_id || `TEST_${Date.now()}`,
    status: data?.status || 'ready',
    created_at: data?.created_at || new Date().toISOString(),
    test_metadata: testMetadata,
    questions: normalizedQuestions,
    answer_key: data?.answer_key || {}
  }
  
  console.log('[normalizeTestData] Final result:', result)
  
  return result
}

function createEmptyTestData(): TestData {
  return {
    test_id: `TEST_${Date.now()}`,
    status: 'error',
    created_at: new Date().toISOString(),
    test_metadata: {
      exam_type: 'mains',
      paper_type: 'GS1',
      language: 'en',
      total_questions: 0,
      number_of_questions: 0,
      question_source: 'pyq',
      time_limit_minutes: 60,
      total_marks: 0
    },
    questions: [],
    answer_key: {}
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getQuestionText(q: Question): string {
  return q.questionText || q.question_text || ''
}

// ============================================
// MAINS-SAFE FIELD EXTRACTORS
// (Used only in the MAINS UI block; Prelims UI is untouched)
// ============================================

function mainsText(v: any): string {
  if (v == null) return ""
  if (Array.isArray(v)) return v.filter(Boolean).join("\n")
  return typeof v === "string" ? v : String(v)
}

function mainsNumber(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function getMainsQuestionText(q: Question): string {
  const anyQ: any = q
  const v =
    getLoose(anyQ, [
      "questionText",
      "question_text",
      "QuestionText",
      "Question_Text",
      "text",
      "question",
      "Question",
    ]) ??
    getLoose(anyQ?.metadata, ["questionText", "question_text", "QuestionText", "Question_Text", "question", "Question"]) ??
    ""
  return mainsText(v).trim()
}

function getMainsSubject(q: Question): string {
  const anyQ: any = q
  const v = getLoose(anyQ, ["subject", "Subject"]) ?? getLoose(anyQ?.metadata, ["subject", "Subject"]) ?? "General Studies"
  return mainsText(v).trim() || "General Studies"
}

function getMainsTheme(q: Question): string {
  const anyQ: any = q
  const v = getLoose(anyQ, ["theme", "Theme"]) ?? getLoose(anyQ?.metadata, ["theme", "Theme"]) ?? ""
  return mainsText(v).trim()
}

function getMainsSubTheme(q: Question): string {
  const anyQ: any = q
  const v =
    getLoose(anyQ, ["subTheme", "sub_theme", "SubTheme", "Sub_Theme"]) ??
    getLoose(anyQ?.metadata, ["subTheme", "sub_theme", "SubTheme", "Sub_Theme"]) ??
    ""
  return mainsText(v).trim()
}

function getMainsYear(q: Question): number | null {
  const anyQ: any = q
  const v = getLoose(anyQ, ["year", "Year"]) ?? getLoose(anyQ?.metadata, ["year", "Year"]) ?? undefined
  return mainsNumber(v) ?? null
}

function getMainsMarks(q: Question): number {
  const anyQ: any = q
  const v =
    getLoose(anyQ, ["marks", "Marks"]) ??
    getLoose(anyQ?.metadata, ["marks", "Marks"]) ??
    undefined
  return (mainsNumber(v) ?? 10) as number
}

function getMainsWordLimit(q: Question): number {
  const anyQ: any = q
  const v =
    getLoose(anyQ, ["wordLimit", "word_limit", "WordLimit", "Word_Limit"]) ??
    getLoose(anyQ?.metadata, ["wordLimit", "word_limit", "WordLimit", "Word_Limit"]) ??
    undefined
  return (mainsNumber(v) ?? 150) as number
}

function getMainsQuestionId(q: Question): string {
  const anyQ: any = q
  const v =
    getLoose(anyQ, [
      "questionId",
      "question_id",
      "questionID",
      "questionid",
      "QuestionId",
      "Question_ID",
      "QuestionID",
    ]) ??
    getLoose(anyQ?.metadata, ["questionId", "question_id", "questionID", "questionid"]) ??
    ""
  return mainsText(v).trim()
}

function getMainsKeyPoints(q: Question): string {
  const anyQ: any = q
  const v =
    getLoose(anyQ, ["keyPoints", "key_points", "KeyPoints", "Key_Points"]) ??
    getLoose(anyQ?.metadata, ["keyPoints", "key_points", "KeyPoints", "Key_Points"]) ??
    ""
  return mainsText(v).trim()
}

function getMainsModelAnswer(q: Question): string {
  const anyQ: any = q
  const v =
    getLoose(anyQ, ["modelAnswer", "model_answer", "ModelAnswer", "Model_Answer"]) ??
    getLoose(anyQ?.metadata, ["modelAnswer", "model_answer", "ModelAnswer", "Model_Answer"]) ??
    ""
  return mainsText(v).trim()
}

function getQuestionId(q: Question): string {
  return q.questionId || q.question_id || `Q${Math.random().toString(36).substr(2, 9)}`
}

function getSerialNo(q: Question, index: number): number {
  return q.serial_no ?? index + 1
}

function getSubject(q: Question): string {
  return q.subject || q.metadata?.subject || 'General Studies'
}

function getTheme(q: Question): string {
  return q.theme || q.metadata?.theme || ''
}

function getSubTheme(q: Question): string {
  return q.subTheme || q.sub_theme || q.metadata?.sub_theme || ''
}

function getDifficulty(q: Question): string {
  return q.difficulty || q.metadata?.difficulty || 'Medium'
}

function getYear(q: Question): number | null {
  return q.year || null
}

function getNumberOfQuestions(metadata: TestMetadata): number {
  return metadata.number_of_questions || metadata.total_questions || 0
}

function calculateQuestionTimer(paperType: string, marks: number): number {
  switch (paperType.toUpperCase()) {
    case 'GS1':
    case 'GS2':
    case 'GS3':
    case 'GS4':
      return marks * 60
    case 'ESSAY':
      return 90 * 60
    default:
      return marks * 60
  }
}

// ============================================
// FILE UPLOAD COMPONENT
// ============================================
function FileUploadZone({ 
  files, 
  onFilesChange,
  disabled = false
}: { 
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'

      if (isImage || isPdf) {
        let preview = ''
        if (isImage) {
          preview = URL.createObjectURL(file)
        }
        
        newFiles.push({
          file,
          preview,
          type: isImage ? 'image' : 'pdf'
        })
      }
    }

    onFilesChange([...files, ...newFiles])
    
    if (e.target) {
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview)
    }
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all",
          disabled ? "opacity-50 cursor-not-allowed bg-muted/30" : "hover:border-primary hover:bg-primary/5 cursor-pointer",
          "border-muted-foreground/25"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Upload your answer
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Click to browse or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: PNG, JPG, JPEG, PDF (Max 10MB each)
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="gap-2 flex-1 max-w-[180px]"
        >
          <Camera className="h-5 w-5" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="gap-2 flex-1 max-w-[180px]"
        >
          <Smartphone className="h-5 w-5" />
          Browse Files
        </Button>
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-3">
            Uploaded Files ({files.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="relative group border rounded-lg overflow-hidden bg-muted aspect-[4/3]"
              >
                {file.type === 'image' ? (
                  <img 
                    src={file.preview || "/placeholder.svg"} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                    <FileText className="h-10 w-10 text-red-500 mb-2" />
                    <span className="text-xs text-red-600 font-medium">PDF</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    disabled={disabled}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                  <p className="text-xs text-white truncate">
                    {file.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN TEST TAKING COMPONENT
// ============================================
export function TestTakingPage({ 
  testData: rawTestData, 
  onSubmit,
  onBack 
}: { 
  testData: any
  onSubmit: (answers: UserAnswer[]) => Promise<EvaluationResult>
  onBack: () => void
}) {
  // Normalize the test data
  const testData = useMemo(() => {
    console.log('[TestTakingPage] Received rawTestData:', rawTestData)
    return normalizeTestData(rawTestData)
  }, [rawTestData])

  // Router used to redirect to the Prelims evaluation page after webhook response
  const router = useRouter()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  // MAINS-only reference toggles (Key Points / Model Answer)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [showModelAnswer, setShowModelAnswer] = useState(false)

  const questions = testData.questions
  const currentQuestion = questions[currentQuestionIndex]
  
  const isMainsExam = testData.test_metadata.exam_type?.toLowerCase() === 'mains'
  const paperType = testData.test_metadata.paper_type || 'GS1'
  const numberOfQuestions = getNumberOfQuestions(testData.test_metadata)

  // NOTE: Use MAINS-safe getters only for MAINS UI (Prelims stays unchanged)
  const currentMarks = isMainsExam ? getMainsMarks(currentQuestion) : (currentQuestion?.marks || 10)
  const currentWordLimit = isMainsExam
    ? getMainsWordLimit(currentQuestion)
    : (currentQuestion?.wordLimit || currentQuestion?.word_limit || 150)
  
  // Debug marks and wordLimit extraction
  console.log('[v0] Current Question for marks/wordLimit:', {
    questionIndex: currentQuestionIndex,
    questionId: (currentQuestion as any)?.questionId,
    rawMarks: (currentQuestion as any)?.marks,
    rawWordLimit: (currentQuestion as any)?.wordLimit,
    extractedMarks: currentMarks,
    extractedWordLimit: currentWordLimit
  })

  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(
    isMainsExam ? calculateQuestionTimer(paperType, currentMarks) : 0
  )
  const [timeRemaining, setTimeRemaining] = useState(
    isMainsExam 
      ? calculateQuestionTimer(paperType, currentMarks)
      : (testData.test_metadata.time_limit_minutes || 60) * 60
  )

  // Initialize user answers
  useEffect(() => {
    if (questions.length === 0) return
    
    const initialAnswers: UserAnswer[] = questions.map((q, idx) => ({
      question_id: getQuestionId(q),
      serial_no: getSerialNo(q, idx),
      selected_option: isMainsExam ? undefined : null,
      written_answer: isMainsExam ? '' : undefined,
      uploaded_files: isMainsExam ? [] : undefined,
      time_spent_seconds: 0,
      marked_for_review: false,
    }))
    setUserAnswers(initialAnswers)
  }, [questions, isMainsExam])

  // Update timer when question changes
  useEffect(() => {
    if (isMainsExam && currentQuestion) {
      const marks = getMainsMarks(currentQuestion)
      const newTime = calculateQuestionTimer(paperType, marks)
      setQuestionTimeRemaining(newTime)
    }
  }, [currentQuestionIndex, isMainsExam, currentQuestion, paperType])

  // Timer countdown
  useEffect(() => {
    if (showResults || questions.length === 0) return

    const timer = setInterval(() => {
      if (isMainsExam) {
        setQuestionTimeRemaining((prev) => {
          if (prev <= 1) {
            if (currentQuestionIndex < questions.length - 1) {
              handleNext()
            } else {
              handleAutoSubmit()
            }
            return 0
          }
          return prev - 1
        })
      } else {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [showResults, isMainsExam, currentQuestionIndex, questions.length])

  useEffect(() => {
    setQuestionStartTime(Date.now())
    // Reset MAINS reference toggles when switching questions
    setShowKeyPoints(false)
    setShowModelAnswer(false)
  }, [currentQuestionIndex])

  const updateTimeSpent = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    setUserAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, time_spent_seconds: ans.time_spent_seconds + timeSpent }
          : ans
      )
    )
  }, [currentQuestionIndex, questionStartTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleOptionSelect = (option: string) => {
    setUserAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, selected_option: option }
          : ans
      )
    )
  }

  const handleWrittenAnswerChange = (text: string) => {
    setUserAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, written_answer: text }
          : ans
      )
    )
  }

  const handleFilesChange = (files: UploadedFile[]) => {
    setUserAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, uploaded_files: files }
          : ans
      )
    )
  }

  const handleMarkForReview = () => {
    setUserAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, marked_for_review: !ans.marked_for_review }
          : ans
      )
    )
  }

  const handleClearResponse = () => {
    setUserAnswers((prev) =>
      prev.map((ans, idx) => {
        if (idx !== currentQuestionIndex) return ans
        if (isMainsExam) {
          return { ...ans, written_answer: '', uploaded_files: [] }
        }
        return { ...ans, selected_option: null }
      })
    )
  }

  const navigateToQuestion = (index: number) => {
    updateTimeSpent()
    setCurrentQuestionIndex(index)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1)
    }
  }

  const handleAutoSubmit = async () => {
    updateTimeSpent()
    await submitTest()
  }

  const handleSubmitClick = () => {
    updateTimeSpent()
    setShowConfirmSubmit(true)
  }

  const submitTest = async () => {
    setIsSubmitting(true)
    try {
      if (isMainsExam) {
        // Calculate total time spent across all questions
        const totalTimeSpent = userAnswers.reduce((sum, ans) => sum + ans.time_spent_seconds, 0)
        
        // Create FormData for file uploads
        const formData = new FormData()
        
        // Add complete test_metadata as JSON string
        const test_metadata = {
          exam_type: testData.test_metadata.exam_type,
          paper_type: testData.test_metadata.paper_type,
          language: testData.test_metadata.language,
          total_questions: questions.length,
          question_source: testData.test_metadata.question_source,
          time_limit_minutes: testData.test_metadata.time_limit_minutes,
          total_marks: testData.test_metadata.total_marks
        }
        formData.append('test_metadata', JSON.stringify(test_metadata))
        
        // Add complete questions array with all details as JSON string
        const questionsData = questions.map((q, index) => ({
          questionId: getMainsQuestionId(q) || `Q_${index + 1}`,
          serial_no: getSerialNo(q, index),
          year: getMainsYear(q) || 2025,
          questionText: getMainsQuestionText(q),
          question_text: getMainsQuestionText(q),
          subject: getMainsSubject(q),
          theme: getMainsTheme(q),
          subTheme: getMainsSubTheme(q),
          difficulty: getDifficulty(q),
          marks: getMainsMarks(q),
          wordLimit: getMainsWordLimit(q),
          keyPoints: getMainsKeyPoints(q),
          modelAnswer: getMainsModelAnswer(q)
        }))
        formData.append('questions', JSON.stringify(questionsData))
        
        // Add user answers with their details
        const answersData = userAnswers.map((ans) => ({
          question_id: ans.question_id,
          serial_no: ans.serial_no,
          written_answer: ans.written_answer || '',
          time_spent_seconds: ans.time_spent_seconds,
          marked_for_review: ans.marked_for_review,
          has_files: (ans.uploaded_files && ans.uploaded_files.length > 0) || false
        }))
        formData.append('answers', JSON.stringify(answersData))
        
        // Add uploaded files with proper naming
        userAnswers.forEach((ans) => {
          if (ans.uploaded_files && ans.uploaded_files.length > 0) {
            ans.uploaded_files.forEach((file, fileIndex) => {
              const fileName = `Q${ans.serial_no}_${ans.question_id}_${fileIndex}.${file.type === 'pdf' ? 'pdf' : file.file.type.split('/')[1] || 'jpg'}`
              formData.append(`file_Q${ans.serial_no}_${fileIndex}`, file.file, fileName)
            })
          }
        })
        
        // Add submission metadata
        formData.append('test_id', testData.test_id)
        formData.append('submitted_at', new Date().toISOString())
        formData.append('total_time_spent', String(totalTimeSpent))
        
        console.log('[v0] Submitting Mains test with files to webhook')
        
        const response = await fetch('https://n8n.srv873027.hstgr.cloud/webhook/mains-test-submit', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('[v0] Webhook response:', result)
        
        /// -------------------------------
        // Store mains evaluation result + redirect (aligned with mains-test-evaluation page)
        // -------------------------------
        const derivedTestId =
          (Array.isArray(result) ? result?.[0]?.test_id : result?.test_id) ||
          testData.test_id

        // Store under multiple keys (so evaluation page ALWAYS finds it)
        sessionStorage.setItem(`mains_eval_results:${derivedTestId}`, JSON.stringify(result))
        sessionStorage.setItem(`mains_eval_results:last`, JSON.stringify(result))
        sessionStorage.setItem(`mains_test_results:${derivedTestId}`, JSON.stringify(result))
        sessionStorage.setItem(`mains_test_results:last`, JSON.stringify(result))

        // Redirect (route: app/dashboard/mains-test-evaluation/page.tsx)
        setIsSubmitting(false)
        setShowConfirmSubmit(false)
        router.push(`/dashboard/mains-test-evaluation?testId=${encodeURIComponent(derivedTestId)}`)
      } else {
        // Prepare JSON payload for Prelims exam
        const totalTimeSpent = userAnswers.reduce((sum, ans) => sum + ans.time_spent_seconds, 0)
        
        const payload = {
          test_id: testData.test_id,
          exam_type: testData.test_metadata.exam_type,
          paper_type: testData.test_metadata.paper_type,
          language: testData.test_metadata.language,
          question_source: testData.test_metadata.question_source,
          submitted_at: new Date().toISOString(),
          test_summary: {
            total_questions: questions.length,
            answered: answeredCount,
            reviewed: reviewCount,
            unattempted: questions.length - answeredCount,
            total_time_spent: totalTimeSpent
          },
          answers: userAnswers.map((ans) => ({
            question_id: ans.question_id,
            serial_no: ans.serial_no,
            selected_option: ans.selected_option || null,
            time_spent_seconds: ans.time_spent_seconds,
            marked_for_review: ans.marked_for_review
          }))
        }
        
        console.log('[v0] Submitting Prelims test payload:', payload)
        
        const response = await fetch('https://n8n.srv873027.hstgr.cloud/webhook/prelims-test-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('[v0] Webhook response (Prelims):', result)

        // Normalize the response (n8n sometimes wraps in { body: ... } or stringifies JSON)
        const tryParse = (v: any) => {
          if (typeof v !== "string") return v
          try {
            return JSON.parse(v)
          } catch {
            return v
          }
        }

        let normalized: any = result
        normalized = normalized?.body ?? normalized
        normalized = tryParse(normalized)

        // Handle the case where webhook returns a SINGLE object (one question at a time)
        // We need to convert it to an array format
        let dataArrayCandidate: any[] = []
        
        if (Array.isArray(normalized)) {
          dataArrayCandidate = normalized
        } else if (Array.isArray(normalized?.data)) {
          dataArrayCandidate = normalized.data
        } else if (Array.isArray(normalized?.results)) {
          dataArrayCandidate = normalized.results
        } else if (Array.isArray(normalized?.items)) {
          dataArrayCandidate = normalized.items
        } else if (Array.isArray(normalized?.output)) {
          dataArrayCandidate = normalized.output
        } else if (normalized && typeof normalized === 'object' && normalized.test_id) {
          // Single question object from webhook - wrap it in array
          dataArrayCandidate = [normalized]
          console.log('[v0] Converted single webhook object to array:', dataArrayCandidate)
        }

        // Determine test_id safely
        const derivedTestId =
          normalized?.test_id ||
          dataArrayCandidate?.[0]?.test_id ||
          payload.test_id

        if (!derivedTestId) {
          throw new Error("Missing test_id in evaluation response")
        }

        const rowsToStore = dataArrayCandidate && dataArrayCandidate.length > 0 ? dataArrayCandidate : []
        
        console.log('[v0] Storing rows:', rowsToStore.length, 'for test:', derivedTestId)

        // ACCUMULATE: Append new rows to existing ones instead of overwriting
        const existingKey = `prelims_eval_results:${derivedTestId}`
        let allRows = []
        try {
          const existing = sessionStorage.getItem(existingKey)
          if (existing) {
            const parsed = JSON.parse(existing)
            allRows = Array.isArray(parsed) ? parsed : []
          }
        } catch (e) {
          console.warn('[v0] Could not parse existing data:', e)
        }

        // Append new rows, avoiding duplicates by checking serial_no
        const existingSerialNos = new Set(allRows.map((r: any) => r.serial_no))
        const newRows = rowsToStore.filter((r: any) => !existingSerialNos.has(r.serial_no))
        
        allRows = [...allRows, ...newRows]
        console.log('[v0] Accumulated total rows:', allRows.length)

        // Store accumulated rows in keys that your Results page reads
        sessionStorage.setItem(existingKey, JSON.stringify(allRows))
        sessionStorage.setItem(`prelims_eval_results:last`, JSON.stringify(allRows))

        // Keep backward-compatible storage too (in case some page reads old key)
        sessionStorage.setItem(
          `prelims_evaluation:${derivedTestId}`,
          JSON.stringify({
            success: true,
            test_id: derivedTestId,
            data: rowsToStore,
            raw: normalized,
          })
        )
        sessionStorage.setItem(
          "prelims_evaluation:last",
          JSON.stringify({
            success: true,
            test_id: derivedTestId,
            data: rowsToStore,
            raw: normalized,
           })
        )

        // ✅ Redirect to your evaluation route
        router.push(`/dashboard/prelims-test-evaluation?test_id=${encodeURIComponent(derivedTestId)}`)
        return

      }

      // Only show in-page results for MAINS
      if (isMainsExam) {
        setShowResults(true)
      }
    } catch (error) {
      console.error("[v0] Failed to submit test:", error)
      alert("Failed to submit test. Please try again.")
    } finally {
      setIsSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }

  const getQuestionStatus = (index: number) => {
    const answer = userAnswers[index]
    if (!answer) return "not-visited"
    
    let hasAnswer = false
    if (isMainsExam) {
      hasAnswer = !!(answer.written_answer?.trim() || (answer.uploaded_files && answer.uploaded_files.length > 0))
    } else {
      hasAnswer = !!answer.selected_option
    }
    
    if (answer.marked_for_review && hasAnswer) return "review-answered"
    if (answer.marked_for_review) return "review"
    if (hasAnswer) return "answered"
    return "not-answered"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-green-500 text-white"
      case "not-answered": return "bg-red-500 text-white"
      case "review": return "bg-purple-500 text-white"
      case "review-answered": return "bg-purple-500 text-white border-2 border-green-400"
      default: return "bg-gray-200 text-gray-700"
    }
  }

  const answeredCount = userAnswers.filter((a) => {
    if (isMainsExam) {
      return a.written_answer?.trim() || (a.uploaded_files && a.uploaded_files.length > 0)
    }
    return a.selected_option
  }).length
  
  const reviewCount = userAnswers.filter((a) => a.marked_for_review).length

  // Results page
  if (showResults && evaluationResult) {
    return <TestResultsPage result={evaluationResult} questions={questions} onBack={onBack} isMainsExam={isMainsExam} />
  }

  // Loading state
  if (!questions.length || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Test...</h2>
          <p className="text-muted-foreground mb-4">Please wait while your test is being prepared.</p>
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const currentAnswer = userAnswers[currentQuestionIndex]
  const displayTime = isMainsExam ? questionTimeRemaining : timeRemaining
  
  // Get display values
  // - MAINS UI uses MAINS-safe getters (handles casing + backend variants)
  // - PRELIMS UI continues to use the original helpers
  const questionText = isMainsExam ? getMainsQuestionText(currentQuestion) : getQuestionText(currentQuestion)
  const displayQuestionId = isMainsExam ? getMainsQuestionId(currentQuestion) : getQuestionId(currentQuestion)
  const displaySubject = isMainsExam ? getMainsSubject(currentQuestion) : getSubject(currentQuestion)
  const displayYear = isMainsExam ? getMainsYear(currentQuestion) : getYear(currentQuestion)
  const displayTheme = isMainsExam ? getMainsTheme(currentQuestion) : getTheme(currentQuestion)
  const displaySubTheme = isMainsExam ? getMainsSubTheme(currentQuestion) : getSubTheme(currentQuestion)
  const displayDifficulty = getDifficulty(currentQuestion)
  const displayKeyPoints = isMainsExam ? getMainsKeyPoints(currentQuestion) : ""
  const displayModelAnswer = isMainsExam ? getMainsModelAnswer(currentQuestion) : ""

  // ============================================
  // RENDER MAINS UI
  // ============================================
  if (isMainsExam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground">
                    UPSC Mains - {paperType}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {testData.test_metadata.question_source?.toUpperCase() || 'PYQ'} • {numberOfQuestions} Questions • {testData.test_metadata.total_marks} Marks
                  </p>
                </div>
              </div>

              {/* Timer Card */}
              <Card className={cn(
                "flex flex-col items-center px-5 py-2 rounded-xl border-2",
                displayTime <= 60 ? "bg-red-50 border-red-300 text-red-600" :
                displayTime <= 300 ? "bg-yellow-50 border-yellow-300 text-yellow-600" :
                "bg-primary/5 border-primary/30 text-primary"
              )}>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-2xl font-bold">{formatTime(displayTime)}</span>
                </div>
                <span className="text-xs font-medium opacity-80">Time for this question</span>
              </Card>

              <Button 
                onClick={handleSubmitClick}
                className="bg-primary hover:bg-primary/90 px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Test"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Main Question Area */}
            <div className="flex-1">
              <Card className="p-6 shadow-lg">
                {/* Question Header with Tags */}
                <div className="flex items-start justify-between mb-5 pb-4 border-b">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Question Number */}
                    <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-lg font-bold">
                      Q{getSerialNo(currentQuestion, currentQuestionIndex)}
                    </span>

                    {/* Question ID (backend identifier) */}
                    {displayQuestionId && (
                      <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-semibold">
                        {displayQuestionId}
                      </span>
                    )}
                    
                    {/* Subject Tag */}
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {displaySubject}
                    </span>
                    
                    {/* Year Tag */}
                    {displayYear && (
                      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        PYQ {displayYear}
                      </span>
                    )}
                    
                    {/* Theme Tag */}
                    {displayTheme && (
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {displayTheme}
                      </span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkForReview}
                    className={cn(
                      "gap-2",
                      currentAnswer?.marked_for_review && "bg-purple-100 border-purple-300 text-purple-700"
                    )}
                  >
                    <Flag className="h-4 w-4" />
                    {currentAnswer?.marked_for_review ? "Marked" : "Mark for Review"}
                  </Button>
                </div>

                {/* Question Info Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    displayDifficulty === "Easy" ? "bg-green-100 text-green-700" :
                    displayDifficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {displayDifficulty}
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {currentMarks} Marks
                  </span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                    {currentWordLimit} Words Limit
                  </span>
                  {displaySubTheme && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {displaySubTheme}
                    </span>
                  )}
                </div>

                {/* QUESTION TEXT DISPLAY - FIXED */}
                <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {questionText ? (
                    <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                      {questionText}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Question text could not be loaded</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Please check your webhook configuration and ensure the questionText field is being sent.
                      </p>
                    </div>
                  )}
                </div>

                {/* Answer Section */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">
                        Upload Your Answer
                      </Label>
                      <span className="text-sm text-muted-foreground">(Recommended)</span>
                    </div>
                    <FileUploadZone
                      files={currentAnswer?.uploaded_files || []}
                      onFilesChange={handleFilesChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted-foreground/20"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-4 text-sm text-muted-foreground">OR type your answer</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <PenLine className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">
                        Type Your Answer
                      </Label>
                      <span className="text-sm text-muted-foreground">(Optional)</span>
                    </div>
                    <Textarea
                      placeholder="Type your answer here..."
                      value={currentAnswer?.written_answer || ''}
                      onChange={(e) => handleWrittenAnswerChange(e.target.value)}
                      className="min-h-[180px] resize-y text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Word limit: {currentWordLimit} words • Current: {(currentAnswer?.written_answer || '').split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t">
                  <Button
                    variant="outline"
                    onClick={handleClearResponse}
                    disabled={!currentAnswer?.written_answer?.trim() && !(currentAnswer?.uploaded_files?.length)}
                  >
                    Clear Response
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      size="lg"
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === questions.length - 1}
                      size="lg"
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Question Navigator */}
            <div className="w-72 flex-shrink-0">
              <Card className="p-4 sticky top-24 shadow-lg">
                <h3 className="font-bold text-foreground mb-4 text-center">Question Navigator</h3>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{answeredCount}/{questions.length}</span>
                  </div>
                  <Progress value={(answeredCount / questions.length) * 100} className="h-2.5" />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <span>Review ({reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                    <span>Not Visited</span>
                  </div>
                </div>

                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg font-semibold text-sm transition-all",
                        getStatusColor(getQuestionStatus(index)),
                        currentQuestionIndex === index && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Test Info - Using number_of_questions */}
                <div className="mt-4 pt-4 border-t space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    Total Marks: <span className="font-semibold text-foreground">{testData.test_metadata.total_marks}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Questions: <span className="font-semibold text-foreground">{numberOfQuestions}</span>
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 m-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Submit Test?</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-semibold">{numberOfQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answered:</span>
                  <span className="font-semibold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unanswered:</span>
                  <span className="font-semibold text-red-600">{numberOfQuestions - answeredCount}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Your uploaded answers will be sent for AI evaluation.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowConfirmSubmit(false)}>
                  Continue Test
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={submitTest} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER PRELIMS UI (MCQ) - UNCHANGED
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">
                  UPSC Prelims - {paperType}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {testData.test_metadata.question_source?.toUpperCase() || 'PYQ'} Test
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
              displayTime <= 60 ? "bg-red-100 text-red-600 animate-pulse" :
              displayTime <= 300 ? "bg-yellow-100 text-yellow-600" :
              "bg-primary/10 text-primary"
            )}>
              <Clock className="h-5 w-5" />
              {formatTime(displayTime)}
            </div>

            <Button onClick={handleSubmitClick} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    Q{getSerialNo(currentQuestion, currentQuestionIndex)}
                  </span>
                  <span className="text-sm text-muted-foreground">{displaySubject}</span>
                  {displayYear && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">PYQ {displayYear}</span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    displayDifficulty === "Easy" ? "bg-green-100 text-green-700" :
                    displayDifficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {displayDifficulty}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleMarkForReview}
                  className={cn(currentAnswer?.marked_for_review && "bg-purple-100 border-purple-300 text-purple-700")}>
                  <Flag className="h-4 w-4 mr-1" />
                  {currentAnswer?.marked_for_review ? "Marked" : "Mark for Review"}
                </Button>
              </div>

              <div className="mb-8">
                <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">{questionText}</p>
              </div>

              {currentQuestion.options && (
                <RadioGroup value={currentAnswer?.selected_option || ""} onValueChange={handleOptionSelect} className="space-y-3">
                  {(["A", "B", "C", "D"] as const).map((option) => (
                    <Label key={option} htmlFor={`option-${option}`}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        currentAnswer?.selected_option === option ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}>
                      <RadioGroupItem value={option} id={`option-${option}`} className="mt-1" />
                      <div className="flex-1">
                        <span className="font-semibold text-primary mr-2">({option})</span>
                        <span className="text-foreground">{currentQuestion.options![option]}</span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={handleClearResponse} disabled={!currentAnswer?.selected_option}>
                  Clear Response
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="w-72">
            <Card className="p-4 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Question Navigator</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{answeredCount}/{questions.length}</span>
                </div>
                <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div><span>Answered ({answeredCount})</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div><span>Not Answered</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500"></div><span>Review ({reviewCount})</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-200"></div><span>Not Visited</span></div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button key={index} onClick={() => navigateToQuestion(index)}
                    className={cn("w-10 h-10 rounded-lg font-medium text-sm transition-all", getStatusColor(getQuestionStatus(index)),
                      currentQuestionIndex === index && "ring-2 ring-primary ring-offset-2")}>
                    {index + 1}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Submit Test?</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Questions:</span><span className="font-semibold">{questions.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Answered:</span><span className="font-semibold text-green-600">{answeredCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unanswered:</span><span className="font-semibold text-red-600">{questions.length - answeredCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Marked for Review:</span><span className="font-semibold text-purple-600">{reviewCount}</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowConfirmSubmit(false)}>Continue Test</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={submitTest} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================
// TEST RESULTS COMPONENT
// ============================================
function TestResultsPage({ result, questions, onBack, isMainsExam = false }: {
  result: EvaluationResult; questions: Question[]; onBack: () => void; isMainsExam?: boolean
}) {
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<number>(0)
  const { summary, detailed_results } = result

  const getScoreColor = (percentage: number) => percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600"
  const getGrade = (percentage: number) => percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : percentage >= 40 ? "Average" : "Needs Improvement"

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test Results</h1>
              <p className="text-muted-foreground">Test ID: {result.test_id}</p>
            </div>
            <Button variant="outline" onClick={onBack}>Back to Test Builder</Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="md:col-span-2 p-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Your Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-5xl font-bold", getScoreColor(summary.percentage))}>{summary.score.toFixed(2)}</span>
                  <span className="text-2xl text-muted-foreground">/ {summary.max_score}</span>
                </div>
                <p className={cn("text-lg font-medium mt-2", getScoreColor(summary.percentage))}>{summary.percentage.toFixed(1)}% - {getGrade(summary.percentage)}</p>
              </div>
              <Trophy className={cn("h-16 w-16", getScoreColor(summary.percentage))} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div><p className="text-2xl font-bold text-green-600">{summary.correct}</p><p className="text-sm text-muted-foreground">Correct</p></div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-10 w-10 text-red-500" />
              <div><p className="text-2xl font-bold text-red-600">{summary.incorrect}</p><p className="text-sm text-muted-foreground">Incorrect</p></div>
            </div>
          </Card>
        </div>

        <Card className="p-4 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">{isMainsExam ? "UPSC Mains Evaluation" : "UPSC Prelims Marking Scheme Applied"}</p>
              <p className="text-sm text-blue-700">
                {isMainsExam ? "AI-evaluated based on content, structure, and UPSC answer writing standards." : "+2 marks for each correct answer, -0.66 marks (1/3rd negative marking) for each wrong answer."}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center mb-6">
          <Button variant="outline" size="lg" onClick={() => setShowDetailedView(!showDetailedView)}>
            {showDetailedView ? "Hide" : "View"} Detailed Solutions
          </Button>
        </div>

        {showDetailedView && detailed_results && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Question-wise Review</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {detailed_results.map((r, index) => (
                <button key={index} onClick={() => setSelectedQuestion(index)}
                  className={cn("w-10 h-10 rounded-lg font-medium text-sm transition-all",
                    r.is_correct ? "bg-green-500 text-white" : r.user_answer === null ? "bg-gray-300 text-gray-700" : "bg-red-500 text-white",
                    selectedQuestion === index && "ring-2 ring-primary ring-offset-2")}>
                  {index + 1}
                </button>
              ))}
            </div>
            {detailed_results[selectedQuestion] && (
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">Q{selectedQuestion + 1}</span>
                  {detailed_results[selectedQuestion].is_correct ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Correct</span>
                  ) : detailed_results[selectedQuestion].user_answer === null ? (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"><MinusCircle className="h-4 w-4" /> Unattempted</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1"><XCircle className="h-4 w-4" /> Incorrect</span>
                  )}
                </div>
                <p className="text-foreground mb-6 whitespace-pre-wrap">{questions[selectedQuestion] && getQuestionText(questions[selectedQuestion])}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><BookOpen className="h-5 w-5" />{isMainsExam ? "AI Feedback" : "Explanation"}</h4>
                  <p className="text-blue-800 whitespace-pre-wrap">{detailed_results[selectedQuestion].explanation || "Explanation not available."}</p>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setSelectedQuestion(Math.max(0, selectedQuestion - 1))} disabled={selectedQuestion === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  <Button onClick={() => setSelectedQuestion(Math.min(detailed_results.length - 1, selectedQuestion + 1))} disabled={selectedQuestion === detailed_results.length - 1}>
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

export default TestTakingPage
