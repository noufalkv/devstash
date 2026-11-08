"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type Tab = "write" | "preview";

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  id,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("write");
  const [copied, setCopied] = useState(false);
  const activeTab: Tab = readOnly ? "preview" : tab;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1a1a1d]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-[#232326] px-3 py-2">
        <div className="flex items-center gap-1" role="tablist">
          {readOnly ? (
            <span className="px-2 py-1 text-xs font-medium text-foreground">
              Preview
            </span>
          ) : (
            (["write", "preview"] as const).map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={activeTab === name}
                onClick={() => setTab(name)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  activeTab === name
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {name}
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy markdown"
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {activeTab === "write" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="editor-scrollbar block max-h-100 min-h-30 w-full resize-none bg-transparent p-3 font-mono text-xs leading-relaxed field-sizing-content outline-none"
        />
      ) : (
        <div className="markdown-preview editor-scrollbar max-h-100 min-h-20 overflow-y-auto p-4">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
