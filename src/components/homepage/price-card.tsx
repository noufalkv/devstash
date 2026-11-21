import type { ReactNode } from "react";

import { Checklist } from "@/components/homepage/checklist";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  name: string;
  features: string[];
  price: ReactNode;
  /** The button or label at the bottom of the card. */
  action: ReactNode;
  featured?: boolean;
  badge?: string;
}

/** A plan card, shared by the homepage pricing section and `/upgrade`. */
export function PriceCard({ name, features, price, action, featured = false, badge }: PriceCardProps) {
  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-visible px-5.5 py-7 ring-border md:p-8",
        featured &&
          "bg-linear-to-b from-type-snippet/10 to-card to-60% shadow-[0_20px_50px_-20px] shadow-type-snippet/50 ring-type-snippet",
      )}
    >
      {badge && <Badge className="absolute -top-2.5 right-6 bg-type-snippet text-white">{badge}</Badge>}
      <h3 className="text-xl font-bold">{name}</h3>
      {price}
      <Checklist items={features} className="mb-7 flex-1 text-[15px]" />
      {action}
    </Card>
  );
}
