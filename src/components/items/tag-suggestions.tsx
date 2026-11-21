"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";
import { useCanUseAi } from "@/components/items/ai-access-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TagSuggestionsProps {
  type: string;
  title: string;
  content?: string | null;
  /** The comma-separated tags input value. */
  tags: string;
  onTagsChange: (tags: string) => void;
  disabled?: boolean;
}

function splitTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function TagSuggestions({
  type,
  title,
  content,
  tags,
  onTagsChange,
  disabled,
}: TagSuggestionsProps) {
  const canUseAi = useCanUseAi();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  if (!canUseAi) return null;

  function handleSuggest() {
    startTransition(async () => {
      const result = await generateAutoTags({
        type,
        title,
        content,
        existingTags: splitTags(tags),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not suggest tags");
        return;
      }
      setSuggestions(result.data.tags);
    });
  }

  function accept(tag: string) {
    const current = splitTags(tags);
    if (!current.some((existing) => existing.toLowerCase() === tag)) {
      onTagsChange([...current, tag].join(", "));
    }
    setSuggestions((list) => list.filter((item) => item !== tag));
  }

  function reject(tag: string) {
    setSuggestions((list) => list.filter((item) => item !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={handleSuggest}
        disabled={disabled || isPending || title.trim() === ""}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {isPending ? "Suggesting..." : "Suggest Tags"}
      </Button>

      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {suggestions.map((tag) => (
            <li key={tag}>
              <Badge variant="outline" className="h-7 gap-1 pr-1 pl-2.5">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Accept tag ${tag}`}
                  onClick={() => accept(tag)}
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Reject tag ${tag}`}
                  onClick={() => reject(tag)}
                >
                  <X />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
