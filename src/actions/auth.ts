"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  type RateLimitName,
} from "@/lib/rate-limit";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  createVerificationToken,
} from "@/lib/verification-token";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  unverifiedEmail?: string;
  rateLimited?: boolean;
}

// Returns an error result when the caller is over the limit, otherwise null.
async function limitAuthAction(
  name: RateLimitName,
  email?: string,
): Promise<AuthActionResult | null> {
  const ip = getClientIp(await headers());
  const { success, reset } = await checkRateLimit(name, email ? `${ip}:${email}` : ip);
  if (success) return null;
  return { success: false, error: rateLimitMessage(reset), rateLimited: true };
}

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const DEFAULT_REDIRECT = "/dashboard";

// Only allow same-site relative paths to avoid open redirects.
function getSafeRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  return value.startsWith("/") && !value.startsWith("//") ? value : DEFAULT_REDIRECT;
}

export async function signInWithCredentials(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const limited = await limitAuthAction("login", parsed.data.email.trim().toLowerCase());
  if (limited) return limited;

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: getSafeRedirect(formData.get("callbackUrl")),
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error instanceof CredentialsSignin && error.code === "email_not_verified") {
        return {
          success: false,
          error: "Please verify your email before signing in.",
          unverifiedEmail: parsed.data.email,
        };
      }
      return {
        success: false,
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password"
            : "Something went wrong. Please try again.",
      };
    }
    // Successful sign-in throws a redirect, which must propagate.
    throw error;
  }
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getSafeRedirect(formData.get("callbackUrl")) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}

const resendSchema = z.object({ email: z.email().trim().toLowerCase() });

// Always reports success for a valid email so it can't be used to discover accounts.
export async function resendVerification(email: string): Promise<AuthActionResult> {
  const parsed = resendSchema.safeParse({ email });
  if (!parsed.success) return { success: false, error: "Enter a valid email address" };

  if (!isEmailVerificationEnabled()) return { success: true };

  const limited = await limitAuthAction("resendVerification", parsed.data.email);
  if (limited) return limited;

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user?.password && !user.emailVerified) {
      const token = await createVerificationToken(user.email);
      const sent = await sendVerificationEmail(user.email, token);
      if (!sent) return { success: false, error: "Could not send the email. Please try again." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address").trim().toLowerCase() });

// Always reports success for a valid email so it can't be used to discover accounts.
export async function requestPasswordReset(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const limited = await limitAuthAction("forgotPassword");
  if (limited) return limited;

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user?.password) {
      const token = await createPasswordResetToken(user.email);
      const sent = await sendPasswordResetEmail(user.email, token);
      if (!sent) return { success: false, error: "Could not send the email. Please try again." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const resetPasswordSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const limited = await limitAuthAction("resetPassword");
  if (limited) return limited;

  try {
    const result = await consumePasswordResetToken(parsed.data.email, parsed.data.token);
    if (result !== "valid") {
      return {
        success: false,
        error: "This reset link is invalid or has expired. Request a new one.",
      };
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({ where: { email: parsed.data.email }, data: { password: hashed } });
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
