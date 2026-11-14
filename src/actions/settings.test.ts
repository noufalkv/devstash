import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateEditorPreferences: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/users", () => ({ updateEditorPreferences: mocks.updateEditorPreferences }));

import { updateEditorPreferences } from "./settings";

const preferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  theme: "github-dark",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.updateEditorPreferences.mockResolvedValue(preferences);
});

describe("updateEditorPreferences", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await updateEditorPreferences(preferences)).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.updateEditorPreferences).not.toHaveBeenCalled();
  });

  it("rejects an invalid value", async () => {
    const result = await updateEditorPreferences({ ...preferences, theme: "light" });

    expect(result).toEqual({ success: false, error: "Invalid theme" });
    expect(mocks.updateEditorPreferences).not.toHaveBeenCalled();
  });

  it("rejects a partial update", async () => {
    const result = await updateEditorPreferences({ fontSize: 14 });

    expect(result.success).toBe(false);
    expect(mocks.updateEditorPreferences).not.toHaveBeenCalled();
  });

  it("saves the preferences for the signed-in user without extra keys", async () => {
    const result = await updateEditorPreferences({ ...preferences, extra: "x" });

    expect(mocks.updateEditorPreferences).toHaveBeenCalledWith("u1", preferences);
    expect(result).toEqual({ success: true, data: preferences });
  });

  it("reports a missing account", async () => {
    mocks.updateEditorPreferences.mockResolvedValue(null);

    expect(await updateEditorPreferences(preferences)).toEqual({
      success: false,
      error: "Account not found",
    });
  });

  it("returns a generic error when the database fails", async () => {
    mocks.updateEditorPreferences.mockRejectedValue(new Error("db down"));

    expect(await updateEditorPreferences(preferences)).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
