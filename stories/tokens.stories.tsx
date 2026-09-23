import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CardLayout } from "../registry/layout/card-layout";
import { PageHeader } from "../registry/layout/page-header";
import { RouteError } from "../registry/layout/route-error";
import { Section } from "../registry/layout/section";
import { Button } from "../registry/ui/button";
import { Card, CardContent } from "../registry/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../registry/ui/dialog";
import { Input } from "../registry/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../registry/ui/tabs";
import { Textarea } from "../registry/ui/textarea";

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
 * The radix halves render raw `<button>`s — here `tabs.web.tsx` and `dialog.web.tsx`, which is what
 * Vite resolves these imports to — and with nothing resetting them the user-agent sheet drew each
 * one with a `2px outset` border and a grey fill, and gave it a colour and font of its own, so an
 * inactive tab ignored its list's `text-muted-foreground` (#97). The reset is specificity zero, so
 * the last button is the other half of the claim: a `border` and a `bg-*` utility still win.
 */
export const RawButtonsTakeNoBrowserLook: Story = {
  parameters: {
    // As in `Tabs/IconInTrigger`: the inactive tab's muted-on-muted pairing is shadcn's, at 4.34:1,
    // and is a token decision rather than this story's subject.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
  render: () => (
    <div
      className="bg-background p-6"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
        </TabsList>
      </Tabs>
      <button type="button" className="border-2 border-border bg-primary text-primary-foreground">
        Styled
      </button>
      <Dialog open>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>Give the board a new name.</DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `hidden`, because the open modal marks everything outside it `aria-hidden`.
    const inactive = canvas.getByRole("tab", { name: "Board", hidden: true });
    const close = within(document.body).getByRole("button", { name: "Close" });

    for (const button of [inactive, close]) {
      const style = getComputedStyle(button);
      await expect(style.borderTopStyle).toBe("solid");
      await expect(style.borderTopWidth).toBe("0px");
      await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    }
    // Inherited now, so the list's colour and the page font reach the label.
    const list = canvas.getByRole("tablist", { hidden: true });
    await expect(getComputedStyle(inactive).color).toBe(getComputedStyle(list).color);
    await expect(getComputedStyle(inactive).fontFamily).toBe(getComputedStyle(list).fontFamily);
    await expect(getComputedStyle(document.documentElement).fontFamily).toContain("Segoe UI");

    const styled = getComputedStyle(canvas.getByRole("button", { name: "Styled", hidden: true }));
    await expect(styled.borderTopWidth).toBe("2px");
    await expect(styled.borderTopColor).toBe(resolved("border", canvasElement));
    await expect(styled.backgroundColor).toBe(resolved("primary", canvasElement));
  },
};

/**
 * `input.web.tsx` and `textarea.web.tsx` render a raw `<input>` and `<textarea>`, and form fields do
 * not inherit the page font: the user-agent sheet drew the input in Arial and the textarea in
 * monospace, beside a `<label>` in the page font (#103). The reset hands them `color` and `font`
 * from their parent at specificity zero, so the components' own `text-foreground` and
 * `placeholder:text-muted-foreground` still colour them, and a `font-*` or `text-*` class still
 * wins.
 */
export const FormFieldsTakeThePageFont: Story = {
  render: () => (
    <div
      className="bg-background p-6"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Input placeholder="Title" />
      <Textarea placeholder="Notes" />
      <div className="text-destructive" style={{ display: "flex", gap: 8 }}>
        <input aria-label="Raw input" />
        <textarea aria-label="Raw textarea" />
        {/* The reset leaves the fill alone, and the browser's grey one fails contrast. */}
        <select aria-label="Raw select" className="bg-background">
          <option>One</option>
        </select>
      </div>
      <input aria-label="Styled input" className="font-mono text-lg text-primary" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = getComputedStyle(document.documentElement).fontFamily;
    await expect(page).toContain("Segoe UI");

    // The components: the page font, and their own colour classes over the inherited colour.
    for (const field of [
      canvas.getByPlaceholderText("Title"),
      canvas.getByPlaceholderText("Notes"),
    ]) {
      const style = getComputedStyle(field);
      await expect(style.fontFamily).toBe(page);
      await expect(style.color).toBe(resolved("foreground", canvasElement));
      await expect(getComputedStyle(field, "::placeholder").color).toBe(
        resolved("muted-foreground", canvasElement),
      );
    }

    // Bare elements: everything inherited, colour included.
    const parent = getComputedStyle(canvas.getByLabelText("Raw input").parentElement as Element);
    for (const name of ["Raw input", "Raw textarea", "Raw select"]) {
      const style = getComputedStyle(canvas.getByLabelText(name));
      await expect(style.fontFamily).toBe(page);
      await expect(style.fontSize).toBe(parent.fontSize);
      await expect(style.color).toBe(parent.color);
    }

    // And the reset outranks nothing: a font, size and colour utility each still win.
    const styled = getComputedStyle(canvas.getByLabelText("Styled input"));
    await expect(styled.fontFamily).not.toBe(page);
    await expect(styled.fontFamily).toContain("monospace");
    await expect(styled.fontSize).toBe("18px");
    await expect(styled.color).toBe(resolved("primary", canvasElement));
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
