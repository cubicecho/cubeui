import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "../registry/ui/button";
import { Input } from "../registry/ui/input";

/**
 * What `dist/tokens.native.css` owes an Expo *web* build beyond the palette, asserted on the React
 * Native halves as that build renders them — which is the only place either failure showed.
 */
const meta = { title: "Tokens/Expo web" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * `input.web.tsx` renders a raw `<input>`, and react-native-web's `border-box` reaches only the
 * elements it renders itself. With no reset in the tokens, the same `h-10` drew the input at 58px
 * beside a 40px button — `content-box` adding the `py-2` and the border on top.
 */
export const InputBesideButton: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <Input placeholder="Email" />
      <Button>Sign in</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Email");
    const button = canvas.getByRole("button", { name: "Sign in" });

    await expect(getComputedStyle(input).boxSizing).toBe("border-box");
    await expect(input.getBoundingClientRect().height).toBe(40);
    await expect(input.getBoundingClientRect().height).toBe(button.getBoundingClientRect().height);
  },
};

/**
 * A theme picker on web needs `class="dark"` on `<html>` to beat the system, since nothing in the
 * page can move `prefers-color-scheme`. The browser here reports light, so the class alone has to
 * turn the page dark.
 */
export const ManualDark: Story = {
  render: () => <Button variant="outline">Outline</Button>,
  play: async () => {
    // Read off the variable rather than a component's colour: every colour utility here is
    // `transition-colors`, so a computed colour read straight after the class flips is the start
    // of a 150ms transition and not the value the tokens set.
    const html = document.documentElement;
    const background = () => getComputedStyle(html).getPropertyValue("--background").trim();
    const had = html.classList.contains("dark");
    try {
      html.classList.remove("dark");
      await expect(background()).toBe("#ffffff");
      html.classList.add("dark");
      await expect(background()).toBe("#0a0a0a");
    } finally {
      html.classList.toggle("dark", had);
    }
  },
};

/**
 * `text-destructive-foreground` was on this button, and on `toast`'s error tone, before the
 * palette had the token — so the class matched nothing and the label took whatever it inherited.
 */
export const DestructiveLabel: Story = {
  render: () => <Button variant="destructive">Delete</Button>,
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText("Delete");
    // `--destructive-foreground` in the light palette, as the literal the token emits.
    await expect(getComputedStyle(label).color).toBe("rgb(255, 255, 255)");
  },
};
