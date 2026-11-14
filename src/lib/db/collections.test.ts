import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create } },
}));

import { createCollection } from "@/lib/db/collections";

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
