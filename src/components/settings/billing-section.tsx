import { CheckoutToast, ManageBillingButton, UpgradeButton } from "@/components/settings/billing-actions";
import { PRO_PRICES } from "@/components/homepage/content";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionDetails } from "@/lib/billing";
import type { PlanUsage } from "@/lib/db/users";
import { formatDate } from "@/lib/format-date";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/usage-limits";

interface BillingSectionProps {
  isPro: boolean;
  usage: PlanUsage;
  subscription: SubscriptionDetails | null;
  hasCustomer: boolean;
  checkout?: "success" | "canceled";
}

const BILLING_LABELS = { monthly: "Monthly", yearly: "Yearly" } as const;

function FreePlan({ usage }: { usage: PlanUsage }) {
  const { monthly, yearly } = PRO_PRICES;
  return (
    <>
      <div>
        <p className="text-sm font-medium">Free plan</p>
        <ul className="mt-1 text-sm text-muted-foreground">
          <li>
            {usage.itemCount} / {FREE_ITEM_LIMIT} items
          </li>
          <li>
            {usage.collectionCount} / {FREE_COLLECTION_LIMIT} collections
          </li>
        </ul>
      </div>
      <p className="text-sm text-muted-foreground">
        Pro adds unlimited items and collections, file and image uploads, and AI features.
      </p>
      <div className="flex flex-wrap gap-2">
        <UpgradeButton billing="monthly" label={`Upgrade – ${monthly.amount}${monthly.period}`} />
        <UpgradeButton
          billing="yearly"
          variant="outline"
          label={`Upgrade – ${yearly.amount}${yearly.period}`}
        />
      </div>
    </>
  );
}

function ProPlan({
  subscription,
  hasCustomer,
}: {
  subscription: SubscriptionDetails | null;
  hasCustomer: boolean;
}) {
  const periodEnd = subscription?.currentPeriodEnd;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">
          Pro plan{subscription && ` · ${BILLING_LABELS[subscription.billing]}`}
        </p>
        {periodEnd && (
          <p className="text-sm text-muted-foreground">
            {subscription.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}{" "}
            {formatDate(periodEnd, "long")}
          </p>
        )}
        {subscription?.status === "past_due" && (
          <p className="text-sm text-destructive">
            Your last payment failed. Update your card to keep Pro.
          </p>
        )}
      </div>
      {hasCustomer && <ManageBillingButton />}
    </div>
  );
}

export function BillingSection({
  isPro,
  usage,
  subscription,
  hasCustomer,
  checkout,
}: BillingSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Billing</h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {isPro ? (
            <ProPlan subscription={subscription} hasCustomer={hasCustomer} />
          ) : (
            <FreePlan usage={usage} />
          )}
        </CardContent>
      </Card>
      {checkout && <CheckoutToast status={checkout} />}
    </section>
  );
}
