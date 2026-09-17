import type { StorybookConfig } from "@storybook/react-native-web-vite";
import tailwind from "@tailwindcss/vite";
import { reactNativeClassName } from "./rn-classname.ts";

const config: StorybookConfig = {
  // Stories live outside `registry/` on purpose, the same reason cubeui's do: a registry source
  // imports `cn`, react, react-native, lucide and other cubeui items and nothing else, and a
  // co-located `*.stories.tsx` would put `@storybook/*` inside the tree that rule describes —
  // and inside the files the shadcn CLI copies into a consumer.
  stories: ["../stories/**/*.stories.@(ts|tsx)"],

  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],

  framework: {
    name: "@storybook/react-native-web-vite",
    options: {
      // The framework's own Babel pass. It is what strips Flow types out of react-native's
      // source; this repo's own files are plain TypeScript and go through esbuild as usual.
      pluginReactOptions: { babel: { plugins: [] } },
    },
  },

  typescript: {
    // The prop tables are the TSDoc already on every prop, which is what puts the *why* in front
    // of a consumer rather than only a reader of the source.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },

  viteFinal: (config) => {
    config.plugins = [reactNativeClassName(), tailwind(), ...(config.plugins ?? [])];
    return config;
  },
};

export default config;
