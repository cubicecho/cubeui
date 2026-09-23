import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CardLayout } from "../registry/layout/card-layout";
import { PageHeader } from "../registry/layout/page-header";
import { RouteError } from "../registry/layout/route-error";
import { Section } from "../registry/layout/section";
import { Button } from "../registry/ui/button";
import { Card, CardContent } from "../registry/ui/card";
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

/**
 * A token as the browser resolves it, in the `rgb()` spelling `getComputedStyle` reports a colour
 * in — so an assertion compares like with like whichever notation the stylesheet emitted.
 */
function resolved(token: string, inside: Element) {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  inside.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}

/** Runs `check` with `<html>` dark, and puts the class back however it went. */
async function inDark(check: () => Promise<void>) {
  const html = document.documentElement;
  const had = html.classList.contains("dark");
  try {
    html.classList.add("dark");
    await check();
  } finally {
    html.classList.toggle("dark", had);
  }
}

/**
 * react-native-web's base `View` class is `border: 0 solid black`, and a class beats the
 * `* { border-color: var(--border) }` a web stylesheet relies on. So a bare `border` drew black on
 * Expo web — `card`, the card surface and divider of `section`, and `route-error`'s details box
 * (#78). Each now names `border-border`, which is what `registry:check` rule 14 holds.
 */
export const BordersNameTheirColour: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card testID="card">
        <CardContent>
          <Button variant="ghost">Inside a card</Button>
        </CardContent>
      </Card>
      <Section title="Profile" surface="card" divider content={<Button>Save</Button>} />
      <RouteError
        error={new Error("It broke")}
        reset={() => {}}
        describe={() => "This is a bug, not something you did."}
        details
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const border = resolved("border", canvasElement);
    await expect(border).not.toBe("rgb(0, 0, 0)");

    const colour = (testId: string, side: "Top" | "Bottom" = "Top") =>
      getComputedStyle(canvas.getByTestId(testId))[`border${side}Color`];
    await expect(colour("card")).toBe(border);
    await expect(colour("section")).toBe(border);
    await expect(colour("section-heading", "Bottom")).toBe(border);
    await expect(colour("route-error-details")).toBe(border);
  },
};

/**
 * `Platform.OS === "web"` is true under react-native-web as well as on the compiled half, and only
 * the compiled half inherits colour: a react-native-web `Text` sets its own, black. `PageHeader`,
 * `CardLayout` and `DialogLayout` left their ink to inheritance on web, so the title was black on
 * the dark theme under Expo web (#78). The ink is on every platform now — and still loses to a
 * caller's `titleClassName`, because that comes after it in the `cn`.
 */
export const TitlesTakeTheTheme: Story = {
  render: () => (
    <div className="bg-background" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader title="Settings" />
      <PageHeader title="Danger zone" level={2} titleClassName="text-destructive" />
      <CardLayout title="Members" content={null} empty="Nobody yet" footer="Updated today" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inDark(async () => {
      const [title, overridden] = canvas.getAllByTestId("page-header-title");
      if (!title || !overridden) throw new Error("both headers should render a title");
      const foreground = resolved("foreground", canvasElement);
      // The dark palette's foreground is near-white; the bug was black.
      await expect(foreground).not.toBe("rgb(0, 0, 0)");
      await expect(getComputedStyle(title).color).toBe(foreground);
      await expect(getComputedStyle(overridden).color).toBe(resolved("destructive", canvasElement));

      const cardInk = resolved("card-foreground", canvasElement);
      await expect(getComputedStyle(canvas.getByText("Updated today")).color).toBe(cardInk);
      await expect(getComputedStyle(canvas.getByText("Nobody yet")).color).toBe(cardInk);
    });
  },
};
