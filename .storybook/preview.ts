import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";

import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Collecting a report and passing anyway is not a check. These stories exist to answer
    // whether a compiled DOM tree keeps the semantics the React Native source expressed, and an
    // honest answer needs the run to fail when it does not.
    a11y: { test: "error" },
    // The two galleries are the "show me everything" pages the landing page links to, so they
    // open the sidebar rather than sitting wherever `G` falls among the per-item stories.
    options: { storySort: { order: ["Gallery", ["Web", "Mobile"], "*"] } },
  },
  decorators: [
    // `light` is a class too, not the absence of `dark`: the tokens follow the system's
    // `prefers-color-scheme` unless `<html>` names one, so on a machine set to dark an empty
    // class drew the "light" theme dark.
    withThemeByClassName<ReactRenderer>({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
