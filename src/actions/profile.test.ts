import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  signOut: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
  prisma: { user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));

vi.mock("@/auth", () => ({ auth: mocks.auth, signOut: mocks.signOut }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("bcryptjs", () => ({ default: { compare: mocks.compare, hash: mocks.hash } }));

import { changePassword, deleteAccount } from "./profile";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const validPasswords = {
  currentPassword: "oldpassword",
  password: "newpassword1",
  confirmPassword: "newpassword1",
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
});

describe("changePassword", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await changePassword(null, form(validPasswords))).toEqual({
      success: false,
      error: "You must be signed in",
    });
  });

  it("rejects mismatched confirmation", async () => {
    const result = await changePassword(null, form({ ...validPasswords, confirmPassword: "x" }));
    expect(result).toEqual({ success: false, error: "Passwords do not match" });
  });

  it("rejects a password over 72 characters", async () => {
    const long = "a".repeat(73);
    const result = await changePassword(null, form({ ...validPasswords, password: long, confirmPassword: long }));
    expect(result.error).toBe("Password must be at most 72 characters");
  });

  it("rejects accounts without a password", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ password: null });
    const result = await changePassword(null, form(validPasswords));
    expect(result.error).toBe("Password sign-in is not enabled for this account");
  });

  it("rejects a wrong current password without updating", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ password: "hash" });
    mocks.compare.mockResolvedValue(false);
    const result = await changePassword(null, form(validPasswords));
    expect(result.error).toBe("Current password is incorrect");
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it("hashes with cost 12 and saves on success", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ password: "hash" });
    mocks.compare.mockResolvedValue(true);
    mocks.hash.mockResolvedValue("newhash");
    expect(await changePassword(null, form(validPasswords))).toEqual({ success: true });
    expect(mocks.hash).toHaveBeenCalledWith("newpassword1", 12);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { password: "newhash" },
    });
  });

  it("returns a generic error when the database throws", async () => {
    mocks.prisma.user.findUnique.mockRejectedValue(new Error("db down"));
    const result = await changePassword(null, form(validPasswords));
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});

describe("deleteAccount", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await deleteAccount(null, form({ confirmEmail: "a@b.com" }));
    expect(result.error).toBe("You must be signed in");
  });

  it("blocks the demo account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "demo@devstash.io" });
    const result = await deleteAccount(null, form({ confirmEmail: "demo@devstash.io" }));
    expect(result.error).toBe("The demo account can't be deleted");
    expect(mocks.prisma.user.delete).not.toHaveBeenCalled();
  });

  it("requires the typed email to match", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com" });
    const result = await deleteAccount(null, form({ confirmEmail: "other@b.com" }));
    expect(result.error).toBe("The email you typed doesn't match your account");
    expect(mocks.prisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user (case-insensitive match) and signs out", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "A@b.com" });
    const result = await deleteAccount(null, form({ confirmEmail: " a@B.com " }));
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(mocks.signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });
});
