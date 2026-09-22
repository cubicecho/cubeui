import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-native-web-vite";
import tailwind from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { reactNativeClassName } from "./rn-classname.ts";

const root = resolve(import.meta.dirname, "..");

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
    // Vite's `publicDir` defaults to `<root>/public`, and `public/` here is the deployed registry
    // rather than this app's assets. Every Storybook build was carrying a second copy of 160 item
    // JSONs, and the moment a landing page landed at `public/index.html` it overwrote Storybook's
    // own — a static build whose index was the registry page and whose UI could not be reached.
    // No story reads anything out of `public/`.
    config.publicDir = false;

    config.plugins = [
      reactNativeClassName(),
      tailwind(),
      // The web project's path aliases, for the Stage 0 stories that render a compiled
      // component beside the React Native one it came from.
      //
      // `@/lib/utils` means two different files depending on which half is asking — the
      // React Native `registry/lib/utils.ts` or the compiled `compiled/utils.ts` — which is
      // exactly what two tsconfig projects are for. The framework adds its own
      // `vite-tsconfig-paths`, but that one only ever loads a file named `tsconfig.json`, so
      // `tsconfig.web.json` has to be named. Without it a compiled file's `@/lib/utils`
      // resolves to nothing and the story fails to import, which reads like a broken story
      // and is a missing project.
      tsconfigPaths({ projects: [resolve(root, "tsconfig.web.json")] }),
      ...(config.plugins ?? []),
    ];
    return config;
  },
};

export default config;
