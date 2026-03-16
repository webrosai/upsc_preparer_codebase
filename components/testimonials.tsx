import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "IAS 2025 Rank 47",
      content:
        "UPSCPreparer's AI tools helped me identify my weak areas and improve systematically. The mains evaluator was a game-changer!",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      role: "IPS 2025 Rank 112",
      content:
        "The personalized study plans and test series were exactly what I needed. Highly recommend to all aspirants.",
      rating: 5,
    },
    {
      name: "Anjali Reddy",
      role: "IFS 2024 Rank 89",
      content: "Current affairs hub saved me hours of newspaper reading. Everything was organized and exam-focused.",
      rating: 5,
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-4 text-balance">
            Trusted by <span className="text-primary">Successful Aspirants</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Join thousands who achieved their dreams with UPSCPreparer
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="mb-6 text-card-foreground leading-relaxed">{testimonial.content}</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
