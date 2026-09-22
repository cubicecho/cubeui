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
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
