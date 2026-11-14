import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, findMany } = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create, findMany } },
}));

import {
  createCollection,
  findOwnedCollectionIds,
  getCollectionOptions,
} from "@/lib/db/collections";

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
