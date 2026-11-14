import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, findFirst, findMany, update, remove } = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create, findFirst, findMany, update, delete: remove } },
}));

import {
  createCollection,
  deleteCollection,
  findOwnedCollectionIds,
  getAllCollections,
  getCollection,
  getCollectionOptions,
  updateCollection,
} from "@/lib/db/collections";

const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });

describe("getAllCollections", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("returns every user collection with item type counts", async () => {
    const snippet = { id: "t-1", name: "snippet", icon: "Code", color: "#3b82f6" };
    const link = { id: "t-2", name: "link", icon: "Link", color: "#10b981" };
    findMany.mockResolvedValue([
      {
        id: "col-1",
        name: "React",
        description: null,
        isFavorite: false,
        items: [
          { item: { itemType: link } },
          { item: { itemType: snippet } },
          { item: { itemType: snippet } },
        ],
      },
    ]);

    await expect(getAllCollections("user-1")).resolves.toEqual([
      {
        id: "col-1",
        name: "React",
        description: null,
        isFavorite: false,
        itemCount: 3,
        itemTypes: [
          { ...snippet, count: 2 },
          { ...link, count: 1 },
        ],
      },
    ]);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1" });
    expect(args.take).toBeUndefined();
  });
});

describe("getCollection", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("looks the collection up by id and owner", async () => {
    const collection = {
      id: "col-1",
      name: "React",
      description: "Hooks",
      isFavorite: true,
    };
    findFirst.mockResolvedValue(collection);

    await expect(getCollection("user-1", "col-1")).resolves.toEqual(collection);
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: "col-1", userId: "user-1" });
  });

  it("returns null when the user does not own the collection", async () => {
    findFirst.mockResolvedValue(null);

    await expect(getCollection("user-1", "col-other")).resolves.toBeNull();
  });
});

describe("getCollectionOptions", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("lists the user's collections by name", async () => {
    const options = [{ id: "col-1", name: "React Patterns" }];
    findMany.mockResolvedValue(options);

    await expect(getCollectionOptions("user-1")).resolves.toEqual(options);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});

describe("findOwnedCollectionIds", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("returns only the ids owned by the user", async () => {
    findMany.mockResolvedValue([{ id: "col-1" }]);

    await expect(
      findOwnedCollectionIds("user-1", ["col-1", "col-other"]),
    ).resolves.toEqual(["col-1"]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "col-other"] } },
      select: { id: true },
    });
  });

  it("skips the query for an empty list", async () => {
    await expect(findOwnedCollectionIds("user-1", [])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("createCollection", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("creates the collection for the given user", async () => {
    create.mockResolvedValue({
      id: "col-1",
      name: "React Patterns",
      description: "Hooks",
      isFavorite: false,
    });

    await createCollection("user-1", { name: "React Patterns", description: "Hooks" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: "user-1", name: "React Patterns", description: "Hooks" },
      }),
    );
  });

  it("returns an empty collection summary", async () => {
    create.mockResolvedValue({
      id: "col-1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
    });

    await expect(
      createCollection("user-1", { name: "React Patterns", description: null }),
    ).resolves.toEqual({
      id: "col-1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
      itemCount: 0,
      itemTypes: [],
    });
  });
});

describe("updateCollection", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("updates the collection scoped to its owner", async () => {
    const updated = { id: "col-1", name: "Hooks", description: null, isFavorite: false };
    update.mockResolvedValue(updated);

    await expect(
      updateCollection("user-1", "col-1", { name: "Hooks", description: null }),
    ).resolves.toEqual(updated);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "col-1", userId: "user-1" },
        data: { name: "Hooks", description: null },
      }),
    );
  });

  it("returns null when the collection is missing or not owned", async () => {
    update.mockRejectedValue(notFound);

    await expect(
      updateCollection("user-1", "col-other", { name: "Hooks", description: null }),
    ).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    update.mockRejectedValue(new Error("db down"));

    await expect(
      updateCollection("user-1", "col-1", { name: "Hooks", description: null }),
    ).rejects.toThrow("db down");
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    remove.mockReset();
  });

  it("deletes only the collection, scoped to its owner", async () => {
    remove.mockResolvedValue({});

    await expect(deleteCollection("user-1", "col-1")).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith({ where: { id: "col-1", userId: "user-1" } });
  });

  it("returns false when the collection is missing or not owned", async () => {
    remove.mockRejectedValue(notFound);

    await expect(deleteCollection("user-1", "col-other")).resolves.toBe(false);
  });

  it("rethrows other errors", async () => {
    remove.mockRejectedValue(new Error("db down"));

    await expect(deleteCollection("user-1", "col-1")).rejects.toThrow("db down");
  });
});
