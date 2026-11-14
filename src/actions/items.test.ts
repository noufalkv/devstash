import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createItem: vi.fn(),
  getItemFile: vi.fn(),
  deleteFromR2: vi.fn(),
  findOwnedCollectionIds: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/items", () => ({
  updateItem: mocks.updateItem,
  deleteItem: mocks.deleteItem,
  createItem: mocks.createItem,
  getItemFile: mocks.getItemFile,
}));
vi.mock("@/lib/db/collections", () => ({
  findOwnedCollectionIds: mocks.findOwnedCollectionIds,
}));
vi.mock("@/lib/r2", () => ({
  deleteFromR2: mocks.deleteFromR2,
  isOwnedKey: (userId: string, key: string) => key.startsWith(`${userId}/`),
}));

import { createItem, deleteItem, updateItem } from "./items";

const validData = {
  title: "  useAuth Hook  ",
  description: "Custom auth hook",
  content: "const a = 1;",
  url: null,
  language: "typescript",
  tags: [" react ", "auth", "auth", ""],
};

const updatedItem = { id: "item-1", title: "useAuth Hook" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.updateItem.mockResolvedValue(updatedItem);
  mocks.getItemFile.mockResolvedValue(null);
  mocks.deleteFromR2.mockResolvedValue(undefined);
  // Every collection belongs to u1 except ones prefixed "other-"
  mocks.findOwnedCollectionIds.mockImplementation(
    async (_userId: string, ids: string[]) =>
      ids.filter((id) => !id.startsWith("other-")),
  );
});

