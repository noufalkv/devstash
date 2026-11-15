import type { PlanPrice } from "@/components/homepage/content";

export function PriceDisplay({ price }: { price: PlanPrice }) {
  return (
    <>
      <p className="mt-3.5 mb-1">
        <span className="text-[44px] font-extrabold tracking-tight">{price.amount}</span>
        <span className="text-muted-foreground">{price.period}</span>
      </p>
      <p className="mb-6 min-h-[1.6em] text-sm text-muted-foreground">{price.note}</p>
    </>
  );
}
