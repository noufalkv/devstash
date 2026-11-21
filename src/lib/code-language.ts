const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  shellscript: "shell",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  kt: "kotlin",
  ps1: "powershell",
  docker: "dockerfile",
};

export interface CodeLanguageOption {
  /** Monaco language id, also the value stored in `Item.language` */
  value: string;
  label: string;
}

export const DEFAULT_CODE_LANGUAGE = "plaintext";

// Plain text first, then alphabetical by label
export const CODE_LANGUAGE_OPTIONS: readonly CodeLanguageOption[] = [
  { value: DEFAULT_CODE_LANGUAGE, label: "Plain text" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "css", label: "CSS" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "less", label: "Less" },
  { value: "lua", label: "Lua" },
  { value: "markdown", label: "Markdown" },
  { value: "perl", label: "Perl" },
  { value: "php", label: "PHP" },
  { value: "powershell", label: "PowerShell" },
  { value: "python", label: "Python" },
  { value: "r", label: "R" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "shell", label: "Shell" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

const LANGUAGE_LABELS = new Map(
  CODE_LANGUAGE_OPTIONS.map((option) => [option.value, option.label]),
);

// Maps the free-text language field to a Monaco language id
export function resolveCodeLanguage(language: string | null | undefined): string {
  const key = language?.trim().toLowerCase();
  if (!key) return DEFAULT_CODE_LANGUAGE;
  const resolved = LANGUAGE_ALIASES[key] ?? key;
  return LANGUAGE_LABELS.has(resolved) ? resolved : DEFAULT_CODE_LANGUAGE;
}

/** Display label for a language id, e.g. "shell" → "Shell"; "Plain text" for anything unknown */
export function getCodeLanguageLabel(language: string | null | undefined): string {
  return LANGUAGE_LABELS.get(resolveCodeLanguage(language)) ?? "Plain text";
}

/**
 * Canonical value to store for a submitted language: the Monaco id for a known language or alias,
 * `null` for empty or plain text, and `undefined` for an unsupported language.
 */
export function normalizeCodeLanguage(language: string | null | undefined): string | null | undefined {
  const key = language?.trim().toLowerCase();
  if (!key) return null;
  const resolved = LANGUAGE_ALIASES[key] ?? key;
  if (!LANGUAGE_LABELS.has(resolved)) return undefined;
  return resolved === DEFAULT_CODE_LANGUAGE ? null : resolved;
}