describe("updateItem", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await updateItem("item-1", validData)).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("rejects an empty title", async () => {
    const result = await updateItem("item-1", { ...validData, title: "   " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL", async () => {
    const result = await updateItem("item-1", { ...validData, url: "not a url" });

    expect(result).toEqual({ success: false, error: "URL is not valid" });
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("rejects a payload of the wrong shape", async () => {
    const result = await updateItem("item-1", { title: "Hi", tags: "react" });

    expect(result.success).toBe(false);
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("saves normalized data scoped to the signed-in user", async () => {
    const result = await updateItem("item-1", validData);

    expect(result).toEqual({ success: true, data: updatedItem });
    expect(mocks.updateItem).toHaveBeenCalledWith("item-1", "u1", {
      title: "useAuth Hook",
      description: "Custom auth hook",
      content: "const a = 1;",
      url: null,
      language: "typescript",
      tags: ["react", "auth"],
      collectionIds: [],
    });
  });

  it("turns blank optional fields into null", async () => {
    await updateItem("item-1", {
      title: "Link",
      description: "  ",
      content: "",
      url: "https://example.com",
      language: "",
      tags: [],
    });

    expect(mocks.updateItem).toHaveBeenCalledWith("item-1", "u1", {
      title: "Link",
      description: null,
      content: null,
      url: "https://example.com",
      language: null,
      tags: [],
      collectionIds: [],
    });
  });

  it("passes only de-duplicated collection ids the user owns", async () => {
    await updateItem("item-1", {
      ...validData,
      collectionIds: ["col-1", "col-2", "col-1", "other-col"],
    });

    expect(mocks.findOwnedCollectionIds).toHaveBeenCalledWith("u1", [
      "col-1",
      "col-2",
      "other-col",
    ]);
    expect(mocks.updateItem.mock.calls[0][2].collectionIds).toEqual([
      "col-1",
      "col-2",
    ]);
  });

  it("passes an empty list to remove the item from every collection", async () => {
    await updateItem("item-1", { ...validData, collectionIds: [] });

    expect(mocks.updateItem.mock.calls[0][2].collectionIds).toEqual([]);
  });

  it("returns a generic error when the collection lookup fails", async () => {
    mocks.findOwnedCollectionIds.mockRejectedValue(new Error("db down"));

    expect(
      await updateItem("item-1", { ...validData, collectionIds: ["col-1"] }),
    ).toEqual({ success: false, error: "Something went wrong. Please try again." });
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("rejects collection ids of the wrong shape", async () => {
    const result = await updateItem("item-1", { ...validData, collectionIds: [""] });

    expect(result.success).toBe(false);
    expect(mocks.updateItem).not.toHaveBeenCalled();
  });

  it("returns an error when the item is not found or not owned", async () => {
    mocks.updateItem.mockResolvedValue(null);

    expect(await updateItem("item-1", validData)).toEqual({
      success: false,
      error: "Item not found",
    });
  });

  it("returns a generic error when the database throws", async () => {
    mocks.updateItem.mockRejectedValue(new Error("db down"));

    expect(await updateItem("item-1", validData)).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    mocks.deleteItem.mockResolvedValue(true);
  });

  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await deleteItem("item-1")).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.deleteItem).not.toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    expect(await deleteItem("")).toEqual({ success: false, error: "Invalid item" });
    expect(mocks.deleteItem).not.toHaveBeenCalled();
  });

  it("deletes the item scoped to the signed-in user", async () => {
    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(mocks.deleteItem).toHaveBeenCalledWith("item-1", "u1");
  });

  it("reports an item that was not found", async () => {
    mocks.deleteItem.mockResolvedValue(false);

    expect(await deleteItem("item-1")).toEqual({
      success: false,
      error: "Item not found",
    });
  });

  it("returns a friendly error on unexpected failure", async () => {
    mocks.deleteItem.mockRejectedValue(new Error("db down"));

    expect(await deleteItem("item-1")).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createItem", () => {
  const snippet = {
    type: "snippet",
    title: "  useAuth Hook  ",
    description: " ",
    content: "const a = 1;",
    language: "typescript",
    url: "",
    tags: [" react ", "auth", "auth", ""],
  };

  beforeEach(() => {
    mocks.createItem.mockResolvedValue(updatedItem);
  });

  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await createItem(snippet)).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects an empty title", async () => {
    const result = await createItem({ ...snippet, title: "   " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects types that cannot be created here", async () => {
    const result = await createItem({ ...snippet, type: "collection" });

    expect(result.success).toBe(false);
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("requires a URL for links", async () => {
    const result = await createItem({ ...snippet, type: "link", url: "  " });

    expect(result).toEqual({ success: false, error: "URL is required" });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects an invalid link URL", async () => {
    const result = await createItem({ ...snippet, type: "link", url: "nope" });

    expect(result).toEqual({ success: false, error: "URL is not valid" });
  });

  it("saves normalized data for the signed-in user", async () => {
    const result = await createItem(snippet);

    expect(result).toEqual({ success: true, data: updatedItem });
    expect(mocks.createItem).toHaveBeenCalledWith("u1", {
      type: "snippet",
      title: "useAuth Hook",
      description: null,
      content: "const a = 1;",
      language: "typescript",
      url: null,
      file: null,
      tags: ["react", "auth"],
      collectionIds: [],
    });
  });

  it("adds the item to the collections the user owns", async () => {
    await createItem({
      ...snippet,
      collectionIds: ["col-1", "other-col", "col-1"],
    });

    expect(mocks.findOwnedCollectionIds).toHaveBeenCalledWith("u1", [
      "col-1",
      "other-col",
    ]);
    expect(mocks.createItem.mock.calls[0][1].collectionIds).toEqual(["col-1"]);
  });

  it("drops fields the type does not use", async () => {
    await createItem({ ...snippet, type: "note" });
    await createItem({
      ...snippet,
      type: "link",
      url: "https://example.com",
    });

    expect(mocks.createItem.mock.calls[0][1]).toMatchObject({
      content: "const a = 1;",
      language: null,
      url: null,
    });
    expect(mocks.createItem.mock.calls[1][1]).toMatchObject({
      content: null,
      language: null,
      url: "https://example.com",
    });
  });

  it("reports an unknown item type", async () => {
    mocks.createItem.mockResolvedValue(null);

    expect(await createItem(snippet)).toEqual({
      success: false,
      error: "Unknown item type",
    });
  });

  it("returns a friendly error on unexpected failure", async () => {
    mocks.createItem.mockRejectedValue(new Error("db down"));

    expect(await createItem(snippet)).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createItem with files", () => {
  const upload = {
    type: "file",
    title: "Spec",
    description: "",
    content: "ignored",
    language: "",
    url: "",
    tags: [],
  };
  const file = { key: "u1/abc-spec.pdf", name: "spec.pdf", size: 1024 };

  beforeEach(() => {
    mocks.createItem.mockResolvedValue(updatedItem);
  });

  it("passes the uploaded file and drops text fields", async () => {
    const result = await createItem({ ...upload, file });

    expect(result.success).toBe(true);
    expect(mocks.createItem).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: "file", content: null, file }),
    );
  });

  it("requires an uploaded file", async () => {
    const result = await createItem(upload);

    expect(result).toEqual({ success: false, error: "Upload a file first" });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects a file key that belongs to another user", async () => {
    const result = await createItem({
      ...upload,
      file: { ...file, key: "u2/abc-spec.pdf" },
    });

    expect(result).toEqual({ success: false, error: "Invalid file" });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects a disallowed extension", async () => {
    const result = await createItem({
      ...upload,
      file: { ...file, name: "run.exe" },
    });

    expect(result.success).toBe(false);
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("rejects an image over 5 MB", async () => {
    const result = await createItem({
      ...upload,
      type: "image",
      file: { key: "u1/abc-a.png", name: "a.png", size: 6 * 1024 * 1024 },
    });

    expect(result.success).toBe(false);
    expect(mocks.createItem).not.toHaveBeenCalled();
  });
});

describe("deleteItem with files", () => {
  beforeEach(() => {
    mocks.deleteItem.mockResolvedValue(true);
  });

  it("deletes the file from R2 after the item", async () => {
    mocks.getItemFile.mockResolvedValue({ key: "u1/abc-spec.pdf", name: "spec.pdf" });

    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(mocks.deleteFromR2).toHaveBeenCalledWith("u1/abc-spec.pdf");
  });

  it("does not touch R2 for items without a file", async () => {
    await deleteItem("item-1");

    expect(mocks.deleteFromR2).not.toHaveBeenCalled();
  });

  it("keeps the file when the item was not deleted", async () => {
    mocks.getItemFile.mockResolvedValue({ key: "u1/abc-spec.pdf", name: "spec.pdf" });
    mocks.deleteItem.mockResolvedValue(false);

    expect(await deleteItem("item-1")).toEqual({ success: false, error: "Item not found" });
    expect(mocks.deleteFromR2).not.toHaveBeenCalled();
  });

  it("still succeeds when the R2 cleanup fails", async () => {
    mocks.getItemFile.mockResolvedValue({ key: "u1/abc-spec.pdf", name: "spec.pdf" });
    mocks.deleteFromR2.mockRejectedValue(new Error("r2 down"));

    expect(await deleteItem("item-1")).toEqual({ success: true });
  });
});
