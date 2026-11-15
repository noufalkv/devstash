import type { ReactNode } from "react";

import { ButtonLink } from "@/components/homepage/button-link";
import { Checklist } from "@/components/homepage/checklist";
import { FREE_PLAN, HOME_CONTAINER, type Plan, PRO_PLAN, PRO_PRICES } from "@/components/homepage/content";
import { FadeIn } from "@/components/homepage/fade-in";
import { PriceDisplay } from "@/components/homepage/price-display";
import { BillingProvider, PricingToggle, ProPrice } from "@/components/homepage/pricing-toggle";
import { SectionHeading } from "@/components/homepage/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className={HOME_CONTAINER}>
        <SectionHeading title="Simple pricing" subtitle="Start free. Upgrade when your stash outgrows it." />
        <BillingProvider>
          <FadeIn>
            <PricingToggle />
          </FadeIn>
          <div className="mx-auto grid max-w-[784px] gap-6 md:grid-cols-2">
            <PriceCard plan={FREE_PLAN} price={<PriceDisplay price={FREE_PLAN.price} />} />
            <PriceCard plan={PRO_PLAN} price={<ProPrice prices={PRO_PRICES} />} featured />
          </div>
        </BillingProvider>
      </div>
    </section>
  );
}

interface PriceCardProps {
  plan: Plan;
  price: ReactNode;
  featured?: boolean;
}

function PriceCard({ plan, price, featured = false }: PriceCardProps) {
  return (
    <FadeIn>
      <Card
        className={cn(
          "relative h-full gap-0 overflow-visible px-5.5 py-7 ring-border md:p-8",
          featured &&
            "bg-linear-to-b from-type-snippet/10 to-card to-60% shadow-[0_20px_50px_-20px] shadow-type-snippet/50 ring-type-snippet",
        )}
      >
        {featured && (
          <Badge className="absolute -top-2.5 right-6 bg-type-snippet text-white">Most Popular</Badge>
        )}
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {price}
        <Checklist items={plan.features} className="mb-7 flex-1 text-[15px]" />
        <ButtonLink
          href={plan.cta.href}
          variant={featured ? "default" : "outline"}
          size="lg"
          className="h-10 w-full"
        >
          {plan.cta.label}
        </ButtonLink>
      </Card>
    </FadeIn>
  );
}
