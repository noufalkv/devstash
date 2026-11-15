import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChecklistProps {
  items: string[];
  className?: string;
}

export function Checklist({ items, className }: ChecklistProps) {
  return (
    <ul className={cn("grid gap-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-type-link/15 text-type-link"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
