import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AboutHero } from "@/components/about-hero"
import { Mission } from "@/components/mission"
import { Team } from "@/components/team"
import { Values } from "@/components/values"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <AboutHero />
        <Mission />
        <Values />
        <Team />
      </main>
      <Footer />
    </div>
  )
}
