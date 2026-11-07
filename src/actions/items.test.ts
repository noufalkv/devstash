import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/items", () => ({
  updateItem: mocks.updateItem,
  deleteItem: mocks.deleteItem,
}));

import { deleteItem, updateItem } from "./items";

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
    });
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
