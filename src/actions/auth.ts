"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { createVerificationToken } from "@/lib/verification-token";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  unverifiedEmail?: string;
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
