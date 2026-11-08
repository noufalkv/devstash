import { describe, expect, it } from "vitest";

import { resolveCodeLanguage } from "@/lib/code-language";

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
