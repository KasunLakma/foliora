import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Run test files one after another so they do not all open database connections at once.
    fileParallelism: false,
    // Retry once: a sleeping database can drop the very first connection.
    retry: 1,
  },
}); 