"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useEditorPreferences } from "@/components/settings/editor-preferences-provider";
import { resolveCodeLanguage } from "@/lib/code-language";
import { defineEditorThemes, EDITOR_THEME_DEFINITIONS } from "@/lib/editor-themes";
import { cn } from "@/lib/utils";

type MonacoEditor = Parameters<OnMount>[0];

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;
const VERTICAL_PADDING = 16;
// Keeps the 12px / 19px ratio the editor had before font size became a preference.
const LINE_HEIGHT_RATIO = 1.6;

function estimateHeight(value: string, lineHeight: number): number {
  const lines = value.split("\n").length;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, lines * lineHeight + VERTICAL_PADDING));
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
  const editorRef = useRef<MonacoEditor | null>(null);
  const { preferences } = useEditorPreferences();
  const theme = EDITOR_THEME_DEFINITIONS[preferences.theme];
  const lineHeight = Math.round(preferences.fontSize * LINE_HEIGHT_RATIO);
  const monacoLanguage = resolveCodeLanguage(language);
  const height = Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, contentHeight ?? estimateHeight(value, lineHeight)),
  );

  // Tab size is a model option, so `options` alone does not update it after mount.
  useEffect(() => {
    editorRef.current?.getModel()?.updateOptions({ tabSize: preferences.tabSize });
  }, [preferences.tabSize]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.getModel()?.updateOptions({ tabSize: preferences.tabSize });
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
        "overflow-hidden rounded-lg border border-border bg-(--editor-bg)",
        className,
      )}
      style={
        {
          "--editor-bg": theme.background,
          "--editor-header-bg": theme.headerBackground,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between border-b border-border bg-(--editor-header-bg) px-3 py-2">
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
        theme={theme.monacoName}
        beforeMount={defineEditorThemes}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<div className="h-full w-full animate-pulse bg-muted" />}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: preferences.minimap },
          fontSize: preferences.fontSize,
          lineHeight,
          wordWrap: preferences.wordWrap ? "on" : "off",
          tabSize: preferences.tabSize,
          detectIndentation: false,
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
