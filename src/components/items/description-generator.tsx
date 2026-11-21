"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { generateDescription } from "@/actions/ai";
import { useCanUseAi } from "@/components/items/ai-access-provider";
import { Button } from "@/components/ui/button";

interface DescriptionGeneratorProps {
  type: string;
  title: string;
  /** The text content, link URL or file name, whichever the item has. */
  content?: string | null;
  language?: string | null;
  /** The comma-separated tags input value. */
  tags: string;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

const LABEL = "Generate description with AI";

export function DescriptionGenerator({
  type,
  title,
  content,
  language,
  tags,
  onGenerated,
  disabled,
}: DescriptionGeneratorProps) {
  const canUseAi = useCanUseAi();
  const [isPending, startTransition] = useTransition();

  if (!canUseAi) return null;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateDescription({
        type,
        title,
        content,
        language,
        tags: tags.split(","),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not generate a description");
        return;
      }
      onGenerated(result.data.description);
      toast.success("Description generated");
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={LABEL}
      title={LABEL}
      aria-busy={isPending}
      onClick={handleGenerate}
      disabled={disabled || isPending || title.trim() === ""}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
    </Button>
  );
}
