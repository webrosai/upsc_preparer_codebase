import { Card } from "@/components/ui/card"
import { LinkedinIcon, TwitterIcon } from "lucide-react"

export function Team() {
  const team = [
    {
      name: "Dr. Rajesh Kumar",
      role: "Founder & CEO",
      image: "/professional-indian-male-founder.jpg",
      bio: "Former IAS officer with 15 years of experience, passionate about educational technology.",
    },
    {
      name: "Priya Sharma",
      role: "Chief Academic Officer",
      image: "/professional-indian-female-education-expert.jpg",
      bio: "Ex-UPSC topper and educator with a mission to revolutionize civil service preparation.",
    },
    {
      name: "Amit Patel",
      role: "Head of AI & Technology",
      image: "/professional-indian-male-tech-lead.jpg",
      bio: "AI researcher from IIT, specializing in educational applications of machine learning.",
    },
    {
      name: "Sneha Reddy",
      role: "Content Strategy Lead",
      image: "/professional-indian-female-content-strategist.jpg",
      bio: "UPSC subject matter expert with deep understanding of exam patterns and pedagogy.",
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            A diverse team of educators, technologists, and UPSC experts dedicated to your success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {team.map((member) => (
            <Card key={member.name} className="overflow-hidden border-border hover:border-primary transition-colors">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm font-medium text-primary mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
                <div className="flex gap-3">
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <LinkedinIcon className="h-5 w-5" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <TwitterIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-border">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Join Our Growing Community</h3>
              <p className="text-lg text-muted-foreground mb-6 text-balance">
                Over 50,000 aspirants are already preparing smarter with UPSCPreparer. Start your journey today and be
                part of India's next generation of civil servants.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">50K+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">2M+</div>
                  <div className="text-sm text-muted-foreground">Tests Generated</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Success Stories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">4.8/5</div>
                  <div className="text-sm text-muted-foreground">User Rating</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
