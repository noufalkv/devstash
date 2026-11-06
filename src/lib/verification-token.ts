import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerificationResult = "verified" | "invalid" | "expired";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Only the hash is stored, so a database leak does not expose usable links.
export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function verifyEmailToken(email: string, token: string): Promise<VerificationResult> {
  const hashed = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: hashed } },
  });
  if (!record) return "invalid";

  // deleteMany makes the token single-use even if two requests race.
  const { count } = await prisma.verificationToken.deleteMany({
    where: { identifier: email, token: hashed },
  });
  if (count === 0) return "invalid";
  if (record.expires < new Date()) return "expired";

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return "verified";
}
