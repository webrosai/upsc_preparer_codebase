"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { UpscAiAssistant } from "@/components/dashboard/upsc-ai-assistant"
import { TestBuilder } from "@/components/dashboard/test-builder"
import { MindMapper } from "@/components/dashboard/mind-mapper"
import { MainsEvaluator } from "@/components/dashboard/mains-evaluator"
import { CurrentAffairs } from "@/components/dashboard/current-affairs"
import { ReferEarn } from "@/components/dashboard/refer-earn"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email_id: string
  first_name: string
  last_name: string
  contact_number: string
  state: string
  city: string
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("dashboard")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push("/auth/login")
          return
        }

        // Fetch user profile from users table
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (error) {
          // If no profile exists, create one from auth metadata
          setUser({
            id: authUser.id,
            email_id: authUser.email || "",
            first_name: authUser.user_metadata?.first_name || "User",
            last_name: authUser.user_metadata?.last_name || "",
            contact_number: authUser.user_metadata?.contact_number || "",
            state: authUser.user_metadata?.state || "",
            city: authUser.user_metadata?.city || "",
          })
        } else {
          setUser(data)
        }

        // Show success message for 5 seconds on first login
        setShowSuccessMessage(true)
        const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
        return () => clearTimeout(timer)
      } catch (err) {
        console.error("Error:", err)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeView) {
      case "upsc-ai":
        return <UpscAiAssistant />
      case "test-builder":
        return <TestBuilder />
      case "mind-mapper":
        return <MindMapper />
      case "mains-evaluator":
        return <MainsEvaluator />
      case "current-affairs":
        return <CurrentAffairs />
      case "mock-tests":
        return <TestBuilder />
      case "map-practice":
        return <MindMapper />
      case "refer-earn":
        return <ReferEarn />
      case "home":
        return <DashboardContent firstName={user?.first_name} lastName={user?.last_name} />
      case "dashboard":
      default:
        return <DashboardContent firstName={user?.first_name} lastName={user?.last_name} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-green-900">Login Successful!</h3>
              <p className="text-sm text-green-700 mt-1">Welcome back, {user?.first_name}!</p>
            </div>
          </div>
        </div>
      )}

      <DashboardHeader onLogout={handleLogout} />
      <div className="flex h-[calc(100vh-4rem)]">
        <DashboardSidebar 
          activeItem={activeView} 
          onItemChange={setActiveView}
          firstName={user?.first_name}
          lastName={user?.last_name}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  )
}
