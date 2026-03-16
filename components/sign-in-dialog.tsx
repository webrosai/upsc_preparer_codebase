"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { indianStates, getCitiesByState } from "@/data/indian-states-cities"

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [activeTab, setActiveTab] = useState("signin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  
  // Sign Up state
  const [signUpFirstName, setSignUpFirstName] = useState("")
  const [signUpLastName, setSignUpLastName] = useState("")
  const [signUpContact, setSignUpContact] = useState("")
  const [signUpState, setSignUpState] = useState("")
  const [signUpCity, setSignUpCity] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("")
  
  const availableCities = signUpState ? getCitiesByState(signUpState) : []
  
  const supabase = createClient()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (signInError) {
        // Check if it's an unconfirmed email issue
        if (signInError.message.includes("not confirmed")) {
          setError("Please confirm your email address before signing in. Check your inbox for the confirmation email.")
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check and try again.")
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user) {
        setMessage("Sign in successful! Redirecting to dashboard...")
        setTimeout(() => {
          onOpenChange(false)
          router.push("/dashboard")
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!signUpFirstName || !signUpLastName || !signUpContact || !signUpState || !signUpCity || !signUpEmail || !signUpPassword) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: signUpFirstName,
            last_name: signUpLastName,
            contact_number: signUpContact,
            state: signUpState,
            city: signUpCity,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (authData.user) {
        // Step 2: Save user profile to public.users table
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            auth_user_id: authData.user.id,
            first_name: signUpFirstName,
            last_name: signUpLastName,
            email_id: signUpEmail,
            contact_number: signUpContact,
            state: signUpState,
            city: signUpCity,
          })

        if (profileError) {
          console.error("[v0] Profile creation error:", profileError)
          // Continue even if profile creation fails - user can still sign in
        }

        // Step 3: Send confirmation email
        try {
          await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: signUpEmail,
              name: `${signUpFirstName} ${signUpLastName}`,
            }),
          })
        } catch (emailError) {
          console.error("[v0] Email sending error:", emailError)
          // Continue even if email fails
        }

        setMessage("Sign up successful! Please check your email to confirm your account and to log in.")
        setTimeout(() => {
          // Reset form
          setSignUpFirstName("")
          setSignUpLastName("")
          setSignUpContact("")
          setSignUpState("")
          setSignUpCity("")
          setSignUpEmail("")
          setSignUpPassword("")
          setSignUpConfirmPassword("")
          setActiveTab("signin")
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-lg">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6">
          <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4 sm:mb-6 shadow-lg flex-shrink-0">
            <span className="text-2xl sm:text-3xl font-bold text-primary">UP</span>
          </div>

          <DialogHeader className="space-y-2 text-center w-full">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-primary text-balance">
              {activeTab === "signin" ? "Welcome Back!" : "Create Your Account"}
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground px-1 text-balance">
              {activeTab === "signin" ? (
                <>
                  New to UPSCPreparer?{" "}
                  <button
                    onClick={() => {
                      setActiveTab("signup")
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-primary font-medium hover:underline active:underline"
                    type="button"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setActiveTab("signin")
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-primary font-medium hover:underline active:underline"
                    type="button"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {message}
            </div>
          )}

          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signin-email" className="text-xs sm:text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium">
                    Password
                  </Label>
                  <a href="#" className="text-xs sm:text-sm text-primary font-medium hover:underline active:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-11 bg-primary hover:bg-primary/90 text-base font-medium mt-4 sm:mt-2 active:bg-primary/80"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          {activeTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4 max-h-[calc(90vh-240px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="firstname" className="text-xs sm:text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstname"
                    type="text"
                    placeholder="First name"
                    className="h-12 sm:h-11 text-base sm:text-sm"
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="lastname" className="text-xs sm:text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastname"
                    type="text"
                    placeholder="Last name"
                    className="h-12 sm:h-11 text-base sm:text-sm"
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="contact" className="text-xs sm:text-sm font-medium">
                  Contact Number
                </Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="+91 Enter contact"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signUpContact}
                  onChange={(e) => setSignUpContact(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="state" className="text-xs sm:text-sm font-medium">
                  Select State
                </Label>
                <select
                  id="state"
                  className="w-full h-12 sm:h-11 px-3 border border-input rounded-md bg-white text-base sm:text-sm disabled:opacity-50 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={signUpState}
                  onChange={(e) => {
                    setSignUpState(e.target.value)
                    setSignUpCity("")
                  }}
                  disabled={loading}
                  required
                >
                  <option value="">Choose a state...</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {signUpState && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="city" className="text-xs sm:text-sm font-medium">
                    Select City
                  </Label>
                  <select
                    id="city"
                    className="w-full h-12 sm:h-11 px-3 border border-input rounded-md bg-white text-base sm:text-sm disabled:opacity-50 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={signUpCity}
                    onChange={(e) => setSignUpCity(e.target.value)}
                    disabled={loading || availableCities.length === 0}
                    required
                  >
                    <option value="">Choose a city...</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min 6 characters"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  className="h-12 sm:h-11 text-base sm:text-sm"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-11 bg-primary hover:bg-primary/90 text-base font-medium mt-4 sm:mt-2 active:bg-primary/80"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
