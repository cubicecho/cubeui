import { defineConfig } from "vitest/config";

// Two test runners, deliberately split by what they are testing.
//
// `scripts/` is the token pipeline: plain node ESM with no JSX, no React and no bundler, and it
// tests under `node --test` so it stays runnable with nothing installed. vitest would otherwise
// collect those files and fail them for declaring no suite it recognises, so the include is
// narrowed to the registry rather than left at the default.
export default defineConfig({
  test: {
    include: ["registry/**/*.test.ts", "registry/**/*.test.tsx"],
  },
});
