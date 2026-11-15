import { describe, expect, it } from "vitest";

import type { FavoriteCollection } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import { sortFavoriteCollections, sortFavoriteItems } from "@/lib/favorites-sort";

function type(name: string) {
  return { id: `t-${name}`, name, icon: "Code", color: "#000000" };
}

function item(id: string, title: string, typeName: string, day: number): FavoriteItem {
  return {
    id,
    title,
    updatedAt: new Date(Date.UTC(2026, 10, day)),
    itemType: type(typeName),
  };
}

function collection(
  id: string,
  name: string,
  typeName: string | null,
  day: number,
): FavoriteCollection {
  return {
    id,
    name,
    updatedAt: new Date(Date.UTC(2026, 10, day)),
    itemCount: typeName ? 1 : 0,
    topItemType: typeName ? { ...type(typeName), count: 1 } : null,
  };
}

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe("sortFavoriteItems", () => {
  const items = [
    item("a", "useAuth hook", "snippet", 3),
    item("b", "Docker docs", "link", 9),
    item("c", "commit message prompt", "prompt", 5),
    item("d", "Kill port", "command", 7),
    item("e", "Zod schema", "snippet", 1),
  ];

  it("sorts by name A–Z, ignoring case", () => {
    expect(ids(sortFavoriteItems(items, "name"))).toEqual(["c", "b", "d", "a", "e"]);
  });

  it("sorts by date, newest first", () => {
    expect(ids(sortFavoriteItems(items, "date"))).toEqual(["b", "d", "c", "a", "e"]);
  });

  it("sorts by type in sidebar order, then by name", () => {
    expect(ids(sortFavoriteItems(items, "type"))).toEqual(["a", "e", "c", "d", "b"]);
  });

  it("puts unknown types after the system types", () => {
    const withCustom = [item("x", "Custom", "recipe", 1), item("y", "Link", "link", 1)];

    expect(ids(sortFavoriteItems(withCustom, "type"))).toEqual(["y", "x"]);
  });

  it("breaks date ties by name, then id", () => {
    const tied = [
      item("2", "beta", "note", 4),
      item("3", "Alpha", "note", 4),
      item("1", "beta", "note", 4),
    ];

    expect(ids(sortFavoriteItems(tied, "date"))).toEqual(["3", "1", "2"]);
  });

  it("does not change the input array", () => {
    const before = ids(items);

    sortFavoriteItems(items, "name");

    expect(ids(items)).toEqual(before);
  });
});

describe("sortFavoriteCollections", () => {
  const collections = [
    collection("a", "React Patterns", "snippet", 2),
    collection("b", "empty one", null, 8),
    collection("c", "AI Workflows", "prompt", 4),
    collection("d", "DevOps", "command", 6),
  ];

  it("sorts by name A–Z, ignoring case", () => {
    expect(ids(sortFavoriteCollections(collections, "name"))).toEqual(["c", "d", "b", "a"]);
  });

  it("sorts by date, newest first", () => {
    expect(ids(sortFavoriteCollections(collections, "date"))).toEqual(["b", "d", "c", "a"]);
  });

  it("sorts by most-used type with empty collections last", () => {
    expect(ids(sortFavoriteCollections(collections, "type"))).toEqual(["a", "c", "d", "b"]);
  });
});
