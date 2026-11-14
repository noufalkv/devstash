import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns the defaults for a missing value", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults for values that are not objects", () => {
    expect(parseEditorPreferences("vs-dark")).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences([14])).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps every valid stored field", () => {
    const stored = { fontSize: 16, tabSize: 2, wordWrap: false, minimap: true, theme: "monokai" };

    expect(parseEditorPreferences(stored)).toEqual(stored);
  });

  it("uses the default for each missing or invalid field", () => {
    expect(
      parseEditorPreferences({ fontSize: 15, tabSize: 8, minimap: "yes", theme: "solarized" }),
    ).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, tabSize: 8 });
  });

  it("drops unknown keys", () => {
    expect(parseEditorPreferences({ fontSize: 14, extra: true })).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 14,
    });
  });

  it("does not share the defaults object", () => {
    const result = parseEditorPreferences(null);
    result.fontSize = 20;

    expect(DEFAULT_EDITOR_PREFERENCES.fontSize).toBe(12);
  });
});

describe("editorPreferencesSchema", () => {
  it("accepts the defaults", () => {
    expect(editorPreferencesSchema.safeParse(DEFAULT_EDITOR_PREFERENCES).success).toBe(true);
  });

  it.each([
    ["fontSize", 15],
    ["tabSize", 3],
    ["wordWrap", "on"],
    ["minimap", 1],
    ["theme", "light"],
  ])("rejects an invalid %s", (key, value) => {
    expect(
      editorPreferencesSchema.safeParse({ ...DEFAULT_EDITOR_PREFERENCES, [key]: value }).success,
    ).toBe(false);
  });

  it("rejects a partial object", () => {
    expect(editorPreferencesSchema.safeParse({ fontSize: 14 }).success).toBe(false);
  });
});
