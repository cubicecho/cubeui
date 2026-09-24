import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ThemePicker } from "@/components/ui/theme-picker";
import { THEME_STORAGE_KEY } from "@/components/ui/theme-preference-base";

/**
 * `ThemePicker`, as installed beside it by `@cubeui/theme-picker-stories`: Light, Dark and System,
 * stored in `localStorage` and applied as a class on `<html>`. Palette-free — the class is what the
 * app's own stylesheet reads, whatever colours it gives it.
 *
 * The class and the stored key outlive a story, so each one starts with neither and puts back what
 * the app's Storybook had before it — its own theme switcher may be using that same class.
 */
const html = () => document.documentElement;
const stored = () => window.localStorage.getItem(THEME_STORAGE_KEY);

function Remountable() {
  const [mounted, setMounted] = useState(true);
  return (
    <div className="flex flex-col gap-4 bg-background p-6 text-foreground">
      {mounted ? <ThemePicker /> : null}
      <button type="button" onClick={() => setMounted((m) => !m)}>
        {mounted ? "Unmount" : "Mount"}
      </button>
    </div>
  );
}

const meta = {
  title: "cubeui/ThemePicker",
  component: Remountable,
  beforeEach: () => {
    const dark = html().classList.contains("dark");
    const light = html().classList.contains("light");
    const before = stored();
    html().classList.remove("dark", "light");
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    return () => {
      html().classList.toggle("dark", dark);
      html().classList.toggle("light", light);
      if (before === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, before);
    };
  },
} satisfies Meta<typeof Remountable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dark puts `dark` on `<html>` and stores it; System takes both classes off on a browser that
 * reports light; and a picker mounted afterwards reads the stored choice back.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = (name: string) => canvas.getByRole("radio", { name });
    const lightBrowser = !window.matchMedia("(prefers-color-scheme: dark)").matches;

    await expect(canvas.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    await expect(radio("System")).toHaveAttribute("aria-checked", "true");

    await userEvent.click(radio("Dark"));
    await waitFor(() => expect(radio("Dark")).toHaveAttribute("aria-checked", "true"));
    await expect(html()).toHaveClass("dark");
    await expect(stored()).toBe("dark");

    await userEvent.click(canvas.getByRole("button", { name: "Unmount" }));
    html().classList.remove("dark", "light");
    await userEvent.click(canvas.getByRole("button", { name: "Mount" }));
    await waitFor(() => expect(radio("Dark")).toHaveAttribute("aria-checked", "true"));
    await expect(html()).toHaveClass("dark");

    await userEvent.click(radio("System"));
    await waitFor(() => expect(radio("System")).toHaveAttribute("aria-checked", "true"));
    await expect(stored()).toBe("system");
    await expect(html()).not.toHaveClass("light");
    if (lightBrowser) await expect(html()).not.toHaveClass("dark");
  },
};

/**
 * `variant="compact"` in a 14rem sidebar footer: one full-width row of icon-only radios, each
 * named by its caption, which is also the hover tooltip.
 */
export const Compact: Story = {
  render: () => (
    <div className="w-56 bg-background p-2 text-foreground">
      <ThemePicker variant="compact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "Theme" });
    const dark = within(group).getByRole("radio", { name: "Dark" });
    await expect(dark).toHaveAttribute("title", "Dark");
    await expect(dark.textContent).toBe("");

    await userEvent.click(dark);
    await waitFor(() => expect(dark).toHaveAttribute("aria-checked", "true"));
    await expect(html()).toHaveClass("dark");
    await expect(stored()).toBe("dark");
  },
};
