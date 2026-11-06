import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: providers only, no database adapter.
// Credentials.authorize is overridden in auth.ts (bcrypt and Prisma aren't edge-safe).
export default {
  providers: [GitHub, Credentials({ authorize: () => null })],
  pages: { signIn: "/sign-in" },
} satisfies NextAuthConfig;
