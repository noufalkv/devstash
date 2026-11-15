"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import type { Billing, PlanPrice } from "@/components/homepage/content";
import { PriceDisplay } from "@/components/homepage/price-display";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface BillingContextValue {
  billing: Billing;
  setBilling: (billing: Billing) => void;
}

const BillingContext = createContext<BillingContextValue | null>(null);

function useBilling(): BillingContextValue {
  const value = useContext(BillingContext);
  if (!value) throw new Error("useBilling must be used inside BillingProvider");
  return value;
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  return <BillingContext value={{ billing, setBilling }}>{children}</BillingContext>;
}

/** Monthly / Yearly switch. The labels also select their period. */
export function PricingToggle() {
  const { billing, setBilling } = useBilling();
  const yearly = billing === "yearly";

  return (
    <div className="mb-10 flex items-center justify-center gap-3 text-sm">
      <BillingLabel active={!yearly} onSelect={() => setBilling("monthly")}>
        Monthly
      </BillingLabel>
      <Switch
        aria-label="Bill yearly"
        checked={yearly}
        onCheckedChange={(checked) => setBilling(checked ? "yearly" : "monthly")}
      />
      <BillingLabel active={yearly} onSelect={() => setBilling("yearly")}>
        Yearly <span className="ml-1 text-xs text-type-link">Save 25%</span>
      </BillingLabel>
    </div>
  );
}

interface BillingLabelProps {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function BillingLabel({ active, onSelect, children }: BillingLabelProps) {
  return (
    // The switch is the keyboard control; the labels are a mouse shortcut.
    <button
      type="button"
      tabIndex={-1}
      onClick={onSelect}
      className={cn(
        "cursor-pointer text-muted-foreground transition-colors",
        active && "font-semibold text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** The Pro price, period and note for the selected billing period. */
export function ProPrice({ prices }: { prices: Record<Billing, PlanPrice> }) {
  const { billing } = useBilling();
  return (
    <div aria-live="polite">
      <PriceDisplay price={prices[billing]} />
    </div>
  );
}
