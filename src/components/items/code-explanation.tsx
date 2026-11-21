"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAiAccess } from "@/components/items/ai-access-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type CodeEditorView = "code" | "explain";

const HEADER_BUTTON =
  "inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

const PRO_REQUIRED = "AI features require Pro subscription";
const EXPLAIN_LABEL = "Explain code with AI";

/** Sparkles button for Pro users, a Crown with a tooltip for free users, nothing until the plan is known. */
export function ExplainButton({
  isPending,
  onExplain,
}: {
  isPending: boolean;
  onExplain: () => void;
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
      onClick={onExplain}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={EXPLAIN_LABEL}
      title={EXPLAIN_LABEL}
      className={HEADER_BUTTON}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
    </button>
  );
}

export function CodeEditorTabs({
  view,
  onChange,
}: {
  view: CodeEditorView;
  onChange: (view: CodeEditorView) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="tablist" aria-label="Code view">
      {(["code", "explain"] as const).map((name) => (
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

export function CodeExplanation({ explanation }: { explanation: string }) {
  return (
    <div className="markdown-preview editor-scrollbar max-h-100 min-h-20 overflow-y-auto p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
    </div>
  );
}
