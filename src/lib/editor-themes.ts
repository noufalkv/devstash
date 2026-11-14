import type { Monaco } from "@monaco-editor/react";

import type { EditorTheme } from "@/lib/editor-preferences";

type MonacoThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

export interface EditorThemeDefinition {
  // Name registered with Monaco; prefixed so it never clashes with Monaco's built-in themes.
  monacoName: string;
  // Colors for the wrapper and header around the editor, so the frame matches the theme.
  background: string;
  headerBackground: string;
  data: MonacoThemeData;
}

const SCROLLBAR_COLORS = {
  "scrollbarSlider.background": "#52525b66",
  "scrollbarSlider.hoverBackground": "#71717a99",
  "scrollbarSlider.activeBackground": "#a1a1aaaa",
};

export const EDITOR_THEME_DEFINITIONS: Record<EditorTheme, EditorThemeDefinition> = {
  // Monaco's vs-dark, with the darker DevStash background so it matches the markdown editor.
  "vs-dark": {
    monacoName: "devstash-vs-dark",
    background: "#1a1a1d",
    headerBackground: "#232326",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1a1a1d",
        "editor.lineHighlightBackground": "#ffffff0a",
        "editorLineNumber.foreground": "#52525b",
        "editorGutter.background": "#1a1a1d",
        ...SCROLLBAR_COLORS,
      },
    },
  },
  monokai: {
    monacoName: "devstash-monokai",
    background: "#272822",
    headerBackground: "#1e1f1c",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f8f8f2" },
        { token: "comment", foreground: "75715e", fontStyle: "italic" },
        { token: "string", foreground: "e6db74" },
        { token: "number", foreground: "ae81ff" },
        { token: "constant", foreground: "ae81ff" },
        { token: "keyword", foreground: "f92672" },
        { token: "operator", foreground: "f92672" },
        { token: "type", foreground: "66d9ef", fontStyle: "italic" },
        { token: "function", foreground: "a6e22e" },
        { token: "tag", foreground: "f92672" },
        { token: "attribute.name", foreground: "a6e22e" },
        { token: "attribute.value", foreground: "e6db74" },
        { token: "variable", foreground: "f8f8f2" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#3e3d32",
        "editor.selectionBackground": "#49483e",
        "editorCursor.foreground": "#f8f8f0",
        "editorLineNumber.foreground": "#90908a",
        "editorGutter.background": "#272822",
        ...SCROLLBAR_COLORS,
      },
    },
  },
  "github-dark": {
    monacoName: "devstash-github-dark",
    background: "#0d1117",
    headerBackground: "#161b22",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e6edf3" },
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "constant", foreground: "79c0ff" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "operator", foreground: "ff7b72" },
        { token: "type", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" },
        { token: "tag", foreground: "7ee787" },
        { token: "attribute.name", foreground: "79c0ff" },
        { token: "attribute.value", foreground: "a5d6ff" },
        { token: "variable", foreground: "ffa657" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#6e76811a",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#6e7681",
        "editorGutter.background": "#0d1117",
        ...SCROLLBAR_COLORS,
      },
    },
  },
};

export function defineEditorThemes(monaco: Monaco): void {
  for (const theme of Object.values(EDITOR_THEME_DEFINITIONS)) {
    monaco.editor.defineTheme(theme.monacoName, theme.data);
  }
}
