import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.emulator.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
