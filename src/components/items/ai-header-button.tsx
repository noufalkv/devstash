"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";

import { useAiAccess } from "@/components/items/ai-access-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const HEADER_BUTTON =
  "inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

const PRO_REQUIRED = "AI features require Pro subscription";

/** Sparkles button for Pro users, a Crown with a tooltip for free users, nothing until the plan is known. */
export function AiHeaderButton({
  label,
  isPending,
  onClick,
}: {
  label: string;
  isPending: boolean;
  onClick: () => void;
}) {
  const access = useAiAccess();
  if (access === "unknown") return null;

  if (access === "locked") {
    return (
      <Tooltip>
        <TooltipTrigger
          aria-label={PRO_REQUIRED}
          className={cn(HEADER_BUTTON, "text-amber-400 hover:text-amber-300")}
        >
          <Crown className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{PRO_REQUIRED}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={label}
      title={label}
      className={HEADER_BUTTON}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
    </button>
  );
}

/** Small header tabs that switch an editor box between views, e.g. Code / Explain. */
export function EditorViewTabs<T extends string>({
  views,
  view,
  onChange,
  label,
}: {
  views: readonly T[];
  view: T;
  onChange: (view: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" role="tablist" aria-label={label}>
      {views.map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={view === name}
          onClick={() => onChange(name)}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium capitalize transition-colors",
            view === name
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
