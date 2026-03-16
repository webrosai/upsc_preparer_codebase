import { Card } from "@/components/ui/card"
import { Target, Lightbulb, Users } from "lucide-react"

export function Mission() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Mission & Vision</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-balance">
            We believe every aspirant deserves access to world-class preparation tools, regardless of their location or
            financial background.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 text-center border-border hover:border-primary transition-colors">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
              <Target className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To make quality UPSC preparation accessible and affordable for every aspirant through innovative
              AI-powered learning solutions.
            </p>
          </Card>

          <Card className="p-8 text-center border-border hover:border-primary transition-colors">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-6">
              <Lightbulb className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To become India's most trusted UPSC preparation platform, empowering thousands of aspirants to achieve
              their dreams of civil service.
            </p>
          </Card>

          <Card className="p-8 text-center border-border hover:border-primary transition-colors">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success mb-6">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Our Values</h3>
            <p className="text-muted-foreground leading-relaxed">
              Excellence, accessibility, innovation, and unwavering commitment to our students' success guide everything
              we do.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
