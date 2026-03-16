"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { SignInDialog } from "@/components/sign-in-dialog"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">UP</span>
                </div>
                <span className="text-xl font-bold text-foreground">UPSCPreparer</span>
              </a>
              <nav className="hidden md:flex items-center gap-6">
                <a
                  href="/#features"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="/pricing"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="/about"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
              </nav>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSignInOpen(true)}>
                Sign In
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setSignInOpen(true)}>
                Start Free Trial
              </Button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                About
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSignInOpen(true)}>
                  Sign In
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setSignInOpen(true)}>
                  Start Free Trial
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  )
}
