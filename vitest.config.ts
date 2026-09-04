import { resolve } from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

// Extensionless on purpose: Vite warns that its future `configLoader: "native"` will want the
// `.ts`, but writing it needs `allowImportingTsExtensions`, which this tsconfig does not set.
import viteConfig from "./vite.config";

const root = import.meta.dirname;

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          // The pure functions. They are maths, not layout, so they have no business paying for
          // a browser session — and this project is where a `registry:lib` item gets tested at
          // all, since a story can only reach one through a component that renders it.
          extends: true,
          test: {
            name: "unit",
            environment: "node",
            include: ["registry/**/*.test.ts"],
          },
        },
        {
          extends: true,
          // No setup file: since Storybook 10.3 the addon applies `.storybook/preview.ts`
          // itself, so the stylesheet and the theme decorator are already in place here.
          plugins: [storybookTest({ configDir: resolve(root, ".storybook") })],
          test: {
            name: "storybook",
            // One browser session at a time. Run in parallel, a session drops its websocket
            // partway through and the run dies with "browser connection was closed" on whichever
            // file lost the race — three story files are not worth the flake.
            fileParallelism: false,
            // A real browser, not jsdom. The claims these stories make — a body that scrolls
            // while its chrome does not, a floor that stops one wide child growing the chassis —
            // are layout and computed style, which a simulated DOM does not have.
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({
                launchOptions: {
                  args: [
                    // Chromium's sandbox needs user namespaces, which containers and most CI
                    // images do not grant.
                    "--no-sandbox",
                    // Chromium sizes its shared memory against /dev/shm, which is 64MB in a
                    // default container. The renderer dies mid-run without this, and it presents
                    // as "browser connection was closed" on whichever file was unlucky.
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
  }),
);
