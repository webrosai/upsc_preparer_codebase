"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentAffairsByDate, getAvailableDates } from "@/app/actions/current-affairs"
import { CurrentAffair } from "@/types/current-affairs"
import { useRouter } from "next/navigation"

export function CurrentAffairs() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [language, setLanguage] = useState("english")
  const [articles, setArticles] = useState<CurrentAffair[]>([])
  const [loading, setLoading] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Fetch available dates on mount
  useEffect(() => {
    const fetchDates = async () => {
      const dates = await getAvailableDates()
      setAvailableDates(dates)
    }
    fetchDates()
  }, [])

  // Fetch articles when date changes
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      const dateStr = formatDateForQuery(selectedDate)
      const data = await getCurrentAffairsByDate(dateStr)
      setArticles(data)
      setLoading(false)
    }
    fetchArticles()
  }, [selectedDate])

  const formatDateForQuery = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (dateStr: string) => {
    // Parse date string as local date to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderSummaryWithBold = (text: string) => {
    // Split text by **bold** markers
    const parts = text.split(/(\*\*.*?\*\*)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** and render as bold
        return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const handleNewsClick = (news: CurrentAffair) => {
    router.push(`/dashboard/current-affairs/${news.id}`)
  }

  const isDateAvailable = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return availableDates.includes(dateStr)
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    setSelectedDate(newDate)
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Previous month days
    const prevMonthDays = getDaysInMonth(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear)
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <button
          key={`prev-${i}`}
          className="h-9 w-9 text-sm text-muted-foreground/50 hover:bg-muted rounded-md"
          disabled
        >
          {prevMonthDays - i}
        </button>
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear
      const hasNews = isDateAvailable(date)
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-9 w-9 text-sm rounded-md transition-colors relative ${
            isSelected
              ? "bg-primary text-primary-foreground font-medium"
              : hasNews
                ? "hover:bg-muted font-medium"
                : "hover:bg-muted text-muted-foreground"
          } ${isToday && !isSelected ? "ring-1 ring-primary" : ""}`}
        >
          {day}
          {hasNews && !isSelected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      )
    }

    return days
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className="flex-1 flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Language Toggle */}
        <div className="flex justify-end gap-2 mb-6">
          <Button
            variant={language === "english" ? "default" : "outline"}
            onClick={() => setLanguage("english")}
            className={language === "english" ? "bg-primary" : ""}
          >
            English
          </Button>
          <Button variant={language === "hindi" ? "default" : "outline"} onClick={() => setLanguage("hindi")}>
            हिंदी
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* News Articles */}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground mb-2">No current affairs available for this date</p>
            <p className="text-sm text-muted-foreground">Please select another date from the calendar</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleNewsClick(article)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2 flex-wrap">
                    {article.category_tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-md text-xs font-medium ${
                          index === 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDisplayDate(article.published_date)}</span>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2 hover:underline">{article.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{renderSummaryWithBold(article.summary)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar - Filters */}
      <aside className="w-80 border-l border-border/40 bg-muted/10 p-6">
        {/* Calendar Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Select Date</h3>
            <Button variant="link" size="sm" className="text-primary h-auto p-0">
              Switch to Range
            </Button>
          </div>

          <div className="bg-background rounded-lg border p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Select
                  value={monthNames[currentMonth].toLowerCase()}
                  onValueChange={(value) => {
                    const monthIndex = monthNames.findIndex((m) => m.toLowerCase() === value)
                    setCurrentMonth(monthIndex)
                  }}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month) => (
                      <SelectItem key={month} value={month.toLowerCase()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={currentYear.toString()}
                  onValueChange={(value) => {
                    setCurrentYear(parseInt(value))
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">{renderCalendar()}</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Dates with • have current affairs available
          </p>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Categories</h3>

          <div className="space-y-3">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Prelims" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prelims Topics</SelectItem>
                <SelectItem value="polity">Polity</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
                <SelectItem value="history">History</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Mains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mains Papers</SelectItem>
                <SelectItem value="gs1">GS1</SelectItem>
                <SelectItem value="gs2">GS2</SelectItem>
                <SelectItem value="gs3">GS3</SelectItem>
                <SelectItem value="gs4">GS4</SelectItem>
              </SelectContent>
            </Select>

            <Button className="w-full bg-primary hover:bg-primary/90">Apply Filter</Button>
            <Button variant="link" className="w-full text-primary">
              Clear Filters
            </Button>
          </div>
        </div>
      </aside>

    </div>
  )
}
