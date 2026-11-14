import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique, update } } }));

import { getEditorPreferences, updateEditorPreferences } from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

const preferences = {
  fontSize: 16,
  tabSize: 8,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
});

describe("getEditorPreferences", () => {
  it("reads the signed-in user's stored preferences", async () => {
    findUnique.mockResolvedValue({ editorPreferences: preferences });

    expect(await getEditorPreferences("u1")).toEqual(preferences);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when nothing is stored", async () => {
    findUnique.mockResolvedValue({ editorPreferences: null });

    expect(await getEditorPreferences("u1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults when the user does not exist", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getEditorPreferences("u1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  it("writes the preferences to the user's row", async () => {
    update.mockResolvedValue({ editorPreferences: preferences });

    expect(await updateEditorPreferences("u1", preferences)).toEqual(preferences);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { editorPreferences: preferences },
      select: { editorPreferences: true },
    });
  });

  it("returns null when the user does not exist", async () => {
    update.mockRejectedValue(notFound);

    expect(await updateEditorPreferences("u1", preferences)).toBeNull();
  });

  it("rethrows other errors", async () => {
    update.mockRejectedValue(new Error("db down"));

    await expect(updateEditorPreferences("u1", preferences)).rejects.toThrow("db down");
  });
});
