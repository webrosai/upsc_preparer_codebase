"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Gift, X } from "lucide-react"
import { useState } from "react"

export function ReferEarn() {
  const [copied, setCopied] = useState(false)
  const referralCode = "upscprep10"

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 bg-background border border-border shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Refer & Earn</h2>
                <p className="text-sm text-muted-foreground">Earn rewards by referring friends</p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Referral Code Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Your Referral Codes</h3>
            </div>
            <Card className="p-4 bg-muted/50 border-2 border-dashed border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Primary:</p>
                <p className="text-2xl font-bold text-primary mb-1">{referralCode}</p>
                <p className="text-sm text-muted-foreground mb-3">10% discount</p>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </Card>
            <Button onClick={handleCopy} className="w-full mt-3 bg-primary hover:bg-primary/90">
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>

          {/* How It Works Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">How It Works</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <p className="text-sm text-foreground">Share your coupon code with your friends</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Friends Join</span> - They get 10% off on annual plans
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">You Earn</span> - 15% discount on your next purchase (when they buy
                  annual plan)
                </p>
              </div>
            </div>
          </div>

          {/* Rewards Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 text-center bg-muted/50">
              <p className="text-3xl font-bold text-primary mb-1">15%</p>
              <p className="text-xs text-muted-foreground">First</p>
            </Card>
            <Card className="p-4 text-center bg-muted/50">
              <p className="text-3xl font-bold text-primary mb-1">10%</p>
              <p className="text-xs text-muted-foreground">Friends get</p>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="p-4 bg-muted/30 text-center mb-4">
            <h4 className="font-semibold text-foreground mb-2">Ready to Start Sharing?</h4>
            <p className="text-sm text-muted-foreground">
              Use your referral code above to start earning 15% discount when friends buy annual plans!
            </p>
          </Card>
        </Card>
      </div>
    </div>
  )
}
