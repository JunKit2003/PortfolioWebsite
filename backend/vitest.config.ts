import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    hookTimeout: 30000,
    // Run in a non-UTC zone so tests catch any use of the local date.
    env: { TZ: "Asia/Kuala_Lumpur" },
  },
})
