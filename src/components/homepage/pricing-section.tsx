import { ButtonLink } from "@/components/homepage/button-link";
import { FREE_PLAN, HOME_CONTAINER, PRO_PLAN, PRO_PRICES } from "@/components/homepage/content";
import { FadeIn } from "@/components/homepage/fade-in";
import { PriceCard } from "@/components/homepage/price-card";
import { PriceDisplay } from "@/components/homepage/price-display";
import { BillingProvider, PricingToggle, ProPrice } from "@/components/homepage/pricing-toggle";
import { SectionHeading } from "@/components/homepage/section-heading";

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
            <FadeIn>
              <PriceCard
                name={FREE_PLAN.name}
                features={FREE_PLAN.features}
                price={<PriceDisplay price={FREE_PLAN.price} />}
                action={
                  <ButtonLink href={FREE_PLAN.cta.href} variant="outline" size="lg" className="h-10 w-full">
                    {FREE_PLAN.cta.label}
                  </ButtonLink>
                }
              />
            </FadeIn>
            <FadeIn>
              <PriceCard
                name={PRO_PLAN.name}
                features={PRO_PLAN.features}
                price={<ProPrice prices={PRO_PRICES} />}
                featured
                badge="Most Popular"
                action={
                  <ButtonLink href={PRO_PLAN.cta.href} size="lg" className="h-10 w-full">
                    {PRO_PLAN.cta.label}
                  </ButtonLink>
                }
              />
            </FadeIn>
          </div>
        </BillingProvider>
      </div>
    </section>
  );
}
