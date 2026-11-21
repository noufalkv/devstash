"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai";
import { updateItemContent } from "@/actions/items";
import { AiHeaderButton, EditorViewTabs } from "@/components/items/ai-header-button";
import { Button } from "@/components/ui/button";
import type { PromptOptimization } from "@/lib/ai-optimize";

export type PromptView = "original" | "optimized";

const PROMPT_VIEWS = ["original", "optimized"] as const;

/** Saved content, serialized for the client (the drawer keeps dates as ISO strings). */
export interface SavedPromptContent {
  content: string;
  updatedAt: string;
}

/**
 * Optimize → review → accept or discard flow for one saved prompt. The result is kept per
 * item id, since the drawer reuses the editor, and late results for another item are dropped.
 */
export function usePromptOptimization(
  itemId: string | undefined,
  onSaved?: (saved: SavedPromptContent) => void,
) {
  const router = useRouter();
  const [optimization, setOptimization] = useState<
    { itemId: string; result: PromptOptimization } | null
  >(null);
  const [view, setView] = useState<PromptView>("original");
  const [isOptimizing, startOptimizing] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const latestItemId = useRef(itemId);

  useEffect(() => {
    latestItemId.current = itemId;
  }, [itemId]);

  const result = itemId && optimization?.itemId === itemId ? optimization.result : null;
  const activeView: PromptView = result ? view : "original";

  function optimize() {
    if (!itemId) return;
    startOptimizing(async () => {
      const response = await optimizePrompt({ itemId });
      if (latestItemId.current !== itemId) return;
      if (!response.success || !response.data) {
        toast.error(response.error ?? "Could not optimize this prompt");
        return;
      }
      setOptimization({ itemId, result: response.data });
      setView("optimized");
    });
  }

  function discard() {
    setOptimization(null);
    setView("original");
  }

  function accept() {
    if (!itemId || !result) return;
    startSaving(async () => {
      const response = await updateItemContent({ id: itemId, content: result.optimized });
      if (!response.success || !response.data) {
        toast.error(response.error ?? "Could not save the optimized prompt");
        return;
      }
      toast.success("Prompt updated");
      router.refresh();
      // The drawer moved to another item while saving; do not write this one into it
      if (latestItemId.current !== itemId) return;
      discard();
      onSaved?.({
        content: response.data.content ?? result.optimized,
        updatedAt: response.data.updatedAt.toISOString(),
      });
    });
  }

  return {
    result,
    view: activeView,
    setView,
    isOptimizing,
    isSaving,
    optimize,
    discard,
    accept,
  };
}

export function OptimizeButton({
  isPending,
  onOptimize,
}: {
  isPending: boolean;
  onOptimize: () => void;
}) {
  return <AiHeaderButton label="Optimize prompt with AI" isPending={isPending} onClick={onOptimize} />;
}

export function PromptViewTabs({
  view,
  onChange,
}: {
  view: PromptView;
  onChange: (view: PromptView) => void;
}) {
  return <EditorViewTabs views={PROMPT_VIEWS} view={view} onChange={onChange} label="Prompt view" />;
}

/** The optimized prompt with a note on what changed and the choice to use it or not. */
export function PromptOptimizationPanel({
  result,
  isSaving,
  onAccept,
  onDiscard,
}: {
  result: PromptOptimization;
  isSaving: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col">
      {result.changes && (
        <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
          {result.changes}
        </p>
      )}
      {!result.unchanged && (
        <div className="markdown-preview editor-scrollbar max-h-100 min-h-20 overflow-y-auto p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.optimized}</ReactMarkdown>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-3 py-2">
        {result.unchanged ? (
          <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
            Dismiss
          </Button>
        ) : (
          <>
            <span className="mr-auto text-xs text-muted-foreground">Use the optimized prompt?</span>
            <Button type="button" size="sm" variant="ghost" onClick={onDiscard} disabled={isSaving}>
              Discard
            </Button>
            <Button type="button" size="sm" onClick={onAccept} disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
              Use optimized prompt
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
