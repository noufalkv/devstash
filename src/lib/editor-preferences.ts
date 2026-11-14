import { z } from "zod";

export const EDITOR_FONT_SIZES = [12, 13, 14, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export const editorPreferencesSchema = z.object({
  fontSize: z.literal(EDITOR_FONT_SIZES, "Invalid font size"),
  tabSize: z.literal(EDITOR_TAB_SIZES, "Invalid tab size"),
  wordWrap: z.boolean("Invalid word wrap setting"),
  minimap: z.boolean("Invalid minimap setting"),
  theme: z.enum(EDITOR_THEMES, "Invalid theme"),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 4,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

// Reads the stored JSON column, keeping each valid field and using the default for the rest,
// so a missing or malformed value never breaks the editor.
export function parseEditorPreferences(value: unknown): EditorPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...DEFAULT_EDITOR_PREFERENCES };
  }

  const stored = value as Record<string, unknown>;
  const result = { ...DEFAULT_EDITOR_PREFERENCES };
  const fields = editorPreferencesSchema.shape;

  for (const key of Object.keys(fields) as (keyof EditorPreferences)[]) {
    const parsed = fields[key].safeParse(stored[key]);
    if (parsed.success) Object.assign(result, { [key]: parsed.data });
  }
  return result;
}
