import { type ReactElement } from "react";
import { LandingNav } from "@/ui/landing/LandingNav";
import { HeroSection } from "@/ui/landing/HeroSection";
import { ValuePropSection } from "@/ui/landing/ValuePropSection";
import { FeaturesSection } from "@/ui/landing/FeaturesSection";
import { CTASection } from "@/ui/landing/CTASection";
export default function Home(): ReactElement {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{
          background: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="content" className="min-h-screen">
        <HeroSection />
        <ValuePropSection />
        <FeaturesSection />
        <CTASection />
      </main>
    </>
  );
}
