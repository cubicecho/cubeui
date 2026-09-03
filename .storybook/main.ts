import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const root = resolve(import.meta.dirname, "..");

const config: StorybookConfig = {
  // Stories live outside `registry/` on purpose. A registry source imports `cn`, shadcn
  // primitives, react, lucide and other cubeui items and nothing else (AGENTS.md), and a
  // co-located `*.stories.tsx` would put `@storybook/*` inside the tree that rule describes.
  stories: ["../stories/**/*.stories.@(ts|tsx)"],

  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],

  framework: { name: "@storybook/react-vite", options: {} },

  typescript: {
    // The prop tables are the TSDoc already on every prop — rule 9 says the comment carries the
    // *why*, and this is what puts it in front of a consumer instead of only a reader of source.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },

  viteFinal: (cfg) => {
    // `vite.config.ts` maps `@` -> repo root, so `@/components/...` names the *consumer's*
    // components directory, which here holds the shadcn primitives. `dialog-layout.tsx` reaches
    // its chassis through that path, so it does not resolve in this repo.
    //
    // Open question 4 in docs/component-conventions.md is exactly this, and it is unsettled, so
    // the source is left alone and the path is bent here instead. When the question lands on the
    // `@/registry/<style>/...` form the file's own comment points at, delete this entry.
    cfg.resolve ??= {};
    cfg.resolve.alias = [
      {
        find: "@/components/header-content-footer",
        replacement: resolve(root, "registry/layout/header-content-footer"),
      },
      { find: "@", replacement: root },
    ];
    return cfg;
  },
};

export default config;
