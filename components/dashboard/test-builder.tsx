"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Minus, Plus, Clock, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { TestTakingPage } from "./TestTakingPage"
import { generateMockQuestions } from "@/utils/mockQuestionsGenerator"

// ============================================
// TYPES
// ============================================
interface Question {
  question_id: string
  serial_no: number
  source: "pyq" | "mock"
  year?: number
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  metadata: {
    subject: string
    theme: string
    sub_theme?: string
    difficulty: string
  }
  correct_answer?: string
  explanation?: string
}

interface TestData {
  test_id: string
  status: string
  created_at: string
  test_metadata: {
    exam_type: string
    paper_type: string
    language: string
    total_questions: number
    question_source: string
    time_limit_minutes: number
    total_marks: number
  }
  questions: Question[]
  answer_key?: Record<string, {
    correct_answer: string
    explanation: string
  }>
}

interface UserAnswer {
  question_id: string
  serial_no: number
  selected_option: string | null
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
// WEBHOOK URLs - UPDATE THESE
// ============================================
const WEBHOOK_URLS = {
  generateTest: "https://n8n.srv873027.hstgr.cloud/webhook/testbuilder",
  submitTest: "https://n8n.srv873027.hstgr.cloud/webhook/test-submit",
}

// ============================================
// MAIN COMPONENT
// ============================================
export function TestBuilder() {
  // Test Builder State
  const [examType, setExamType] = useState<"prelims" | "mains">("prelims")
  const [language, setLanguage] = useState<"english" | "hindi">("english")
  const [paperType, setPaperType] = useState("gs1")
  const [questionCount, setQuestionCount] = useState(5)
  const [questionSource, setQuestionSource] = useState<"mock" | "pyq" | "mixed">("mock")
  const [currentAffairs, setCurrentAffairs] = useState(false)
  const [preferences, setPreferences] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>(["Easy", "Medium", "Hard"])
  const [selectedMarks, setSelectedMarks] = useState<number[]>([])

  // Test Taking State
  const [currentView, setCurrentView] = useState<"builder" | "test">("builder")
  const [testData, setTestData] = useState<TestData | null>(null)

  const maxQuestions = 20

  const prelimsSubjects = [
    "Ancient History",
    "Medieval History", 
    "History of India",
    "Indian National Movement",
    "Art & Culture",
    "Geography",
    "Economy",
    "International Relations",
    "Environment",
    "Science & Technology",
    "Polity & Governance",
    "Current Affairs",
  ]

  const mainsSubjectsByPaper: Record<string, string[]> = {
    gs1: ["History", "Art & Culture", "Geography", "Indian Society"],
    gs2: ["Polity", "Governance", "International Relations"],
    gs3: ["Economy", "Agriculture", "Environment", "Science & Technology", "Internal Security"],
    gs4: ["Ethics Questions", "Ethics Case Study"],
    "gs4-case": [], // Essay doesn't have subject filters
    optional: [], // Optional subjects handled separately
  }

  const subjects = examType === "prelims" ? prelimsSubjects : (mainsSubjectsByPaper[paperType] || [])

  const mainsMarksByPaper: Record<string, number[]> = {
    gs1: [10, 15],
    gs2: [10, 15],
    gs3: [10, 15],
    gs4: [10, 20],
    "gs4-case": [125], // Essay has only 125 marks
    optional: [10, 15, 20],
  }

  const marksOptions = examType === "mains" ? (mainsMarksByPaper[paperType] || []) : []

  const toggleMarks = (mark: number) => {
    setSelectedMarks((prev) =>
      prev.includes(mark) ? prev.filter((m) => m !== mark) : [...prev, mark]
    )
  }

  const years = Array.from({ length: 13 }, (_, i) => 2013 + i)

  const difficultyLevels = ["Easy", "Medium", "Hard"]

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    )
  }

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    )
  }

  const toggleDifficulty = (level: string) => {
    setSelectedDifficulty((prev) =>
      prev.includes(level) ? prev.filter((d) => d !== level) : [...prev, level]
    )
  }

  const prelimsPaperTypes = [
    {
      id: "gs1",
      label: "General Studies (Paper I)",
      description: "History, Geography, Polity, Economics, etc.",
    },
  ]

  const mainsPaperTypes = [
    { id: "gs1", label: "GS1", description: "Heritage, Culture, History, Geography" },
    { id: "gs2", label: "GS2", description: "Governance, Polity, Social Justice, IR" },
    { id: "gs3", label: "GS3", description: "Technology, Economy, Environment, Security" },
    { id: "gs4", label: "GS4", description: "Ethics, Integrity, Aptitude" },
    { id: "gs4-case", label: "Essay", description: "Essay Writing, Analytical Essays" },
    { id: "optional", label: "Optional", description: "Choose from various optional subjects" },
  ]

  const paperTypes = examType === "prelims" ? prelimsPaperTypes : mainsPaperTypes

  const handleExamTypeChange = (type: "prelims" | "mains") => {
    setExamType(type)
    setSelectedSubjects([])
    setPaperType("gs1") // Reset paper type when changing exam type
  }

  const handlePaperTypeChange = (paperId: string) => {
    setPaperType(paperId)
    setSelectedSubjects([]) // Reset subjects when paper type changes
    setSelectedMarks([]) // Reset marks when paper type changes
  }

  const getPaperTypeValue = () => {
    const paperTypeMap: Record<string, string> = {
      gs1: "GS1",
      gs2: "GS2", 
      gs3: "GS3",
      gs4: "GS4",
      "gs4-case": "Essay",
      optional: "Optional",
    }
    return paperTypeMap[paperType] || "GS1"
  }

  // ============================================
  // GENERATE TEST - Call N8N Webhook
  // ============================================
  const handleGenerateTest = async () => {
    setIsGenerating(true)
    setError(null)

    const payload = {
      request_id: crypto.randomUUID(),
      user_id: "user_123", // Replace with actual user ID from auth
      timestamp: new Date().toISOString(),
      exam_type: examType,
      paper_type: getPaperTypeValue(),
      language: language === "english" ? "en" : "hi",
      number_of_questions: questionCount,
      question_source: questionSource,
      current_affairs_integration: currentAffairs,
      special_topic_preference: preferences || null,
      years: selectedYears.length > 0 ? selectedYears : years,
      subjects: selectedSubjects,
      difficulty: selectedDifficulty,
      marks: selectedMarks.length > 0 ? selectedMarks : marksOptions,
      userid: "user_123",
      sessionid: crypto.randomUUID(),
    }

    try {
      const response = await fetch("https://n8n.srv873027.hstgr.cloud/webhook/testbuilder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response has content
      const contentType = response.headers.get("content-type")
      const responseText = await response.text()
      
      let data
      if (responseText && contentType?.includes("application/json")) {
        try {
          data = JSON.parse(responseText)
        } catch {
          console.log("[v0] Response is not valid JSON, using mock data")
          data = null
        }
      } else {
        console.log("[v0] Empty or non-JSON response, using mock data")
        data = null
      }
      
      // If no valid data from webhook, generate mock questions for testing
      if (!data || !data.questions || data.questions.length === 0) {
        data = {
          test_id: `TEST_${Date.now()}`,
          questions: generateMockQuestions(questionCount, selectedSubjects, selectedDifficulty)
        }
      }
      
      // Handle array response (testbuilder returns array with single object)
      const responseData = Array.isArray(data) ? data[0] : data
      
      // Transform the response to match our TestData interface
      const transformedData: TestData = {
        test_id: responseData.test_id || `TEST_${Date.now()}`,
        status: responseData.status || "success",
        created_at: responseData.created_at || new Date().toISOString(),
        test_metadata: responseData.test_metadata || {
          exam_type: examType,
          paper_type: getPaperTypeValue(),
          language: language,
          total_questions: responseData.questions?.length || questionCount,
          question_source: questionSource,
          time_limit_minutes: calculateTimeLimit(questionCount, examType),
          total_marks: calculateTotalMarks(responseData.questions, examType),
        },
        questions: transformQuestions(responseData.questions || responseData, examType),
        answer_key: extractAnswerKey(responseData.questions || responseData),
      }

      setTestData(transformedData)
      setCurrentView("test")
      
    } catch (err) {
      console.error("Error generating test:", err)
      setError("Failed to generate test. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================
  // SUBMIT TEST - Call N8N Evaluation Webhook
  // ============================================
  const handleSubmitTest = async (answers: UserAnswer[]): Promise<EvaluationResult> => {
    if (!testData) throw new Error("No test data available")

    const payload = {
      test_id: testData.test_id,
      user_id: "user_123",
      submission_time: new Date().toISOString(),
      time_taken_seconds: answers.reduce((sum, a) => sum + a.time_spent_seconds, 0),
      answers: answers,
      // Include answer key for evaluation
      answer_key: testData.answer_key,
      questions: testData.questions,
    }

    try {
      // Option 1: Call backend webhook for evaluation
      const response = await fetch(WEBHOOK_URLS.submitTest, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.log("Backend evaluation failed, using local evaluation")
    }

    // Option 2: Local evaluation (fallback or primary)
    return evaluateTestLocally(testData, answers)
  }

  // ============================================
  // LOCAL EVALUATION (When backend is unavailable)
  // ============================================
  const evaluateTestLocally = (test: TestData, answers: UserAnswer[]): EvaluationResult => {
    const MARKS_PER_CORRECT = 2
    const NEGATIVE_MARKING = 0.66 // 1/3rd of 2 marks

    let correct = 0
    let incorrect = 0
    let unattempted = 0
    let totalScore = 0
    let negativeMarks = 0

    const detailed_results = test.questions.map((question, index) => {
      const userAnswer = answers[index]?.selected_option
      const correctAnswer = test.answer_key?.[question.question_id]?.correct_answer || 
                           question.correct_answer || ""
      const explanation = test.answer_key?.[question.question_id]?.explanation ||
                         question.explanation || ""

      let isCorrect = false
      let marksObtained = 0

      if (!userAnswer) {
        unattempted++
        marksObtained = 0
      } else if (userAnswer === correctAnswer) {
        correct++
        isCorrect = true
        marksObtained = MARKS_PER_CORRECT
        totalScore += MARKS_PER_CORRECT
      } else {
        incorrect++
        marksObtained = -NEGATIVE_MARKING
        totalScore -= NEGATIVE_MARKING
        negativeMarks += NEGATIVE_MARKING
      }

      return {
        question_id: question.question_id,
        serial_no: question.serial_no,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        explanation: explanation,
      }
    })

    // Calculate subject-wise analytics
    const subject_wise: Record<string, { correct: number; total: number; percentage: number }> = {}
    test.questions.forEach((q, index) => {
      const subject = q.metadata.subject
      if (!subject_wise[subject]) {
        subject_wise[subject] = { correct: 0, total: 0, percentage: 0 }
      }
      subject_wise[subject].total++
      if (detailed_results[index].is_correct) {
        subject_wise[subject].correct++
      }
    })
    Object.keys(subject_wise).forEach(subject => {
      subject_wise[subject].percentage = 
        (subject_wise[subject].correct / subject_wise[subject].total) * 100
    })

    const maxScore = test.questions.length * MARKS_PER_CORRECT

    return {
      test_id: test.test_id,
      evaluation_id: `EVAL_${Date.now()}`,
      summary: {
        total_questions: test.questions.length,
        attempted: correct + incorrect,
        correct,
        incorrect,
        unattempted,
        score: Math.max(0, totalScore), // Don't go below 0
        max_score: maxScore,
        percentage: (Math.max(0, totalScore) / maxScore) * 100,
        negative_marks: negativeMarks,
      },
      detailed_results,
      analytics: {
        subject_wise,
        difficulty_wise: {},
        time_analysis: {
          total_time: formatDuration(answers.reduce((sum, a) => sum + a.time_spent_seconds, 0)),
          avg_time_per_question: formatDuration(
            Math.round(answers.reduce((sum, a) => sum + a.time_spent_seconds, 0) / test.questions.length)
          ),
        },
      },
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const calculateTimeLimit = (numQuestions: number, examType: string): number => {
    // UPSC Prelims: ~2 min per question, Mains: ~15 min per question
    if (examType === "prelims") {
      return Math.max(numQuestions * 2, 10) // Minimum 10 minutes
    }
    return Math.max(numQuestions * 15, 30) // Minimum 30 minutes for Mains
  }

  const calculateTotalMarks = (questions: any[], examType: string): number => {
    if (examType === "mains" && questions) {
      return questions.reduce((sum, q) => sum + (q.marks || 10), 0)
    }
    return (questions?.length || 0) * 2 // Prelims: 2 marks per question
  }

  const transformQuestions = (rawQuestions: any[], examType: string): Question[] => {
    if (!Array.isArray(rawQuestions)) {
      // Handle case where response is wrapped
      if (rawQuestions?.questions) return transformQuestions(rawQuestions.questions, examType)
      return []
    }

    return rawQuestions.map((q, index) => {
      // For mains tests: Use questionText (NOT question_text to avoid duplication)
      // For prelims tests: Use question_text or Question_Text
      const questionText = examType === "mains" 
        ? (q.questionText || q.question_text || "")
        : (q.question_text || q.Question_Text || "")

      return {
        question_id: q.questionId || q.question_id || q.Question_ID || `Q_${index + 1}`,
        serial_no: q.serial_no || index + 1,
        source: q.source || "mock",
        year: q.year || q.Year || 2025,
        question_text: questionText,
        options: q.options || {
          A: q.Option_A || q.options?.A || "",
          B: q.Option_B || q.options?.B || "",
          C: q.Option_C || q.options?.C || "",
          D: q.Option_D || q.options?.D || "",
        },
        metadata: {
          subject: q.subject || q.Subject || q.metadata?.subject || "General",
          theme: q.theme || q.Theme || q.metadata?.theme || "",
          sub_theme: q.subTheme || q.sub_theme || q.Sub_Theme || q.metadata?.sub_theme || "",
          difficulty: q.difficulty || q.Difficulty || q.metadata?.difficulty || "Medium",
          // Mains-specific fields
          marks: q.marks,
          wordLimit: q.wordLimit || q.word_limit,
          keyPoints: q.keyPoints || q.key_points || "",
          modelAnswer: q.modelAnswer || q.model_answer || "",
        },
        correct_answer: q.correct_answer || q.Correct_Answer || q["Correct Answer"] || "",
        explanation: q.explanation || q.Explanation || "",
      }
    })
  }

  const extractAnswerKey = (rawQuestions: any[]): Record<string, { correct_answer: string; explanation: string }> => {
    const answerKey: Record<string, { correct_answer: string; explanation: string }> = {}
    
    const questions = Array.isArray(rawQuestions) ? rawQuestions : rawQuestions?.questions || []
    
    questions.forEach((q: any, index: number) => {
      const id = q.question_id || q.Question_ID || `Q_${index + 1}`
      answerKey[id] = {
        correct_answer: q.correct_answer || q.Correct_Answer || q["Correct Answer"] || "",
        explanation: q.explanation || q.Explanation || "",
      }
    })
    
    return answerKey
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleBackToBuilder = () => {
    setCurrentView("builder")
    setTestData(null)
  }

  // ============================================
  // RENDER TEST TAKING PAGE
  // ============================================
  if (currentView === "test" && testData) {
    return (
      <TestTakingPage
        testData={testData}
        onSubmit={handleSubmitTest}
        onBack={handleBackToBuilder}
      />
    )
  }

  // ============================================
  // RENDER TEST BUILDER PAGE (Original Code)
  // ============================================
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <h1 className="text-3xl font-bold text-foreground">Create Your Mock Test</h1>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-lg mb-1">
                <span className="text-xs font-bold text-accent-foreground bg-green-500 px-2 py-0.5 rounded">
                  ₹83/mo
                </span>
                <span className="text-sm font-semibold text-accent-foreground">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground">Generate 300+ tests monthly</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Exam Type</label>
              <div className="flex gap-3">
                <Button
                  variant={examType === "prelims" ? "default" : "outline"}
                  onClick={() => handleExamTypeChange("prelims")}
                  className={cn(examType === "prelims" && "bg-primary hover:bg-primary/90")}
                >
                  Prelims
                </Button>
                <Button
                  variant={examType === "mains" ? "default" : "outline"}
                  onClick={() => handleExamTypeChange("mains")}
                  className={cn(examType === "mains" && "bg-primary hover:bg-primary/90")}
                >
                  Mains
                </Button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Language</label>
              <div className="flex gap-3">
                <Button
                  variant={language === "english" ? "default" : "outline"}
                  onClick={() => setLanguage("english")}
                  className={cn(language === "english" && "bg-primary hover:bg-primary/90")}
                >
                  English
                </Button>
                <Button
                  variant={language === "hindi" ? "default" : "outline"}
                  onClick={() => setLanguage("hindi")}
                  className={cn(language === "hindi" && "bg-primary hover:bg-primary/90")}
                >
                  हिंदी
                </Button>
              </div>
            </div>

            {/* Paper Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Paper Type</label>
              <div className={cn("gap-2", examType === "mains" ? "grid grid-cols-2" : "space-y-2")}>
                {paperTypes.map((paper) => (
                  <Card
                    key={paper.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors border",
                      paperType === paper.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted/50 border-border/50"
                    )}
                    onClick={() => handlePaperTypeChange(paper.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{paper.label}</p>
                        <p className={cn(
                          "text-sm",
                          paperType === paper.id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {paper.description}
                        </p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        paperType === paper.id ? "border-primary-foreground" : "border-muted-foreground/30"
                      )}>
                        {paperType === paper.id && <div className="w-3 h-3 rounded-full bg-primary-foreground" />}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Number of Questions</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                  disabled={questionCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-semibold text-foreground w-12 text-center">{questionCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuestionCount(Math.min(maxQuestions, questionCount + 1))}
                  disabled={questionCount >= maxQuestions}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {examType === "mains" && (
                  <Button variant="ghost" size="sm" className="ml-2 text-primary hover:text-primary/90">
                    <Clock className="h-4 w-4 mr-1" />
                    Check Last Test
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Max {maxQuestions} questions</p>
            </div>

{/* Subjects Filter */}
  {subjects.length > 0 && (
  <div>
  <label className="block text-sm font-medium text-foreground mb-3">
  Subjects {examType === "mains" && `(${paperType.toUpperCase()})`} <span className="text-muted-foreground font-normal">(Select to filter)</span>
  </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Button
                      key={subject}
                      variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSubject(subject)}
                      className={cn("text-xs", selectedSubjects.includes(subject) && "bg-primary hover:bg-primary/90")}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Years Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Years <span className="text-muted-foreground font-normal">(Select to filter PYQs)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {years.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYears.includes(year) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleYear(year)}
                    className={cn("text-xs min-w-[60px]", selectedYears.includes(year) && "bg-primary hover:bg-primary/90")}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

{/* Difficulty Level */}
  <div>
  <label className="block text-sm font-medium text-foreground mb-3">Difficulty Level</label>
  <div className="flex gap-3">
  {difficultyLevels.map((level) => (
  <Button
  key={level}
  variant={selectedDifficulty.includes(level) ? "default" : "outline"}
  onClick={() => toggleDifficulty(level)}
  className={cn(selectedDifficulty.includes(level) && "bg-primary hover:bg-primary/90")}
  >
  {level}
  </Button>
  ))}
  </div>
  </div>

  {/* Marks Filter (Mains only) */}
  {examType === "mains" && marksOptions.length > 0 && (
  <div>
  <label className="block text-sm font-medium text-foreground mb-3">
  Marks <span className="text-muted-foreground font-normal">(Select to filter by question marks)</span>
  </label>
  <div className="flex gap-3">
  {marksOptions.map((mark) => (
  <Button
  key={mark}
  variant={selectedMarks.includes(mark) ? "default" : "outline"}
  onClick={() => toggleMarks(mark)}
  className={cn(selectedMarks.includes(mark) && "bg-primary hover:bg-primary/90")}
  >
  {mark} Marks
  </Button>
  ))}
  </div>
  {selectedMarks.length > 0 && (
  <p className="text-xs text-muted-foreground mt-2">
  {selectedMarks.map((m) => `${m} marks`).join(", ")} selected
  </p>
  )}
  </div>
  )}
  
  {/* Question Source */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Question Source</label>
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant={questionSource === "mock" ? "default" : "outline"}
                  onClick={() => setQuestionSource("mock")}
                  className={cn(questionSource === "mock" && "bg-primary hover:bg-primary/90")}
                >
                  Mock Questions
                </Button>
                <Button
                  variant={questionSource === "pyq" ? "default" : "outline"}
                  onClick={() => setQuestionSource("pyq")}
                  className={cn(questionSource === "pyq" && "bg-primary hover:bg-primary/90")}
                >
                  Previous Year Questions
                </Button>
                <Button
                  variant={questionSource === "mixed" ? "default" : "outline"}
                  onClick={() => setQuestionSource("mixed")}
                  className={cn(questionSource === "mixed" && "bg-primary hover:bg-primary/90")}
                >
                  Mixed (Mocks & PYQs)
                </Button>
              </div>
            </div>

            {/* Current Affairs */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Current Affairs Integration</label>
              <div className="flex gap-3">
                <Button
                  variant={currentAffairs ? "default" : "outline"}
                  onClick={() => setCurrentAffairs(true)}
                  className={cn(currentAffairs && "bg-primary hover:bg-primary/90")}
                >
                  On
                </Button>
                <Button
                  variant={!currentAffairs ? "default" : "outline"}
                  onClick={() => setCurrentAffairs(false)}
                  className={cn(!currentAffairs && "bg-primary hover:bg-primary/90")}
                >
                  Off
                </Button>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Specific Preferences <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g., 'focus on economic policies post-2020', 'South Indian Kingdoms', 'questions requiring critical analysis'"
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
              onClick={handleGenerateTest}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Test...
                </>
              ) : (
                "Generate Test"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-80 border-l border-border/40 bg-muted/20 p-6 overflow-y-auto relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Test Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Exam Type:</span>
                <span className="text-sm font-semibold">{examType === "prelims" ? "Prelims" : "Mains"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Paper Type:</span>
                <span className="text-sm font-semibold">{paperType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Questions:</span>
                <span className="text-sm font-semibold">{questionCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Source:</span>
                <span className="text-sm font-semibold capitalize">{questionSource}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Time Limit:</span>
                <span className="text-sm font-semibold">
                  {calculateTimeLimit(questionCount, examType)} mins
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Max Marks:</span>
                <span className="text-sm font-semibold">{questionCount * 2}</span>
              </div>
            </div>

            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-center text-muted-foreground">
                Click "Generate Test" to start your personalized mock test
              </p>
            </Card>
          </div>
        </aside>
      )}
    </div>
  )
}

export default TestBuilder
