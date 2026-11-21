import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FREE_PLAN, PRO_PLAN, PRO_PRICES } from "@/components/homepage/content";
import { PriceCard } from "@/components/homepage/price-card";
import { PriceDisplay } from "@/components/homepage/price-display";
import { BillingProvider, PricingToggle, ProPrice } from "@/components/homepage/pricing-toggle";
import { CheckoutToast } from "@/components/settings/billing-actions";
import { UpgradeCheckoutButton } from "@/components/upgrade/upgrade-checkout-button";

export const metadata: Metadata = {
  title: "Upgrade to Pro · DevStash",
};

export default async function UpgradePage({ searchParams }: PageProps<"/upgrade">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/upgrade");
  if (session.user.isPro) redirect("/settings");

  const { checkout } = await searchParams;

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Upgrade to Pro</h1>
        <p className="mt-2 text-muted-foreground">
          Unlimited items and collections, file and image uploads, and AI features.
        </p>
      </div>
      <BillingProvider>
        <div>
          <PricingToggle />
          <div className="mx-auto grid max-w-196 gap-6 md:grid-cols-2">
            <PriceCard
              name={FREE_PLAN.name}
              features={FREE_PLAN.features}
              price={<PriceDisplay price={FREE_PLAN.price} />}
              action={
                <p className="flex h-10 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
                  Current plan
                </p>
              }
            />
            <PriceCard
              name={PRO_PLAN.name}
              features={PRO_PLAN.features}
              price={<ProPrice prices={PRO_PRICES} />}
              featured
              badge="Most Popular"
              action={<UpgradeCheckoutButton />}
            />
          </div>
        </div>
      </BillingProvider>
      {checkout === "canceled" && <CheckoutToast status="canceled" path="/upgrade" />}
    </>
  );
}
