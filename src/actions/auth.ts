"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
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
