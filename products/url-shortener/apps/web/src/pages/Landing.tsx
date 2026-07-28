import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Pricing } from "../components/landing/Pricing";
import { LandingFooter } from "../components/landing/Footer";

export function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <LandingFooter />
    </div>
  );
}
