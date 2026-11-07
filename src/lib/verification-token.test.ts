import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  verificationToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  user: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  checkPasswordResetToken,
  consumePasswordResetToken,
  createPasswordResetToken,
  verifyEmailToken,
} from "./verification-token";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

beforeEach(() => {
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("createPasswordResetToken", () => {
  it("stores only the hash under the prefixed identifier", async () => {
    const token = await createPasswordResetToken("a@b.com");

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(prismaMock.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "password-reset:a@b.com" },
    });
    const { data } = prismaMock.verificationToken.create.mock.calls[0][0];
    expect(data.identifier).toBe("password-reset:a@b.com");
    expect(data.token).toBe(sha256(token));
    expect(data.token).not.toBe(token);
  });
});

describe("consumePasswordResetToken", () => {
  it("is invalid when no record matches", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(null);
    await expect(consumePasswordResetToken("a@b.com", "t")).resolves.toBe("invalid");
  });

  it("is invalid when another request already consumed the token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({ expires: future() });
    prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
    await expect(consumePasswordResetToken("a@b.com", "t")).resolves.toBe("invalid");
  });

  it("is expired for an old token, and still deletes it", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({ expires: past() });
    prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    await expect(consumePasswordResetToken("a@b.com", "t")).resolves.toBe("expired");
  });

  it("is valid for a fresh token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({ expires: future() });
    prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    await expect(consumePasswordResetToken("a@b.com", "t")).resolves.toBe("valid");
  });
});

describe("checkPasswordResetToken", () => {
  it("reports state without deleting the token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce(null);
    expect(await checkPasswordResetToken("a@b.com", "t")).toBe("invalid");
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({ expires: past() });
    expect(await checkPasswordResetToken("a@b.com", "t")).toBe("expired");
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({ expires: future() });
    expect(await checkPasswordResetToken("a@b.com", "t")).toBe("valid");
    expect(prismaMock.verificationToken.deleteMany).not.toHaveBeenCalled();
  });
});

describe("verifyEmailToken", () => {
  it("marks the user verified only for a valid token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({ expires: future() });
    prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    await expect(verifyEmailToken("a@b.com", "t")).resolves.toBe("verified");
    expect(prismaMock.user.update).toHaveBeenCalledOnce();
  });

  it("does not touch the user for an invalid token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(null);
    await expect(verifyEmailToken("a@b.com", "t")).resolves.toBe("invalid");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
