import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createVerificationToken } from "@/lib/verification-token";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Invalid email address").trim().toLowerCase(),
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

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit("register", getClientIp(request.headers));
  if (!rateLimit.success) return rateLimitResponse(rateLimit.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const skipVerification = !isEmailVerificationEnabled();
    const user = await prisma.user.create({
      data: { name, email, password: hashed, emailVerified: skipVerification ? new Date() : null },
      select: { id: true, name: true, email: true },
    });

    if (skipVerification) {
      return NextResponse.json(
        { success: true, data: { ...user, requiresVerification: false } },
        { status: 201 },
      );
    }

    // The account exists either way; if sending fails the user can resend from the sign-in page.
    const token = await createVerificationToken(email);
    const emailSent = await sendVerificationEmail(email, token);

    return NextResponse.json(
      { success: true, data: { ...user, requiresVerification: true, emailSent } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
