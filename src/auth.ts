import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Replace the placeholder Credentials provider from auth.config.ts
const providers = authConfig.providers.filter(
  (provider) => typeof provider === "function" || provider.id !== "credentials",
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        if (!user.emailVerified && isEmailVerificationEnabled()) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;

      // Re-read on every auth() call so a webhook's change applies on the next request, without re-login
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPro: true },
        });
        token.isPro = dbUser?.isPro ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.isPro = token.isPro ?? false;
      return session;
    },
  },
});
