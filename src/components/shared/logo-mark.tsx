import { Layers } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  iconClassName?: string;
}

/** The DevStash icon: a white Layers icon on a rounded snippet → prompt gradient tile. */
export function LogoMark({ className, iconClassName }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7.5 shrink-0 place-items-center rounded-lg bg-linear-135 from-type-snippet to-type-prompt text-white",
        className,
      )}
    >
      <Layers className={cn("size-4.5", iconClassName)} />
    </span>
  );
}
