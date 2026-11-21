"use client";

import { createCheckoutSession } from "@/actions/billing";
import { useBilling } from "@/components/homepage/pricing-toggle";
import { useRedirectAction } from "@/components/settings/billing-actions";
import { Button } from "@/components/ui/button";

/** Starts Stripe Checkout for the billing period picked in the surrounding `BillingProvider`. */
export function UpgradeCheckoutButton() {
  const { billing } = useBilling();
  const { isPending, run } = useRedirectAction(() => createCheckoutSession(billing));

  return (
    <Button size="lg" className="h-10 w-full" onClick={run} disabled={isPending}>
      {isPending ? "Redirecting…" : "Upgrade to Pro"}
    </Button>
  );
}
