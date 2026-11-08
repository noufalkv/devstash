"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { resolveCodeLanguage } from "@/lib/code-language";
import { cn } from "@/lib/utils";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;
const LINE_HEIGHT = 19;
const VERTICAL_PADDING = 16;
const THEME_NAME = "devstash-dark";

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1a1a1d",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editorLineNumber.foreground": "#52525b",
      "editorGutter.background": "#1a1a1d",
      "scrollbarSlider.background": "#52525b66",
      "scrollbarSlider.hoverBackground": "#71717a99",
      "scrollbarSlider.activeBackground": "#a1a1aaaa",
    },
  });
};

function estimateHeight(value: string): number {
  const lines = value.split("\n").length;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, lines * LINE_HEIGHT + VERTICAL_PADDING));
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const monacoLanguage = resolveCodeLanguage(language);
  const height = Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, contentHeight ?? estimateHeight(value)),
  );

  const handleMount: OnMount = (editor) => {
    const update = () =>
      setContentHeight(editor.getContentHeight());
    update();
    editor.onDidContentSizeChange(update);
  };

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
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{monacoLanguage}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        theme={THEME_NAME}
        beforeMount={defineTheme}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<div className="h-full w-full animate-pulse bg-muted" />}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 12,
          lineHeight: LINE_HEIGHT,
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: readOnly ? "none" : "line",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
            alwaysConsumeMouseWheel: false,
          },
        }}
      />
    </div>
  );
}
