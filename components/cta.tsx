"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { SignInDialog } from "@/components/sign-in-dialog"

export function CTA() {
  const [signInOpen, setSignInOpen] = useState(false)
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 p-8 md:p-16">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-6 text-balance">
              Start Your Success Journey <span className="text-primary">Today</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
              Join 50,000+ aspirants who are preparing smarter with AI-powered tools. Get started with a 7-day free
              trial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 h-12 px-8" onClick={() => setSignInOpen(true)}>
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent">
                Talk to Expert
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Cancel anytime • 24/7 Support
            </p>
          </div>
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(white,transparent_85%)] -z-0"></div>
        </div>
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </section>
  )
}
