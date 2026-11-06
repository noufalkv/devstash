import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: providers only, no database adapter
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
