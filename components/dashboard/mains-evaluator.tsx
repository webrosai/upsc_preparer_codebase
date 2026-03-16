"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, Upload, RotateCcw, X, CheckCircle, AlertCircle, Loader2, 
  Award, Target, BookOpen, Lightbulb, TrendingUp, Star, ChevronDown, 
  ChevronUp, Zap, PenTool, BarChart3, BookMarked, Type,
  CheckCircle2, XCircle, Info, AlertTriangle, ThumbsUp, ThumbsDown,
  MessageSquare, ClipboardList, Sparkles, Brain, ListChecks, FileCheck,
  GraduationCap, Scale, Edit3, Quote
} from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

// ==================== TYPE DEFINITIONS ====================

// Relevance Check
interface RelevanceCheck {
  is_relevant: boolean
  justification: string
}

// Introduction/Body/Conclusion Assessment
interface AssessmentSection {
  marks_awarded: number
  marks_possible: number
  comments: string
}

// Body Assessment with additional fields
interface BodyAssessment extends AssessmentSection {
  similarities_covered?: string[]
  differences_covered?: string[]
  missing_key_points?: string[]
}

// Detailed Evaluation
interface DetailedEvaluation {
  introduction_assessment: AssessmentSection
  body_assessment: BodyAssessment
  conclusion_assessment: AssessmentSection
}

// Rubric Mark Item
interface RubricMarkItem {
  marks_awarded: number
  marks_possible: number
  comments: string
}

// Rubric Wise Marks
interface RubricWiseMarks {
  content_accuracy?: RubricMarkItem
  structure_and_flow?: RubricMarkItem
  language_and_presentation?: RubricMarkItem
  examples_usage?: RubricMarkItem
  analysis_and_originality?: RubricMarkItem
}

// Keywords Analysis
interface KeywordsAnalysis {
  keywords_used_correctly: string[]
  mandatory_keywords_missing: string[]
  keywords_misused: string[]
}

// Model Answer Structure Check
interface ModelAnswerStructureCheck {
  has_introduction: boolean
  has_body: boolean
  has_conclusion: boolean
}

// Model Answer Rubric Alignment
interface ModelAnswerRubricAlignment {
  content_accuracy: boolean
  analysis_present: boolean
  examples_used: boolean
}

// Model Answer Object
interface ModelAnswerObject {
  model_answer: string
  word_count: number
  structure_check: ModelAnswerStructureCheck
  rubric_alignment: ModelAnswerRubricAlignment
}

// Complete n8n Evaluation Output
interface N8nEvaluationOutput {
  relevance_check: RelevanceCheck
  detailed_evaluation: DetailedEvaluation
  rubric_wise_marks: RubricWiseMarks
  final_marks: number
  total_marks: number
  keywords_analysis: KeywordsAnalysis
  strengths: string[]
  weaknesses: string[]
  improvement_suggestions: string[]
  evaluator_comments: string
  model_answer: ModelAnswerObject
  combinedAnswerWordCount: number
}

// Frontend State for Evaluation Result
interface EvaluationResponse {
  success: boolean
  timestamp: string
  // Core scores
  score: {
    obtained: number | null
    total: number | null
    percentage: number | null
  }
  // Relevance
  relevanceCheck: RelevanceCheck | null
  // Detailed section-wise evaluation
  detailedEvaluation: DetailedEvaluation | null
  // Rubric breakdown
  rubricWiseMarks: RubricWiseMarks | null
  // Keywords
  keywordsAnalysis: KeywordsAnalysis | null
  // Strengths and Weaknesses
  strengths: string[]
  weaknesses: string[]
  // Improvement suggestions
  improvementSuggestions: string[]
  // Evaluator comments
  evaluatorComments: string | null
  // Model Answer
  modelAnswer: ModelAnswerObject | null
  // Word count from student's answer
  answerWordCount: number | null
  // Fallback for raw response
  rawMarkdown: string | null
  // Error handling
  error?: {
    code: number
    message: string
    details: any
  }
}

// Webhook URL
const WEBHOOK_URL = "https://n8n.srv873027.hstgr.cloud/webhook/mainsevaluator"

