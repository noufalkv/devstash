import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/actions/**", "src/lib/**"],
      exclude: ["src/lib/mock-data.ts", "src/**/*.test.ts"],
    },
  },
});
