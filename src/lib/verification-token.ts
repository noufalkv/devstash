import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export type VerificationResult = "verified" | "invalid" | "expired";
export type PasswordResetTokenResult = "valid" | "invalid" | "expired";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Reset tokens share the VerificationToken table, so a prefix keeps them apart from email verification.
function resetIdentifier(email: string) {
  return `password-reset:${email}`;
}

// Only the hash is stored, so a database leak does not expose usable links.
async function issueToken(identifier: string, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

async function consumeToken(
  identifier: string,
  token: string,
): Promise<"valid" | "invalid" | "expired"> {
  const hashed = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: hashed } },
  });
  if (!record) return "invalid";

  // deleteMany makes the token single-use even if two requests race.
  const { count } = await prisma.verificationToken.deleteMany({
    where: { identifier, token: hashed },
  });
  if (count === 0) return "invalid";
  if (record.expires < new Date()) return "expired";
  return "valid";
}

export function createVerificationToken(email: string): Promise<string> {
  return issueToken(email, VERIFY_TOKEN_TTL_MS);
}

export async function verifyEmailToken(email: string, token: string): Promise<VerificationResult> {
  const result = await consumeToken(email, token);
  if (result !== "valid") return result;

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return "verified";
}

export function createPasswordResetToken(email: string): Promise<string> {
  return issueToken(resetIdentifier(email), RESET_TOKEN_TTL_MS);
}

// Read-only check so the reset page can reject a bad link before showing the form.
export async function checkPasswordResetToken(
  email: string,
  token: string,
): Promise<PasswordResetTokenResult> {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: resetIdentifier(email), token: hashToken(token) } },
  });
  if (!record) return "invalid";
  return record.expires < new Date() ? "expired" : "valid";
}

export function consumePasswordResetToken(
  email: string,
  token: string,
): Promise<PasswordResetTokenResult> {
  return consumeToken(resetIdentifier(email), token);
}
