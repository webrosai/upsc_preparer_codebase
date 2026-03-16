import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, FileText, Lightbulb, Newspaper, PenTool, Trophy } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Bot,
      title: "UPSC AI Assistant",
      description:
        "Get instant answers to your queries with our intelligent AI tutor trained on UPSC syllabus and patterns.",
      gradient: "from-primary/10 to-primary/5",
    },
    {
      icon: PenTool,
      title: "Mains Answer Evaluator",
      description:
        "Receive detailed feedback on your mains answers with AI-powered evaluation and improvement suggestions.",
      gradient: "from-accent/10 to-accent/5",
    },
    {
      icon: FileText,
      title: "Smart Test Builder",
      description:
        "Generate customized test papers based on your weak areas and exam patterns with adaptive difficulty.",
      gradient: "from-success/10 to-success/5",
    },
    {
      icon: Newspaper,
      title: "Current Affairs Hub",
      description:
        "Stay updated with curated daily news, analysis, and exam-relevant current affairs with quiz integration.",
      gradient: "from-secondary/10 to-secondary/5",
    },
    {
      icon: Lightbulb,
      title: "AI Mind Mapper",
      description:
        "Create interactive concept maps and visualizations to understand complex topics and their interconnections.",
      gradient: "from-primary/10 to-primary/5",
    },
    {
      icon: Trophy,
      title: "Progress Analytics",
      description:
        "Track your preparation journey with detailed analytics, performance insights, and personalized recommendations.",
      gradient: "from-accent/10 to-accent/5",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-4 text-balance">
            Comprehensive Tools for <span className="text-primary">Complete Preparation</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            Everything you need to crack UPSC in one intelligent platform
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
