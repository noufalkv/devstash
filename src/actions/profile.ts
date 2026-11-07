"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { DEMO_USER_EMAIL } from "@/lib/db/demo-user";
import { prisma } from "@/lib/prisma";

export interface ProfileActionResult {
  success: boolean;
  error?: string;
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
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

export async function changePassword(
  _prevState: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });
    if (!user?.password) {
      return { success: false, error: "Password sign-in is not enabled for this account" };
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) return { success: false, error: "Current password is incorrect" };

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteAccount(
  _prevState: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!user) return { success: false, error: "Account not found" };
    if (user.email === DEMO_USER_EMAIL) {
      return { success: false, error: "The demo account can't be deleted" };
    }

    const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
    if (confirmEmail !== user.email.toLowerCase()) {
      return { success: false, error: "The email you typed doesn't match your account" };
    }

    await prisma.user.delete({ where: { id: session.user.id } });
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  // Throws a redirect, which must propagate.
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
