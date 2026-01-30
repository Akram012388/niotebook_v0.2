import { type ReactElement } from "react";
import { LandingNav } from "@/ui/landing/LandingNav";
import { HeroSection } from "@/ui/landing/HeroSection";
import { FeaturesSection } from "@/ui/landing/FeaturesSection";
import { CTASection } from "@/ui/landing/CTASection";

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
