import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrations) uses the direct, non-pooled Neon connection.
    // process.env (not env()) so `prisma generate` works without a .env file.
    url: process.env.DIRECT_URL,
  },
});
