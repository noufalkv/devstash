import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  hash: vi.fn(),
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  isEmailVerificationEnabled: vi.fn(),
  checkRateLimit: vi.fn(),
  createVerificationToken: vi.fn(),
  createPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
}));

// The real next-auth entry imports next/server, which doesn't resolve under Vitest.
vi.mock("next-auth", () => {
  class AuthError extends Error {
    type = "AuthError";
  }
  class CredentialsSignin extends AuthError {
    type = "CredentialsSignin";
    code = "credentials";
  }
  return { AuthError, CredentialsSignin };
});
vi.mock("@/auth", () => ({ signIn: mocks.signIn, signOut: mocks.signOut }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "9.9.9.9" }) }));
vi.mock("bcryptjs", () => ({ default: { hash: mocks.hash } }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));
vi.mock("@/lib/email-verification", () => ({
  isEmailVerificationEnabled: mocks.isEmailVerificationEnabled,
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  checkRateLimit: mocks.checkRateLimit,
}));
vi.mock("@/lib/verification-token", () => ({
  createVerificationToken: mocks.createVerificationToken,
  createPasswordResetToken: mocks.createPasswordResetToken,
  consumePasswordResetToken: mocks.consumePasswordResetToken,
}));

import { AuthError, CredentialsSignin } from "next-auth";
import {
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signInWithCredentials,
} from "./auth";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  mocks.checkRateLimit.mockResolvedValue({ success: true, remaining: 1, reset: 0 });
  mocks.isEmailVerificationEnabled.mockReturnValue(true);
});

describe("signInWithCredentials", () => {
  it("validates the email before anything else", async () => {
    const result = await signInWithCredentials(null, form({ email: "nope", password: "x" }));
    expect(result).toEqual({ success: false, error: "Enter a valid email address" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("rate limits per IP and lowercased email", async () => {
    mocks.checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });
    const result = await signInWithCredentials(null, form({ email: "A@B.com", password: "x" }));
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("login", "9.9.9.9:a@b.com");
    expect(result.rateLimited).toBe(true);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("only passes same-site callback URLs to signIn", async () => {
    mocks.signIn.mockResolvedValue(undefined);
    await signInWithCredentials(null, form({ email: "a@b.com", password: "x", callbackUrl: "//evil.com" }));
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ redirectTo: "/dashboard" }));

    await signInWithCredentials(null, form({ email: "a@b.com", password: "x", callbackUrl: "/items/snippets" }));
    expect(mocks.signIn).toHaveBeenLastCalledWith("credentials", expect.objectContaining({ redirectTo: "/items/snippets" }));
  });

  it("maps bad credentials and unverified emails to friendly messages", async () => {
    mocks.signIn.mockRejectedValueOnce(new CredentialsSignin());
    const bad = await signInWithCredentials(null, form({ email: "a@b.com", password: "x" }));
    expect(bad.error).toBe("Invalid email or password");

    const unverified = Object.assign(new CredentialsSignin(), { code: "email_not_verified" });
    mocks.signIn.mockRejectedValueOnce(unverified);
    const result = await signInWithCredentials(null, form({ email: "a@b.com", password: "x" }));
    expect(result.unverifiedEmail).toBe("a@b.com");

    mocks.signIn.mockRejectedValueOnce(new AuthError());
    const other = await signInWithCredentials(null, form({ email: "a@b.com", password: "x" }));
    expect(other.error).toBe("Something went wrong. Please try again.");
  });

  it("rethrows non-auth errors such as the success redirect", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.signIn.mockRejectedValue(redirect);
    await expect(
      signInWithCredentials(null, form({ email: "a@b.com", password: "x" })),
    ).rejects.toBe(redirect);
  });
});

describe("resendVerification", () => {
  it("rejects an invalid email", async () => {
    expect((await resendVerification("nope")).success).toBe(false);
  });

  it("does nothing when verification is disabled", async () => {
    mocks.isEmailVerificationEnabled.mockReturnValue(false);
    expect(await resendVerification("a@b.com")).toEqual({ success: true });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("succeeds without sending for unknown or already verified users", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    expect(await resendVerification("a@b.com")).toEqual({ success: true });
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com", password: "h", emailVerified: new Date() });
    expect(await resendVerification("a@b.com")).toEqual({ success: true });
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends a fresh token to an unverified user", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com", password: "h", emailVerified: null });
    mocks.createVerificationToken.mockResolvedValue("tok");
    mocks.sendVerificationEmail.mockResolvedValue(true);
    expect(await resendVerification("A@B.com")).toEqual({ success: true });
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith("a@b.com", "tok");
  });

  it("reports a failed send", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com", password: "h", emailVerified: null });
    mocks.createVerificationToken.mockResolvedValue("tok");
    mocks.sendVerificationEmail.mockResolvedValue(false);
    expect((await resendVerification("a@b.com")).error).toBe("Could not send the email. Please try again.");
  });
});

describe("requestPasswordReset", () => {
  it("rejects an invalid email", async () => {
    const result = await requestPasswordReset(null, form({ email: "nope" }));
    expect(result.error).toBe("Enter a valid email address");
  });

  it("reports success without emailing unknown or OAuth-only accounts", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    expect(await requestPasswordReset(null, form({ email: "a@b.com" }))).toEqual({ success: true });
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com", password: null });
    expect(await requestPasswordReset(null, form({ email: "a@b.com" }))).toEqual({ success: true });
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("emails a reset token to a password account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "a@b.com", password: "h" });
    mocks.createPasswordResetToken.mockResolvedValue("tok");
    mocks.sendPasswordResetEmail.mockResolvedValue(true);
    expect(await requestPasswordReset(null, form({ email: "a@b.com" }))).toEqual({ success: true });
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith("a@b.com", "tok");
  });
});

describe("resetPassword", () => {
  const valid = { email: "a@b.com", token: "tok", password: "newpassword1", confirmPassword: "newpassword1" };

  it("rejects mismatched or short passwords", async () => {
    expect((await resetPassword(null, form({ ...valid, confirmPassword: "x" }))).error).toBe("Passwords do not match");
    const short = await resetPassword(null, form({ ...valid, password: "short", confirmPassword: "short" }));
    expect(short.error).toBe("Password must be at least 8 characters");
  });

  it("rejects an invalid or expired token without changing the password", async () => {
    mocks.consumePasswordResetToken.mockResolvedValue("expired");
    const result = await resetPassword(null, form(valid));
    expect(result.error).toContain("invalid or has expired");
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it("hashes with cost 12 and updates the user for a valid token", async () => {
    mocks.consumePasswordResetToken.mockResolvedValue("valid");
    mocks.hash.mockResolvedValue("newhash");
    expect(await resetPassword(null, form(valid))).toEqual({ success: true });
    expect(mocks.hash).toHaveBeenCalledWith("newpassword1", 12);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
      data: { password: "newhash" },
    });
  });
});
