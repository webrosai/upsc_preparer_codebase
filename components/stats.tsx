import { Award, BookOpen, Target, TrendingUp } from "lucide-react"

export function Stats() {
  const stats = [
    {
      icon: Award,
      value: "2,500+",
      label: "Successful Selections",
      color: "text-primary",
    },
    {
      icon: BookOpen,
      value: "10,000+",
      label: "Study Resources",
      color: "text-accent",
    },
    {
      icon: Target,
      value: "98%",
      label: "Accuracy Rate",
      color: "text-success",
    },
    {
      icon: TrendingUp,
      value: "40%",
      label: "Faster Learning",
      color: "text-secondary",
    },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className={`mb-3 rounded-lg bg-card p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
