"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AiHeaderButton, EditorViewTabs } from "@/components/items/ai-header-button";

export type CodeEditorView = "code" | "explain";

const CODE_VIEWS = ["code", "explain"] as const;

export function ExplainButton({
  isPending,
  onExplain,
}: {
  isPending: boolean;
  onExplain: () => void;
}) {
  return <AiHeaderButton label="Explain code with AI" isPending={isPending} onClick={onExplain} />;
}

export function CodeEditorTabs({
  view,
  onChange,
}: {
  view: CodeEditorView;
  onChange: (view: CodeEditorView) => void;
}) {
  return <EditorViewTabs views={CODE_VIEWS} view={view} onChange={onChange} label="Code view" />;
}

export function CodeExplanation({ explanation }: { explanation: string }) {
  return (
    <div className="markdown-preview editor-scrollbar max-h-100 min-h-20 overflow-y-auto p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
    </div>
  );
}
