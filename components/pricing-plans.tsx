import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

export function PricingPlans() {
  const plans = [
    {
      name: "Free Trial",
      price: "0",
      period: "14 days",
      description: "Perfect to explore our platform and experience AI-powered learning",
      features: [
        "Access to UPSC GPT (10 queries/day)",
        "Basic Test Generator (2 tests/day)",
        "Current Affairs Updates",
        "AI Study Maps (5 maps)",
        "Community Support",
        "Basic Analytics",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      price: "499",
      period: "month",
      description: "Most popular choice for serious UPSC aspirants",
      features: [
        "Unlimited UPSC GPT queries",
        "Advanced Test Generator (unlimited)",
        "Mains Answer Evaluator (50/month)",
        "Unlimited AI Study Maps",
        "Daily Current Affairs with Analysis",
        "UPSC Puzzle Game Access",
        "Priority Support",
        "Detailed Performance Analytics",
        "Previous Year Papers",
        "Study Plan Recommendations",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Premium",
      price: "4999",
      period: "year",
      description: "Best value for complete UPSC preparation journey",
      features: [
        "Everything in Pro plan",
        "Unlimited Mains Evaluations",
        "Personalized Study Roadmap",
        "One-on-One Mentor Sessions (4/year)",
        "Exclusive Masterclasses",
        "Interview Preparation Module",
        "Essay Writing Workshops",
        "Referral Rewards Program",
        "Lifetime Access to Past Materials",
        "Priority Feature Requests",
      ],
      cta: "Upgrade to Premium",
      popular: false,
      savings: "Save ₹1,989 annually",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Choose Your Path to Success
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Flexible pricing plans designed for every stage of your UPSC preparation journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col p-8 ${
                plan.popular ? "border-2 border-primary shadow-xl scale-105" : "border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.savings && <p className="text-sm font-semibold text-success mt-2">{plan.savings}</p>}
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className={plan.popular ? "w-full bg-primary hover:bg-primary/90" : "w-full"}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">All plans include 14-day money-back guarantee</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>No credit card required for trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Secure payment processing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
