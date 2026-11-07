import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { item: { findFirst } } }));

import { DEMO_USER_EMAIL } from "@/lib/db/demo-user";
import { getItemDetail } from "@/lib/db/items";

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

  it("scopes to the signed-in user and the demo user", async () => {
    findFirst.mockResolvedValue(null);

    await getItemDetail("item-1", "user-1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      user: { OR: [{ email: DEMO_USER_EMAIL }, { id: "user-1" }] },
    });
  });

  it("scopes to the demo user only when signed out", async () => {
    findFirst.mockResolvedValue(null);

    await getItemDetail("item-1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      user: { OR: [{ email: DEMO_USER_EMAIL }] },
    });
  });
});
