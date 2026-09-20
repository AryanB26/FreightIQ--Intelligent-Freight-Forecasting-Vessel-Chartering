import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    testTimeout: 30000,
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/.gods-eye-view/**",
      "**/.mage-ui/**",
      "**/.ui-ux-pro-max-skill/**",
      "**/.agency-agents/**",
    ],
  },
});
