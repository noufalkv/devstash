import type { Metadata } from "next";

import { AiSection } from "@/components/homepage/ai-section";
import { CtaSection } from "@/components/homepage/cta-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { Hero } from "@/components/homepage/hero";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeNav } from "@/components/homepage/home-nav";
import { PricingSection } from "@/components/homepage/pricing-section";

export const metadata: Metadata = {
  title: "DevStash - Your Developer Knowledge Hub",
  description:
    "DevStash is one fast, searchable hub for your code snippets, AI prompts, commands, notes, files, images and links.",
};

export default function Home() {
  return (
    <div data-homepage className="overflow-x-clip">
      <HomeNav />
      <main>
        <Hero />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
