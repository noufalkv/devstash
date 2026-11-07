import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany, count } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { item: { findFirst, findMany, count } } }));

import {
  getItemDetail,
  getItemStats,
  getItemsByType,
  getPinnedItems,
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
