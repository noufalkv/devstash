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

const MONACO_LANGUAGES = new Set([
  "javascript",
  "typescript",
  "python",
  "ruby",
  "rust",
  "go",
  "shell",
  "yaml",
  "markdown",
  "json",
  "html",
  "css",
  "scss",
  "less",
  "sql",
  "java",
  "kotlin",
  "swift",
  "php",
  "c",
  "cpp",
  "csharp",
  "powershell",
  "dockerfile",
  "xml",
  "graphql",
  "lua",
  "r",
  "perl",
  "plaintext",
]);

export const DEFAULT_CODE_LANGUAGE = "plaintext";

// Maps the free-text language field to a Monaco language id
export function resolveCodeLanguage(language: string | null | undefined): string {
  const key = language?.trim().toLowerCase();
  if (!key) return DEFAULT_CODE_LANGUAGE;
  const resolved = LANGUAGE_ALIASES[key] ?? key;
  return MONACO_LANGUAGES.has(resolved) ? resolved : DEFAULT_CODE_LANGUAGE;
}
