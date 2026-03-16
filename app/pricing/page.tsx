import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PricingPlans } from "@/components/pricing-plans"

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <PricingPlans />
      </main>
      <Footer />
    </div>
  )
}
