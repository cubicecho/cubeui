import { resolve } from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

// Three test runners, deliberately split by what they are testing.
//
// `scripts/` is the token pipeline: plain node ESM with no JSX, no React and no bundler, and it
// tests under `node --test` so it stays runnable with nothing installed. It is not in this file at
// all — `npm test` runs it first — which is why the `unit` project below narrows its include to
// `registry/` rather than leaving it at the default and collecting those files too.
export default defineConfig({
  test: {
    projects: [
      {
        // The pure functions. They are maths, not layout, so they have no business paying for a
        // browser session — and this project is where a `registry:lib` item gets tested at all,
        // since a story can only reach one through a component that renders it.
        test: {
          name: "unit",
          environment: "node",
          include: ["registry/**/*.test.ts", "registry/**/*.test.tsx"],
        },
      },
      {
        // No setup file: since Storybook 10.3 the addon applies `.storybook/preview.ts` itself,
        // so the stylesheet and the theme decorator are already in place here.
        plugins: [storybookTest({ configDir: resolve(root, ".storybook") })],
        // Pre-bundled up front rather than on discovery. Vite finds `react-native-css/components`
        // only when the first story imports a registry component — by which point the run is
        // already going, so it optimizes, invalidates the dep URLs and reloads mid-test. The
        // stories that lost that race failed with "Failed to fetch dynamically imported module"
        // pointing at a stale pre-bundle, which reads like a component fault and is not one.
        // Naming it here is what vitest's own "please add mentioned dependencies" message asks
        // for; the import is the plugin in `.storybook/rn-classname.ts`, which rewrites every
        // `from "react-native"` in this repo's files to it.
        // `@tanstack/react-form` for the same reason: only `radio-group.stories.tsx` reaches it, so
        // it is discovered mid-run, and the first cold run lost all four of that file's stories.
        // `@tanstack/react-router` likewise: only the sidebar's router-link story imports it.
        optimizeDeps: {
          include: [
            "react-native-css/components",
            "@tanstack/react-form",
            "@tanstack/react-router",
          ],
        },
        test: {
          name: "storybook",
          // One browser session at a time. Run in parallel, a session drops its websocket partway
          // through and the run dies with "browser connection was closed" on whichever file lost
          // the race.
          fileParallelism: false,
          // A real browser, not jsdom. What these stories claim — that a compiled `<div>` lays out
          // the way the `<View>` it came from does, and that axe agrees about the semantics — is
          // computed style and accessibility tree, neither of which a simulated DOM has.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                args: [
                  // Chromium's sandbox needs user namespaces, which containers and most CI images
                  // do not grant.
                  "--no-sandbox",
                  // Chromium sizes its shared memory against /dev/shm, which is 64MB in a default
                  // container. The renderer dies mid-run without this, and it presents as "browser
                  // connection was closed" on whichever file was unlucky.
                  "--disable-dev-shm-usage",
                ],
              },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
