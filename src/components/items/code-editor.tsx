"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai";
import {
  CodeEditorTabs,
  type CodeEditorView,
  CodeExplanation,
  ExplainButton,
} from "@/components/items/code-explanation";
import { useEditorPreferences } from "@/components/settings/editor-preferences-provider";
import { getCodeLanguageLabel, resolveCodeLanguage } from "@/lib/code-language";
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
  explainItemId,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  /** Shows the AI Explain button for this saved item (item drawer read view only). */
  explainItemId?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const [explanation, setExplanation] = useState<{ itemId: string; text: string } | null>(null);
  const [view, setView] = useState<CodeEditorView>("code");
  const [isExplaining, startExplaining] = useTransition();
  const latestItemId = useRef(explainItemId);
  // Only show an explanation for the current item, since the drawer reuses this editor
  const explanationText =
    explainItemId && explanation?.itemId === explainItemId ? explanation.text : null;
  const activeView: CodeEditorView = explanationText ? view : "code";
  const { preferences } = useEditorPreferences();
  const theme = EDITOR_THEME_DEFINITIONS[preferences.theme];
  const lineHeight = Math.round(preferences.fontSize * LINE_HEIGHT_RATIO);
  const monacoLanguage = resolveCodeLanguage(language);
  const height = Math.min(
    MAX_HEIGHT,
    Math.max(MIN_HEIGHT, contentHeight ?? estimateHeight(value, lineHeight)),
  );

  useEffect(() => {
    latestItemId.current = explainItemId;
  }, [explainItemId]);

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

  function handleExplain() {
    const itemId = explainItemId;
    if (!itemId) return;
    startExplaining(async () => {
      const result = await explainCode({ itemId });
      // The drawer moved to another item while the request ran
      if (latestItemId.current !== itemId) return;
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not explain this code");
        return;
      }
      setExplanation({ itemId, text: result.data.explanation });
      setView("explain");
    });
  }

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          {explanationText && <CodeEditorTabs view={activeView} onChange={setView} />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{getCodeLanguageLabel(monacoLanguage)}</span>
          {explainItemId && value.trim() && <ExplainButton isPending={isExplaining} onExplain={handleExplain} />}
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
      {activeView === "explain" && explanationText && (
        <CodeExplanation explanation={explanationText} />
      )}
      {/* Hidden rather than unmounted, so switching back keeps the editor */}
      <div className={cn(activeView === "explain" && "hidden")}>
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
    </div>
  );
}
