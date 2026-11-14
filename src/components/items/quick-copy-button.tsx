"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface QuickCopyButtonProps {
  text: string;
  title: string;
}

export function QuickCopyButton({ text, title }: QuickCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Copy ${title}`}
      title="Copy"
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className="-my-1 shrink-0 text-muted-foreground transition-opacity hover:text-foreground pointer-fine:opacity-0 pointer-fine:group-hover/item:opacity-100 pointer-fine:group-focus-within/item:opacity-100"
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  );
}
