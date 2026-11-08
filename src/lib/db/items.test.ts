import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany, count, update, remove, create, findType } =
  vi.hoisted(() => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    create: vi.fn(),
    findType: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst, findMany, count, update, delete: remove, create },
    itemType: { findFirst: findType },
  },
}));

import {
  createItem,
  getItemDetail,
  getItemFile,
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

describe("createItem", () => {
  const data = {
    type: "snippet",
    title: "useAuth Hook",
    description: null,
    content: "const a = 1;",
    url: null,
    language: "typescript",
    tags: ["auth", "react"],
  };

  beforeEach(() => {
    create.mockReset();
    findType.mockReset();
    findType.mockResolvedValue({ id: "type-1" });
    create.mockResolvedValue(row);
  });

  it("looks up the system type and creates a TEXT item for the user", async () => {
    await createItem("user-1", data);

    expect(findType).toHaveBeenCalledWith({
      where: { name: "snippet", isSystem: true, userId: null },
      select: { id: true },
    });
    const args = create.mock.calls[0][0];
    expect(args.data).toMatchObject({
      title: "useAuth Hook",
      content: "const a = 1;",
      contentType: "TEXT",
      userId: "user-1",
      itemTypeId: "type-1",
    });
    expect(args.data).not.toHaveProperty("type");
    expect(args.data.tags).toEqual({
      connectOrCreate: [
        { where: { name: "auth" }, create: { name: "auth" } },
        { where: { name: "react" }, create: { name: "react" } },
      ],
    });
  });

  it("creates links with the URL content type", async () => {
    await createItem("user-1", {
      ...data,
      type: "link",
      content: null,
      url: "https://example.com",
    });

    expect(create.mock.calls[0][0].data.contentType).toBe("URL");
  });

  it("returns the flattened created item", async () => {
    const item = await createItem("user-1", data);

    expect(item).toMatchObject({
      id: "item-1",
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });

  it("returns null without creating when the type does not exist", async () => {
    findType.mockResolvedValue(null);

    await expect(createItem("user-1", data)).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createItem with a file", () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue(row);
    findType.mockReset().mockResolvedValue({ id: "type-file" });
  });

  it("stores the R2 key and file info as a FILE item", async () => {
    await createItem("user-1", {
      type: "file",
      title: "Spec",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      file: { key: "user-1/abc-spec.pdf", name: "spec.pdf", size: 1024 },
    });

    const args = create.mock.calls[0][0];
    expect(args.data).toMatchObject({
      contentType: "FILE",
      fileUrl: "user-1/abc-spec.pdf",
      fileName: "spec.pdf",
      fileSize: 1024,
    });
    expect(args.data).not.toHaveProperty("file");
  });
});

describe("getItemFile", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("scopes the lookup to the user", async () => {
    findFirst.mockResolvedValue({ fileUrl: "user-1/abc-spec.pdf", fileName: "spec.pdf" });

    expect(await getItemFile("item-1", "user-1")).toEqual({
      key: "user-1/abc-spec.pdf",
      name: "spec.pdf",
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
  });

  it("returns null when the item has no file or is not found", async () => {
    findFirst.mockResolvedValueOnce({ fileUrl: null, fileName: null });
    expect(await getItemFile("item-1", "user-1")).toBeNull();

    findFirst.mockResolvedValueOnce(null);
    expect(await getItemFile("item-2", "user-1")).toBeNull();
  });
});
