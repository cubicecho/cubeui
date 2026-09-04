import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";

// The same stylesheet the preview site loads. Two harnesses rendering the same component from
// two token sets are not showing the same component, and the drift would be invisible.
import "../preview/index.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // These shells carry real a11y behaviour — DialogLayout's `hideTitle` keeps the title and
    // hides it, and its `aria-describedby: undefined` exists to stop Radix warning. Failing the
    // run rather than collecting a report is the only version of that check that holds.
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
