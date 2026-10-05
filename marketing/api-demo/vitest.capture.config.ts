import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../vitest.config";

// Runs only the API capture (the regular `pnpm test` ignores this folder).
export default mergeConfig(
  base,
  defineConfig({
    define: { __APP_VERSION__: JSON.stringify("1.6.1") },
    test: {
      include: ["marketing/api-demo/capture-api.capture.ts"],
      testTimeout: 60000,
    },
  }),
);
