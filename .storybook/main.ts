import type { StorybookConfig } from "@storybook/react-vite";

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

  // `vite.config.ts` already maps `@` -> repo root, which is all the sources need now that they
  // import each other as `@/registry/new-york/...`.
};

export default config;
