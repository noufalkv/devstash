import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollection: vi.fn(),
  getCollectionOptions: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: mocks.createCollection,
  getCollectionOptions: mocks.getCollectionOptions,
}));

import { createCollection, listCollectionOptions } from "./collections";

const created = {
  id: "col-1",
  name: "React Patterns",
  description: null,
  isFavorite: false,
  itemCount: 0,
  itemTypes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.createCollection.mockResolvedValue(created);
});

describe("createCollection", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await createCollection({ name: "React Patterns" })).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.createCollection).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const result = await createCollection({ name: "   ", description: "x" });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mocks.createCollection).not.toHaveBeenCalled();
  });

  it("rejects a missing name", async () => {
    const result = await createCollection({ description: "x" });

    expect(result.success).toBe(false);
    expect(mocks.createCollection).not.toHaveBeenCalled();
  });

  it("trims fields and creates the collection for the signed-in user", async () => {
    const result = await createCollection({
      name: "  React Patterns  ",
      description: "  Hooks and components  ",
    });

    expect(mocks.createCollection).toHaveBeenCalledWith("u1", {
      name: "React Patterns",
      description: "Hooks and components",
    });
    expect(result).toEqual({ success: true, data: created });
  });

  it("turns a blank description into null", async () => {
    await createCollection({ name: "React Patterns", description: "   " });

    expect(mocks.createCollection).toHaveBeenCalledWith("u1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns a friendly error when the database fails", async () => {
    mocks.createCollection.mockRejectedValue(new Error("db down"));

    expect(await createCollection({ name: "React Patterns" })).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("listCollectionOptions", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await listCollectionOptions()).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.getCollectionOptions).not.toHaveBeenCalled();
  });

  it("returns the signed-in user's collections", async () => {
    const options = [{ id: "col-1", name: "React Patterns" }];
    mocks.getCollectionOptions.mockResolvedValue(options);

    expect(await listCollectionOptions()).toEqual({ success: true, data: options });
    expect(mocks.getCollectionOptions).toHaveBeenCalledWith("u1");
  });

  it("returns an error when the database throws", async () => {
    mocks.getCollectionOptions.mockRejectedValue(new Error("db down"));

    expect(await listCollectionOptions()).toEqual({
      success: false,
      error: "Could not load collections",
    });
  });
});