export function MainsEvaluator() {
  const [language, setLanguage] = useState<"english" | "hindi">("english")
  const [selectedMarks, setSelectedMarks] = useState<number | null>(null)
  const [evaluatorMode, setEvaluatorMode] = useState<"easy" | "medium" | "hard">("hard")
  const [question, setQuestion] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'keywords' | 'feedback' | 'model'>('overview')

  // ==================== HELPER FUNCTIONS ====================

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).slice(0, 25)
      setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 25))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files) {
      const newFiles = Array.from(files).slice(0, 25)
      setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 25))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setLanguage("english")
    setSelectedMarks(null)
    setEvaluatorMode("hard")
    setQuestion("")
    setUploadedFiles([])
    setSelectedPaper("")
    setEvaluationResult(null)
    setShowResults(false)
    setActiveTab('overview')
  }

  const getFileCategory = (file: File): string => {
    if (file.type === 'application/pdf') return 'pdf'
    if (file.type.startsWith('image/')) return 'image'
    return 'unknown'
  }

  const getWordLimit = (marks: number | null): number => {
    if (!marks) return 150
    
    // Specific word limits based on marks
    const wordLimits: Record<number, number> = {
      10: 150,    // 10 marks = 150 words
      15: 250,    // 15 marks = 250 words
      20: 250,    // 20 marks = 250 words
      125: 1200   // Essay = 1200 words
    }
    
    return wordLimits[marks] || 150 // Default to 150 if marks not in map
  }

  // ==================== PARSE API RESPONSE ====================

  const parseApiResponse = (data: any): EvaluationResponse => {
    console.log("Parsing API response:", data)
    
    // Handle array response (n8n sometimes returns arrays)
    if (Array.isArray(data) && data.length > 0) {
      data = data[0]
    }

    // Navigate to the output object
    let output = data
    if (data && data.output) {
      output = data.output
    }

    // Check if we have the expected structure
    if (output && output.relevance_check !== undefined) {
      // Handle final_marks - it could be a number or an object
      let finalMarks: number | null = null
      if (output.final_marks !== null && output.final_marks !== undefined) {
        if (typeof output.final_marks === 'number') {
          finalMarks = output.final_marks
        } else if (typeof output.final_marks === 'object' && output.final_marks.total_awarded !== undefined) {
          // If it's an object with total_awarded, use that
          finalMarks = Number(output.final_marks.total_awarded) || null
        }
      }
      
      const totalMarks = output.total_marks ?? selectedMarks ?? null
      const percentage = finalMarks !== null && totalMarks !== null && totalMarks > 0
        ? Math.round((finalMarks / totalMarks) * 100)
        : null

      return {
        success: true,
        timestamp: new Date().toISOString(),
        score: {
          obtained: finalMarks,
          total: totalMarks,
          percentage: percentage
        },
        relevanceCheck: output.relevance_check || null,
        detailedEvaluation: output.detailed_evaluation || null,
        rubricWiseMarks: output.rubric_wise_marks || null,
        keywordsAnalysis: output.keywords_analysis || null,
        strengths: output.strengths || [],
        weaknesses: output.weaknesses || [],
        improvementSuggestions: output.improvement_suggestions || [],
        evaluatorComments: output.evaluator_comments || null,
        modelAnswer: output.model_answer || null,
        answerWordCount: output.combinedAnswerWordCount || null,
        rawMarkdown: null
      }
    }

    // Fallback for unexpected format
    return {
      success: false,
      timestamp: new Date().toISOString(),
      score: { obtained: null, total: null, percentage: null },
      relevanceCheck: null,
      detailedEvaluation: null,
      rubricWiseMarks: null,
      keywordsAnalysis: null,
      strengths: [],
      weaknesses: [],
      improvementSuggestions: [],
      evaluatorComments: null,
      modelAnswer: null,
      answerWordCount: null,
      rawMarkdown: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      error: {
        code: 500,
        message: "Could not parse evaluation response",
        details: data
      }
    }
  }

  // ==================== SUBMIT HANDLER ====================

  const handleEvaluate = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one answer sheet")
      return
    }

    if (!selectedMarks) {
      alert("Please select the question marks")
      return
    }

    if (!selectedPaper) {
      alert("Please select a paper type")
      return
    }

    setIsSubmitting(true)
    setEvaluationResult(null)

    try {
      const formData = new FormData()
      formData.append('language', language)
      formData.append('selectedPaper', selectedPaper)
      formData.append('selectedMarks', selectedMarks.toString())
      formData.append('evaluatorMode', evaluatorMode)
      formData.append('question', question)
      formData.append('timestamp', new Date().toISOString())
      formData.append('wordLimit', getWordLimit(selectedMarks).toString())
      formData.append('totalFiles', uploadedFiles.length.toString())
      
      let pdfCount = 0
      let imageCount = 0
      
      uploadedFiles.forEach((file, index) => {
        const category = getFileCategory(file)
        formData.append(`file_${index}`, file, file.name)
        formData.append(`file_${index}_name`, file.name)
        formData.append(`file_${index}_type`, file.type)
        formData.append(`file_${index}_size`, file.size.toString())
        formData.append(`file_${index}_category`, category)
        if (category === 'pdf') pdfCount++
        if (category === 'image') imageCount++
      })
      
      formData.append('pdfCount', pdfCount.toString())
      formData.append('imageCount', imageCount.toString())

      const controller = new AbortController()
      // Increase timeout to 10 minutes for large file processing
      const timeoutId = setTimeout(() => controller.abort(), 600000)
      
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Always clear timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const responseText = await response.text()
      console.log("Raw response:", responseText.substring(0, 1000))
      
      if (!responseText || responseText.trim() === '') {
        throw new Error("Empty response received from server")
      }

      let data: any
      try {
        data = JSON.parse(responseText)
        console.log("Parsed JSON:", data)
      } catch {
        if (response.ok) {
          data = { rawMarkdown: responseText }
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      if (!response.ok) {
        throw new Error(data?.error?.message || `Server error: ${response.status}`)
      }

      const parsedResult = parseApiResponse(data)
      setEvaluationResult(parsedResult)
      setShowResults(true)
      
    } catch (error: any) {
      console.error("[v0] Evaluation error:", error)
      
      let errorMessage = "An unexpected error occurred"
      
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. The evaluation took too long. Please try with fewer or smaller files."
      } else if (error.message === "Failed to fetch") {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setEvaluationResult({
        success: false,
        timestamp: new Date().toISOString(),
        score: { obtained: null, total: null, percentage: null },
        relevanceCheck: null,
        detailedEvaluation: null,
        rubricWiseMarks: null,
        keywordsAnalysis: null,
        strengths: [],
        weaknesses: [],
        improvementSuggestions: [],
        evaluatorComments: null,
        modelAnswer: null,
        answerWordCount: null,
        rawMarkdown: null,
        error: {
          code: 500,
          message: errorMessage,
          details: error.toString()
        }
      })
      setShowResults(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== UI HELPER COMPONENTS ====================

  // Highlight **keywords** in text
  const highlightKeywords = (text: string): React.ReactNode => {
    if (!text) return null
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const keyword = part.slice(2, -2)
        return (
          <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded font-semibold">
            {keyword}
          </span>
        )
      }
      return part
    })
  }

  // Score Circle Component
  const ScoreCircle = ({ 
    obtained, 
    total, 
    size = "lg" 
  }: { 
    obtained: number | null
    total: number | null
    size?: "sm" | "md" | "lg"
  }) => {
    if (obtained === null || total === null) return null
    
    const percentage = Math.round((obtained / total) * 100)
    const sizeClasses = {
      sm: "h-16 w-16 text-lg",
      md: "h-24 w-24 text-2xl",
      lg: "h-32 w-32 text-3xl"
    }
    
    return (
      <div className={cn(
        "rounded-full flex flex-col items-center justify-center text-white shadow-lg",
        sizeClasses[size],
        percentage >= 70 ? "bg-gradient-to-br from-green-400 to-green-600" :
        percentage >= 50 ? "bg-gradient-to-br from-amber-400 to-amber-600" : 
        "bg-gradient-to-br from-red-400 to-red-600"
      )}>
        <span className="font-bold">{percentage}%</span>
        <span className="text-xs opacity-80">{obtained}/{total}</span>
      </div>
    )
  }

  // Mini Score Badge
  const MiniScoreBadge = ({ 
    obtained, 
    total 
  }: { 
    obtained: number
    total: number
  }) => {
    const percentage = Math.round((obtained / total) * 100)
    return (
      <Badge className={cn(
        "font-mono ml-2",
        percentage >= 70 ? "bg-green-100 text-green-800" :
        percentage >= 50 ? "bg-amber-100 text-amber-800" :
        "bg-red-100 text-red-800"
      )}>
        {obtained}/{total}
      </Badge>
    )
  }

  // Word Count Badge
  const WordCountBadge = ({ 
    wordCount, 
    wordLimit 
  }: { 
    wordCount: number | null
    wordLimit: number 
  }) => {
    if (wordCount === null) return null
    
    const isOverLimit = wordCount > wordLimit
    const percentageOfLimit = Math.round((wordCount / wordLimit) * 100)
    const excessWords = wordCount - wordLimit
    const excessPercentage = Math.round((excessWords / wordLimit) * 100)
    
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        isOverLimit ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"
      )}>
        <Type className={cn("h-4 w-4", isOverLimit ? "text-amber-600" : "text-green-600")} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold",
              isOverLimit ? "text-amber-700" : "text-green-700"
            )}>
              {wordCount} words
            </span>
            <span className="text-muted-foreground text-sm">
              / {wordLimit} limit
            </span>
          </div>
          {isOverLimit && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Exceeded by {excessWords} words ({excessPercentage}% over limit)
            </span>
          )}
          {!isOverLimit && (
            <span className="text-xs text-green-600">
              {wordLimit - wordCount} words remaining ({100 - percentageOfLimit}% of limit)
            </span>
          )}
        </div>
      </div>
    )
  }

  // Collapsible Section Card
  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    children, 
    defaultOpen = true,
    colorClass = "",
    badge = null
  }: { 
    title: string
    icon: any
    children: React.ReactNode
    defaultOpen?: boolean
    colorClass?: string
    badge?: React.ReactNode
  }) => {
    const [isExpanded, setIsExpanded] = useState(defaultOpen)
    
    return (
      <Card className={cn("overflow-hidden", colorClass)}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{title}</h4>
            {badge}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t">
            {children}
          </div>
        )}
      </Card>
    )
  }

  // ==================== EVALUATION RESULTS COMPONENT ====================

  const EvaluationResults = () => {
    if (!evaluationResult) return null

    // Error state
    if (!evaluationResult.success) {
      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Evaluation Failed</h3>
          </div>
          <p className="text-red-700 whitespace-pre-line mb-4">{evaluationResult.error?.message}</p>
          {evaluationResult.rawMarkdown && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600">View raw response</summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-48">
                {evaluationResult.rawMarkdown}
              </pre>
            </details>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowResults(false)}>
              ← Back to Form
            </Button>
            <Button className="flex-1" onClick={handleEvaluate}>
              Retry Evaluation
            </Button>
          </div>
        </Card>
      )
    }

    const { 
      score, 
      relevanceCheck,
      detailedEvaluation,
      rubricWiseMarks,
      keywordsAnalysis,
      strengths,
      weaknesses,
      improvementSuggestions,
      evaluatorComments,
      modelAnswer,
      answerWordCount 
    } = evaluationResult

    const wordLimit = getWordLimit(selectedMarks)

    return (
      <div className="space-y-6">
        {/* ========== MAIN SCORE CARD ========== */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              {/* Relevance Status */}
              {relevanceCheck && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3",
                  relevanceCheck.is_relevant 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {relevanceCheck.is_relevant ? (
                    <><CheckCircle2 className="h-4 w-4" /> Answer is Relevant</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> Answer Not Relevant</>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Your Score</p>
                <Badge variant="outline" className="text-xs capitalize">
                  {evaluatorMode} Mode
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">
                  {score.obtained ?? '-'}
                </span>
                <span className="text-2xl text-muted-foreground">
                  / {score.total ?? selectedMarks ?? '-'}
                </span>
              </div>
              
              {/* Evaluator Comments */}
              {evaluatorComments && (
                <p className="text-sm text-muted-foreground mt-3 max-w-lg italic">
                  "{evaluatorComments}"
                </p>
              )}
              
              {/* Word Count */}
              <div className="mt-4">
                <WordCountBadge wordCount={answerWordCount} wordLimit={wordLimit} />
              </div>
            </div>
            
            {/* Score Circle */}
            {score && score.obtained !== null && score.total !== null && (
              <ScoreCircle obtained={score.obtained} total={score.total} size="lg" />
            )}
          </div>
        </Card>

        {/* ========== TAB NAVIGATION ========== */}
        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex-shrink-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          {detailedEvaluation && (
            <Button
              variant={activeTab === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('detailed')}
              className="flex-shrink-0"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Detailed Analysis
            </Button>
          )}
          {keywordsAnalysis && (
            <Button
              variant={activeTab === 'keywords' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('keywords')}
              className="flex-shrink-0"
            >
              <Star className="h-4 w-4 mr-2" />
              Keywords
            </Button>
          )}
          {(strengths.length > 0 || weaknesses.length > 0 || improvementSuggestions.length > 0) && (
            <Button
              variant={activeTab === 'feedback' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('feedback')}
              className="flex-shrink-0"
            >
              <Zap className="h-4 w-4 mr-2" />
              Feedback
            </Button>
          )}
          {modelAnswer && (
            <Button
              variant={activeTab === 'model' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('model')}
              className="flex-shrink-0"
            >
              <Award className="h-4 w-4 mr-2" />
              Model Answer
            </Button>
          )}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Relevance Justification */}
            {relevanceCheck && relevanceCheck.justification && (
              <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
                <div className="flex items-start gap-3">
                  <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Relevance Assessment</h4>
                    <p className="text-sm text-blue-700">{relevanceCheck.justification}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Rubric Wise Marks */}
            {rubricWiseMarks && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Target className="h-5 w-5" />
                  <h3>Rubric-Wise Marks Breakdown</h3>
                </div>
                
                <div className="grid gap-4">
                  {rubricWiseMarks.content_accuracy && (
                    <Card className="p-4 border-l-4 border-l-green-500 bg-green-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold">Content Accuracy</h4>
                        </div>
                        <MiniScoreBadge 
                          obtained={rubricWiseMarks.content_accuracy.marks_awarded} 
                          total={rubricWiseMarks.content_accuracy.marks_possible} 
                        />
                      </div>
                      <Progress 
                        value={(rubricWiseMarks.content_accuracy.marks_awarded / rubricWiseMarks.content_accuracy.marks_possible) * 100} 
                        className="h-2 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{rubricWiseMarks.content_accuracy.comments}</p>
                    </Card>
                  )}

                  {rubricWiseMarks.structure_and_flow && (
                    <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">Structure & Flow</h4>
                        </div>
                        <MiniScoreBadge 
                          obtained={rubricWiseMarks.structure_and_flow.marks_awarded} 
                          total={rubricWiseMarks.structure_and_flow.marks_possible} 
                        />
                      </div>
                      <Progress 
                        value={(rubricWiseMarks.structure_and_flow.marks_awarded / rubricWiseMarks.structure_and_flow.marks_possible) * 100} 
                        className="h-2 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{rubricWiseMarks.structure_and_flow.comments}</p>
                    </Card>
                  )}

                  {rubricWiseMarks.language_and_presentation && (
                    <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PenTool className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold">Language & Presentation</h4>
                        </div>
                        <MiniScoreBadge 
                          obtained={rubricWiseMarks.language_and_presentation.marks_awarded} 
                          total={rubricWiseMarks.language_and_presentation.marks_possible} 
                        />
                      </div>
                      <Progress 
                        value={(rubricWiseMarks.language_and_presentation.marks_awarded / rubricWiseMarks.language_and_presentation.marks_possible) * 100} 
                        className="h-2 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{rubricWiseMarks.language_and_presentation.comments}</p>
                    </Card>
                  )}

                  {rubricWiseMarks.examples_usage && (
                    <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold">Examples Usage</h4>
                        </div>
                        <MiniScoreBadge 
                          obtained={rubricWiseMarks.examples_usage.marks_awarded} 
                          total={rubricWiseMarks.examples_usage.marks_possible} 
                        />
                      </div>
                      <Progress 
                        value={(rubricWiseMarks.examples_usage.marks_awarded / rubricWiseMarks.examples_usage.marks_possible) * 100} 
                        className="h-2 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{rubricWiseMarks.examples_usage.comments}</p>
                    </Card>
                  )}

                  {rubricWiseMarks.analysis_and_originality && (
                    <Card className="p-4 border-l-4 border-l-teal-500 bg-teal-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-teal-600" />
                          <h4 className="font-semibold">Analysis & Originality</h4>
                        </div>
                        <MiniScoreBadge 
                          obtained={rubricWiseMarks.analysis_and_originality.marks_awarded} 
                          total={rubricWiseMarks.analysis_and_originality.marks_possible} 
                        />
                      </div>
                      <Progress 
                        value={(rubricWiseMarks.analysis_and_originality.marks_awarded / rubricWiseMarks.analysis_and_originality.marks_possible) * 100} 
                        className="h-2 mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{rubricWiseMarks.analysis_and_originality.comments}</p>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== DETAILED ANALYSIS TAB ========== */}
        {activeTab === 'detailed' && detailedEvaluation && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <ClipboardList className="h-5 w-5" />
              <h3>Section-Wise Detailed Evaluation</h3>
            </div>

            {/* Introduction Assessment */}
            <CollapsibleSection 
              title="Introduction Assessment"
              icon={Edit3}
              badge={<MiniScoreBadge 
                obtained={detailedEvaluation.introduction_assessment.marks_awarded} 
                total={detailedEvaluation.introduction_assessment.marks_possible} 
              />}
              colorClass="border-l-4 border-l-indigo-500"
            >
              <div className="pt-4">
                <Progress 
                  value={(detailedEvaluation.introduction_assessment.marks_awarded / detailedEvaluation.introduction_assessment.marks_possible) * 100} 
                  className="h-2 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {detailedEvaluation.introduction_assessment.comments}
                </p>
              </div>
            </CollapsibleSection>

            {/* Body Assessment */}
            <CollapsibleSection 
              title="Body Assessment"
              icon={FileText}
              badge={<MiniScoreBadge 
                obtained={detailedEvaluation.body_assessment.marks_awarded} 
                total={detailedEvaluation.body_assessment.marks_possible} 
              />}
              colorClass="border-l-4 border-l-blue-500"
            >
              <div className="pt-4 space-y-4">
                <Progress 
                  value={(detailedEvaluation.body_assessment.marks_awarded / detailedEvaluation.body_assessment.marks_possible) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground">
                  {detailedEvaluation.body_assessment.comments}
                </p>

                {/* Similarities Covered */}
                {detailedEvaluation.body_assessment.similarities_covered && 
                 detailedEvaluation.body_assessment.similarities_covered.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Similarities Covered
                    </p>
                    <ul className="space-y-1">
                      {detailedEvaluation.body_assessment.similarities_covered.map((item, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {highlightKeywords(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Differences Covered */}
                {detailedEvaluation.body_assessment.differences_covered && 
                 detailedEvaluation.body_assessment.differences_covered.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Differences Covered
                    </p>
                    <ul className="space-y-1">
                      {detailedEvaluation.body_assessment.differences_covered.map((item, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {highlightKeywords(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Key Points */}
                {detailedEvaluation.body_assessment.missing_key_points && 
                 detailedEvaluation.body_assessment.missing_key_points.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Missing Key Points
                    </p>
                    <ul className="space-y-1">
                      {detailedEvaluation.body_assessment.missing_key_points.map((item, i) => (
                        <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          {highlightKeywords(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Conclusion Assessment */}
            <CollapsibleSection 
              title="Conclusion Assessment"
              icon={MessageSquare}
              badge={<MiniScoreBadge 
                obtained={detailedEvaluation.conclusion_assessment.marks_awarded} 
                total={detailedEvaluation.conclusion_assessment.marks_possible} 
              />}
              colorClass="border-l-4 border-l-violet-500"
            >
              <div className="pt-4">
                <Progress 
                  value={(detailedEvaluation.conclusion_assessment.marks_awarded / detailedEvaluation.conclusion_assessment.marks_possible) * 100} 
                  className="h-2 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {detailedEvaluation.conclusion_assessment.comments}
                </p>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* ========== KEYWORDS TAB ========== */}
        {activeTab === 'keywords' && keywordsAnalysis && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Star className="h-5 w-5" />
              <h3>Keywords Analysis</h3>
            </div>

            <div className="grid gap-4">
              {/* Keywords Used Correctly */}
              {keywordsAnalysis.keywords_used_correctly.length > 0 && (
                <Card className="p-4 border-l-4 border-l-green-500 bg-green-50/50">
                  <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Keywords Used Correctly ({keywordsAnalysis.keywords_used_correctly.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {keywordsAnalysis.keywords_used_correctly.map((keyword, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Mandatory Keywords Missing */}
              {keywordsAnalysis.mandatory_keywords_missing.length > 0 && (
                <Card className="p-4 border-l-4 border-l-red-500 bg-red-50/50">
                  <p className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Mandatory Keywords Missing ({keywordsAnalysis.mandatory_keywords_missing.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {keywordsAnalysis.mandatory_keywords_missing.map((keyword, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Including these keywords is essential for a complete answer
                  </p>
                </Card>
              )}

              {/* Keywords Misused */}
              {keywordsAnalysis.keywords_misused.length > 0 && (
                <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50">
                  <p className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Keywords Misused ({keywordsAnalysis.keywords_misused.length})
                  </p>
                  <div className="space-y-2">
                    {keywordsAnalysis.keywords_misused.map((item, index) => (
                      <div key={index} className="text-sm text-amber-700 bg-amber-100 px-3 py-2 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ========== FEEDBACK TAB ========== */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Strengths */}
            {strengths.length > 0 && (
              <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
                <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Strengths ({strengths.length})
                </h3>
                <ul className="space-y-3">
                  {strengths.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="bg-green-200 text-green-700 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-sm text-green-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <Card className="p-6 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50/50 to-rose-50/50">
                <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5" />
                  Weaknesses ({weaknesses.length})
                </h3>
                <ul className="space-y-3">
                  {weaknesses.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="bg-red-200 text-red-700 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        ✗
                      </span>
                      <span className="text-sm text-red-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Improvement Suggestions */}
            {improvementSuggestions.length > 0 && (
              <Card className="p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
                <h3 className="text-lg font-semibold text-amber-700 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Improvement Suggestions ({improvementSuggestions.length})
                </h3>
                <ul className="space-y-4">
                  {improvementSuggestions.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="bg-amber-200 text-amber-700 rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="text-sm text-amber-900 leading-relaxed flex-1">
                        {highlightKeywords(item)}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* ========== MODEL ANSWER TAB ========== */}
        {activeTab === 'model' && modelAnswer && (
          <div className="space-y-6">
            {/* Model Answer Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <Type className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{modelAnswer.word_count}</p>
                <p className="text-xs text-muted-foreground">Word Count</p>
              </Card>
              
              <Card className={cn(
                "p-4 text-center",
                modelAnswer.structure_check.has_introduction ? "bg-green-50" : "bg-red-50"
              )}>
                <Edit3 className={cn(
                  "h-5 w-5 mx-auto mb-2",
                  modelAnswer.structure_check.has_introduction ? "text-green-600" : "text-red-600"
                )} />
                <p className="text-sm font-medium">Introduction</p>
                <p className="text-xs text-muted-foreground">
                  {modelAnswer.structure_check.has_introduction ? "✓ Present" : "✗ Missing"}
                </p>
              </Card>

              <Card className={cn(
                "p-4 text-center",
                modelAnswer.structure_check.has_body ? "bg-green-50" : "bg-red-50"
              )}>
                <FileText className={cn(
                  "h-5 w-5 mx-auto mb-2",
                  modelAnswer.structure_check.has_body ? "text-green-600" : "text-red-600"
                )} />
                <p className="text-sm font-medium">Body</p>
                <p className="text-xs text-muted-foreground">
                  {modelAnswer.structure_check.has_body ? "✓ Present" : "✗ Missing"}
                </p>
              </Card>

              <Card className={cn(
                "p-4 text-center",
                modelAnswer.structure_check.has_conclusion ? "bg-green-50" : "bg-red-50"
              )}>
                <MessageSquare className={cn(
                  "h-5 w-5 mx-auto mb-2",
                  modelAnswer.structure_check.has_conclusion ? "text-green-600" : "text-red-600"
                )} />
                <p className="text-sm font-medium">Conclusion</p>
                <p className="text-xs text-muted-foreground">
                  {modelAnswer.structure_check.has_conclusion ? "✓ Present" : "✗ Missing"}
                </p>
              </Card>
            </div>

            {/* Rubric Alignment */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Model Answer Rubric Alignment
              </h4>
              <div className="flex flex-wrap gap-3">
                <Badge className={cn(
                  modelAnswer.rubric_alignment.content_accuracy 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  {modelAnswer.rubric_alignment.content_accuracy ? "✓" : "○"} Content Accuracy
                </Badge>
                <Badge className={cn(
                  modelAnswer.rubric_alignment.analysis_present 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  {modelAnswer.rubric_alignment.analysis_present ? "✓" : "○"} Analysis Present
                </Badge>
                <Badge className={cn(
                  modelAnswer.rubric_alignment.examples_used 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  {modelAnswer.rubric_alignment.examples_used ? "✓" : "○"} Examples Used
                </Badge>
              </div>
            </Card>

            {/* Model Answer Text */}
            <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
                <Award className="h-5 w-5" />
                <h3>Model Answer</h3>
                <Badge variant="outline" className="ml-2">
                  {modelAnswer.word_count} words
                </Badge>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line bg-white/50 dark:bg-black/20 p-4 rounded-lg border">
                  {highlightKeywords(modelAnswer.model_answer)}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========== RAW FALLBACK ========== */}
        {evaluationResult.rawMarkdown && !rubricWiseMarks && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-3">Raw Evaluation Response</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded overflow-auto max-h-96">
              {evaluationResult.rawMarkdown}
            </pre>
          </Card>
        )}

        {/* ========== ACTION BUTTONS ========== */}
        <div className="flex gap-4 pt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowResults(false)}>
            ← Back to Form
          </Button>
          <Button className="flex-1" onClick={handleReset}>
            Evaluate Another Answer
          </Button>
        </div>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  // Show results page
  if (showResults && evaluationResult) {
    return (
      <div className="flex-1 flex gap-4 sm:gap-6 p-4 sm:p-6 bg-background overflow-y-auto">
        <div className="flex-1 max-w-4xl mx-auto w-full">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Evaluation Results</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {selectedPaper ? `${selectedPaper.toUpperCase()} • ` : ''}
              {selectedMarks} marks • {evaluatorMode} mode
            </p>
          </div>
          <EvaluationResults />
        </div>
      </div>
    )
  }

  // Papers list
  const papers = [
    { id: "gs1", name: "GS1 - Heritage, Culture, History, Geography" },
    { id: "gs2", name: "GS2 - Governance, Constitution, Polity, IR" },
    { id: "gs3", name: "GS3 - Technology, Economy, Environment, Security" },
    { id: "gs4", name: "GS4 - Ethics, Integrity, Aptitude" },
    { id: "essay", name: "Essay" },
  ]

  // ==================== FORM VIEW ====================
  return (
    <div className="flex-1 flex gap-4 sm:gap-6 p-4 sm:p-6 bg-background overflow-y-auto">
      <div className="flex-1 max-w-4xl space-y-4 sm:space-y-6">
        {/* Paper Type & Language */}
        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Paper Type & Language</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Evaluation Language:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={language === "english" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("english")}
                className={language === "english" ? "" : "bg-transparent"}
              >
                English
              </Button>
              <Button
                type="button"
                variant={language === "hindi" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("hindi")}
                className={language === "hindi" ? "" : "bg-transparent"}
                disabled
              >
                हिंदी
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Select Paper:</Label>
            <Select value={selectedPaper} onValueChange={setSelectedPaper}>
              <SelectTrigger>
                <SelectValue placeholder="Select a paper type" />
              </SelectTrigger>
              <SelectContent>
                {papers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Question Marks */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Question Marks</h2>
          </div>

          {/* Mark options based on paper type */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(() => {
              let markOptions: Array<{ marks: number; words: number }> = []
              
              if (selectedPaper === 'gs4-case' || selectedPaper === 'essay') {
                // Essay - 125 marks, 1000-1200 words
                markOptions = [{ marks: 125, words: 1100 }]
              } else if (selectedPaper === 'gs4') {
                // GS4 - 10 marks (150 words), 20 marks (250 words)
                markOptions = [
                  { marks: 10, words: 150 },
                  { marks: 20, words: 250 }
                ]
              } else if (['gs1', 'gs2', 'gs3'].includes(selectedPaper)) {
                // GS1, GS2, GS3 - 10 marks (150 words), 15 marks (250 words)
                markOptions = [
                  { marks: 10, words: 150 },
                  { marks: 15, words: 250 }
                ]
              }

              if (markOptions.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">Please select a paper type to view mark options</p>
                )
              }

              return markOptions.map((option) => (
                <Button
                  key={option.marks}
                  type="button"
                  variant={selectedMarks === option.marks ? "default" : "outline"}
                  onClick={() => setSelectedMarks(option.marks)}
                  className={cn(
                    "h-16 sm:h-20 flex-1 min-w-[110px] sm:min-w-[140px] flex flex-col items-center justify-center text-xs sm:text-base",
                    selectedMarks === option.marks ? "" : "bg-transparent"
                  )}
                >
                  <span className="font-bold text-sm sm:text-lg">{option.marks} marks</span>
                  <span className="text-xs opacity-70">{option.words} words</span>
                </Button>
              ))
            })()}
          </div>
        </Card>

        {/* Evaluator Mode */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">How do you want your evaluator to be?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {(["easy", "medium", "hard"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={evaluatorMode === mode ? "default" : "outline"}
                onClick={() => setEvaluatorMode(mode)}
                className={cn(
                  "h-12 sm:h-14 text-sm sm:text-base font-semibold w-full",
                  evaluatorMode === mode ? "" : "bg-transparent",
                  mode === "easy" && evaluatorMode === mode && "bg-green-600 hover:bg-green-700",
                  mode === "medium" && evaluatorMode === mode && "bg-amber-500 hover:bg-amber-600",
                  mode === "hard" && evaluatorMode === mode && "bg-red-500 hover:bg-red-600"
                )}
              >
                {mode === "easy" && "⭐ Easy"}
                {mode === "medium" && "⚡ Medium"}
                {mode === "hard" && "🔥 Hard"}
              </Button>
            ))}
          </div>
        </Card>

        {/* Question (Optional) */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Question (Optional)</h2>
          </div>

          <Textarea
            placeholder="Enter the question here (optional - AI can read from uploaded images)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </Card>

        {/* Upload Answer Sheets */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Upload Answer Sheets</h2>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            className="hidden"
          />
          <div
            onClick={handleUploadClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border rounded-lg p-6 sm:p-12 flex flex-col items-center justify-center gap-3 sm:gap-4 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Upload className="h-8 sm:h-12 w-8 sm:w-12 text-primary" />
            <div className="text-center">
              <p className="font-medium text-sm sm:text-base">Click to upload or drag & drop</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Supports JPG, PNG, PDF (Max 25 files, 20MB each)</p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">
                {uploadedFiles.length} file(s) selected: 
                <span className="text-muted-foreground ml-2">
                  ({uploadedFiles.filter(f => f.type === 'application/pdf').length} PDF, 
                  {uploadedFiles.filter(f => f.type.startsWith('image/')).length} Images)
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                      file.type === 'application/pdf' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <span className="text-xs opacity-70">({(file.size / 1024).toFixed(0)}KB)</span>
                    <button type="button" onClick={() => removeFile(index)} className="hover:opacity-70">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button 
            size="lg" 
            className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold w-full"
            onClick={handleEvaluate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 mr-2 animate-spin" />
                <span className="hidden sm:inline">Evaluating...</span>
                <span className="sm:hidden">Evaluating...</span>
              </>
            ) : (
              <>Evaluate Answer</>
            )}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleReset} 
            className="h-12 sm:h-14 bg-transparent w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reset All</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>

        {/* Disclaimer */}
        <details className="group cursor-pointer">
          <summary className="font-medium text-sm list-none flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50">
            Disclaimer
            <span className="transform transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="p-4 text-sm text-muted-foreground border border-t-0 border-border rounded-b-lg">
            <p>
              This AI-powered evaluation tool is designed to provide constructive feedback on your UPSC Mains answers.
              The evaluation is based on standard UPSC marking criteria but should be used as a learning aid.
            </p>
          </div>
        </details>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 hidden lg:block">
        <Card className="p-6 sticky top-6">
          <div className="flex flex-col items-center gap-6">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {selectedMarks ? "Current Selection" : "Ready to Evaluate"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedMarks ? "Review your selections before evaluation" : "Upload your answer sheets to see a preview here"}
              </p>
            </div>

            {(selectedMarks || uploadedFiles.length > 0) && (
              <div className="w-full space-y-3 border-t pt-6">
                {selectedPaper && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paper:</span>
                    <span className="font-semibold text-primary">{selectedPaper.toUpperCase()}</span>
                  </div>
                )}
                {selectedMarks && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marks:</span>
                      <span className="font-semibold text-primary">{selectedMarks} marks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Word Limit:</span>
                      <span className="font-semibold text-blue-600">{getWordLimit(selectedMarks)} words</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className={cn(
                    "font-semibold",
                    evaluatorMode === "hard" && "text-red-500",
                    evaluatorMode === "medium" && "text-amber-500",
                    evaluatorMode === "easy" && "text-green-500",
                  )}>
                    {evaluatorMode.charAt(0).toUpperCase() + evaluatorMode.slice(1)}
                  </span>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Files:</span>
                    <span className="font-semibold text-primary">{uploadedFiles.length} uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
