"use client";

import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Textarea } from "@/components/ui/textarea";
import { CODE_EDITOR_TYPES, MARKDOWN_EDITOR_TYPES } from "@/lib/item-fields";
import { cn } from "@/lib/utils";

type ItemContentFieldProps = {
  /** Item type name; picks the code editor, markdown editor or plain text. */
  typeName: string;
  value: string;
  language?: string | null;
  id?: string;
  /** Extra classes for the plain-text Textarea fallback. */
  textareaClassName?: string;
} & (
  | { readOnly: true; onChange?: never }
  | { readOnly?: false; onChange: (value: string) => void }
);

/** Item content shown in the editor that suits its type: Monaco for code, Markdown for notes and prompts, plain text otherwise. */
export function ItemContentField({
  typeName,
  value,
  language,
  id,
  textareaClassName,
  readOnly,
  onChange,
}: ItemContentFieldProps) {
  if (CODE_EDITOR_TYPES.has(typeName)) {
    return (
      <CodeEditor
        value={value}
        onChange={onChange}
        language={language}
        readOnly={readOnly}
      />
    );
  }

  if (MARKDOWN_EDITOR_TYPES.has(typeName)) {
    return (
      <MarkdownEditor
        id={id}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    );
  }

  if (readOnly) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre">
        {value}
      </pre>
    );
  }

  return (
    <Textarea
      id={id}
      className={cn("font-mono text-xs", textareaClassName)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
