import { describe, expect, it } from "vitest";

import {
  CODE_LANGUAGE_OPTIONS,
  getCodeLanguageLabel,
  normalizeCodeLanguage,
  resolveCodeLanguage,
} from "@/lib/code-language";

describe("resolveCodeLanguage", () => {
  it("falls back to plaintext when empty", () => {
    expect(resolveCodeLanguage(null)).toBe("plaintext");
    expect(resolveCodeLanguage(undefined)).toBe("plaintext");
    expect(resolveCodeLanguage("   ")).toBe("plaintext");
  });

  it("maps common aliases to Monaco ids", () => {
    expect(resolveCodeLanguage("ts")).toBe("typescript");
    expect(resolveCodeLanguage("TSX")).toBe("typescript");
    expect(resolveCodeLanguage("py")).toBe("python");
    expect(resolveCodeLanguage("bash")).toBe("shell");
    expect(resolveCodeLanguage("C#")).toBe("csharp");
  });

  it("keeps known Monaco ids as they are", () => {
    expect(resolveCodeLanguage("json")).toBe("json");
    expect(resolveCodeLanguage(" Go ")).toBe("go");
  });

  it("falls back to plaintext for unknown languages", () => {
    expect(resolveCodeLanguage("brainfuck")).toBe("plaintext");
  });
});

describe("CODE_LANGUAGE_OPTIONS", () => {
  it("starts with plain text and has unique values", () => {
    expect(CODE_LANGUAGE_OPTIONS[0]).toEqual({ value: "plaintext", label: "Plain text" });
    const values = CODE_LANGUAGE_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("lists every alias target", () => {
    for (const alias of ["ts", "py", "bash", "yml", "c#", "docker"]) {
      expect(normalizeCodeLanguage(alias)).not.toBeUndefined();
    }
  });
});

describe("getCodeLanguageLabel", () => {
  it("returns the display label for a language or alias", () => {
    expect(getCodeLanguageLabel("shell")).toBe("Shell");
    expect(getCodeLanguageLabel("ts")).toBe("TypeScript");
  });

  it("falls back to Plain text", () => {
    expect(getCodeLanguageLabel(null)).toBe("Plain text");
    expect(getCodeLanguageLabel("brainfuck")).toBe("Plain text");
  });
});

describe("normalizeCodeLanguage", () => {
  it("returns null for empty values and plain text", () => {
    expect(normalizeCodeLanguage(null)).toBeNull();
    expect(normalizeCodeLanguage(undefined)).toBeNull();
    expect(normalizeCodeLanguage("  ")).toBeNull();
    expect(normalizeCodeLanguage("plaintext")).toBeNull();
  });

  it("returns the canonical id for languages and aliases", () => {
    expect(normalizeCodeLanguage("typescript")).toBe("typescript");
    expect(normalizeCodeLanguage(" Bash ")).toBe("shell");
    expect(normalizeCodeLanguage("C++")).toBe("cpp");
  });

  it("returns undefined for unsupported languages", () => {
    expect(normalizeCodeLanguage("brainfuck")).toBeUndefined();
  });
});
