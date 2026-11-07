import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany, count, update, remove } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst, findMany, count, update, delete: remove } },
}));

import {
  getItemDetail,
  getItemStats,
  getItemsByType,
  deleteItem,
  getPinnedItems,
  updateItem,
} from "@/lib/db/items";

const createdAt = new Date("2024-01-15T00:00:00Z");

const row = {
  id: "item-1",
  title: "useAuth Hook",
  description: "Custom auth hook",
  isFavorite: true,
  isPinned: false,
  createdAt,
  updatedAt: createdAt,
  itemType: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
  tags: [{ name: "auth" }, { name: "react" }],
  contentType: "TEXT",
  content: "const a = 1;",
  language: "typescript",
  url: null,
  fileName: null,
  fileSize: null,
  collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
};

describe("getItemDetail", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("flattens tags and collections", async () => {
    findFirst.mockResolvedValue(row);

    const item = await getItemDetail("item-1", "user-1");

    expect(item).toMatchObject({
      id: "item-1",
      content: "const a = 1;",
      language: "typescript",
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });

  it("returns null when the item is not found", async () => {
    findFirst.mockResolvedValue(null);

    await expect(getItemDetail("missing", "user-1")).resolves.toBeNull();
  });

  it("scopes to the signed-in user's own items", async () => {
    findFirst.mockResolvedValue(null);

    await getItemDetail("item-1", "user-1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      userId: "user-1",
    });
  });
});

describe("user scoping", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    count.mockReset().mockResolvedValue(0);
  });

  it("filters pinned items by user id", async () => {
    await getPinnedItems("user-1");

    expect(findMany.mock.calls[0][0].where).toEqual({
      isPinned: true,
      userId: "user-1",
    });
  });

  it("filters items by type and user id", async () => {
    await getItemsByType("user-1", "snippet");

    expect(findMany.mock.calls[0][0].where).toEqual({
      itemType: { name: "snippet" },
      userId: "user-1",
    });
  });

  it("counts only the user's items", async () => {
    await getItemStats("user-1");

    expect(count.mock.calls[0][0].where).toEqual({ userId: "user-1" });
    expect(count.mock.calls[1][0].where).toEqual({
      userId: "user-1",
      isFavorite: true,
    });
  });
});

describe("updateItem", () => {
  const data = {
    title: "useAuth Hook",
    description: null,
    content: "const a = 1;",
    url: null,
    language: "typescript",
    tags: ["auth", "react"],
  };

  beforeEach(() => {
    update.mockReset();
  });

  it("scopes the update to the owner and replaces tags", async () => {
    update.mockResolvedValue(row);

    await updateItem("item-1", "user-1", data);

    const args = update.mock.calls[0][0];
    expect(args.where).toEqual({ id: "item-1", userId: "user-1" });
    expect(args.data.title).toBe("useAuth Hook");
    expect(args.data.tags).toEqual({
      set: [],
      connectOrCreate: [
        { where: { name: "auth" }, create: { name: "auth" } },
        { where: { name: "react" }, create: { name: "react" } },
      ],
    });
  });

  it("returns the flattened updated item", async () => {
    update.mockResolvedValue(row);

    const item = await updateItem("item-1", "user-1", data);

    expect(item).toMatchObject({
      id: "item-1",
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });

  it("returns null when the item is not found or not owned", async () => {
    update.mockRejectedValue({ code: "P2025" });

    await expect(updateItem("item-1", "user-2", data)).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    update.mockRejectedValue(new Error("db down"));

    await expect(updateItem("item-1", "user-1", data)).rejects.toThrow("db down");
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    remove.mockReset();
  });

  it("scopes the delete to the owner", async () => {
    remove.mockResolvedValue(row);

    await expect(deleteItem("item-1", "user-1")).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
  });

  it("returns false when the item is not found or not owned", async () => {
    remove.mockRejectedValue({ code: "P2025" });

    await expect(deleteItem("item-1", "user-2")).resolves.toBe(false);
  });

  it("rethrows other errors", async () => {
    remove.mockRejectedValue(new Error("db down"));

    await expect(deleteItem("item-1", "user-1")).rejects.toThrow("db down");
  });
});
