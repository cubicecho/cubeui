import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ThemePicker as CompiledThemePicker } from "../compiled/theme-picker";
import { ThemePicker as NativeThemePicker } from "../registry/ui/theme-picker";
import {
  PALETTE_PREFERENCES,
  PALETTE_STORAGE_KEY,
  type PalettePreference,
  THEME_PRE_PAINT_SCRIPT,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "../registry/ui/theme-preference-base";
import { SideBySide } from "./side-by-side";

/**
 * The theme picker on both web halves: react-native-web on the left, which is an Expo web build
 * (Storybook resolves `theme-preference.web.tsx` the way Metro does), and the compiled DOM on the
 * right, which is a DOM app. Both apply the choice as a class on `<html>` and store it in
 * `localStorage`, and the page's stylesheet is the Expo one — so `--background` turning dark here
 * is the `:is(html.dark)` override beating a browser that reports light. The DOM registry's
 * `tokens.web.css` reads the same `dark` class through `.dark`, which `theme-preference-base.test.ts`
 * holds.
 *
 * The device half — `Appearance.setColorScheme` and the storage adapter — has no browser to run
 * in, and is typechecked, not played.
 */
type PickerProps = {
  variant?: "card" | "compact" | undefined;
  className?: string | undefined;
  value?: ThemePreference | undefined;
  onValueChange?: ((value: ThemePreference) => void) | undefined;
  "aria-label"?: string | undefined;
  palettes?: readonly PalettePreference[] | undefined;
};
type Picker = ComponentType<PickerProps>;

const html = () => document.documentElement;
const stored = () => window.localStorage.getItem(THEME_STORAGE_KEY);
// Off the variable, as `tokens.stories.tsx` reads it: a component's computed colour straight after
// the class flips is the start of a transition, not the value the tokens set.
const background = () => getComputedStyle(html()).getPropertyValue("--background").trim();
const LIGHT = "#ffffff";
const DARK = "#0a0a0a";
const MONOKAI = "#272822";
const storedPalette = () => window.localStorage.getItem(PALETTE_STORAGE_KEY);
/** A button radio is `disabled`; the native half's is a `div`, so it can only say `aria-disabled`. */
const disabled = (radio: HTMLElement) =>
  radio.hasAttribute("disabled") || radio.getAttribute("aria-disabled") === "true";

function reset() {
  html().classList.remove("dark", "light");
  html().removeAttribute("data-palette");
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  window.localStorage.removeItem(PALETTE_STORAGE_KEY);
}

const meta = {
  title: "Stage 0/ThemePicker",
  // Every story starts from nothing stored and no class, and leaves the page as it found it — the
  // class is on `<html>`, which outlives the story, and so does `localStorage`.
  beforeEach: () => {
    const classes = {
      dark: html().classList.contains("dark"),
      light: html().classList.contains("light"),
    };
    const before = stored();
    const beforePalette = storedPalette();
    const attribute = html().getAttribute("data-palette");
    reset();
    return () => {
      html().classList.toggle("dark", classes.dark);
      html().classList.toggle("light", classes.light);
      if (attribute === null) html().removeAttribute("data-palette");
      else html().setAttribute("data-palette", attribute);
      if (before === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, before);
      if (beforePalette === null) window.localStorage.removeItem(PALETTE_STORAGE_KEY);
      else window.localStorage.setItem(PALETTE_STORAGE_KEY, beforePalette);
    };
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** Mount, unmount and mount again — the page reload a story can do. */
function Remountable({ Picker, name }: { Picker: Picker; name: string }) {
  const [mounted, setMounted] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      {mounted ? <Picker aria-label={name} /> : null}
      <button type="button" onClick={() => setMounted((m) => !m)}>
        {`${mounted ? "Unmount" : "Mount"} ${name}`}
      </button>
    </div>
  );
}

const both = (
  <SideBySide
    native={<Remountable Picker={NativeThemePicker} name="Native theme" />}
    compiled={<Remountable Picker={CompiledThemePicker} name="Compiled theme" />}
  />
);

/** Dark beats a light browser, Light beats it back, and System hands it over with no class left. */
async function assertChoices(canvasElement: HTMLElement, name: string) {
  reset();
  const group = within(within(canvasElement).getByRole("radiogroup", { name }));
  const radio = (label: string) => group.getByRole("radio", { name: label });

  await expect(window.matchMedia("(prefers-color-scheme: dark)").matches).toBe(false);
  await expect(background()).toBe(LIGHT);

  await userEvent.click(radio("Dark"));
  await waitFor(() => expect(radio("Dark")).toHaveAttribute("aria-checked", "true"));
  await expect(html()).toHaveClass("dark");
  await expect(html()).not.toHaveClass("light");
  await expect(stored()).toBe("dark");
  await expect(background()).toBe(DARK);

  await userEvent.click(radio("Light"));
  await waitFor(() => expect(radio("Light")).toHaveAttribute("aria-checked", "true"));
  await expect(html()).toHaveClass("light");
  await expect(html()).not.toHaveClass("dark");
  await expect(background()).toBe(LIGHT);

  await userEvent.click(radio("System"));
  await waitFor(() => expect(radio("System")).toHaveAttribute("aria-checked", "true"));
  await expect(html()).not.toHaveClass("dark");
  await expect(html()).not.toHaveClass("light");
  await expect(stored()).toBe("system");
  await expect(background()).toBe(LIGHT);
}

export const Choosing: Story = {
  render: () => both,
  play: async ({ canvasElement }) => {
    await assertChoices(canvasElement, "Native theme");
    await assertChoices(canvasElement, "Compiled theme");
  },
};

/** The choice is read back from storage by a picker mounted after it was made. */
async function assertSurvivesRemount(canvasElement: HTMLElement, name: string) {
  reset();
  const canvas = within(canvasElement);
  const group = () => within(canvas.getByRole("radiogroup", { name }));

  await userEvent.click(group().getByRole("radio", { name: "Dark" }));
  await waitFor(() => expect(stored()).toBe("dark"));

  await userEvent.click(canvas.getByRole("button", { name: `Unmount ${name}` }));
  await expect(canvas.queryByRole("radiogroup", { name })).toBeNull();
  // What a reload starts from: the class gone, only storage left.
  html().classList.remove("dark", "light");
  await userEvent.click(canvas.getByRole("button", { name: `Mount ${name}` }));

  await waitFor(() =>
    expect(group().getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true"),
  );
  await expect(html()).toHaveClass("dark");
  await expect(background()).toBe(DARK);
}

export const SurvivesRemount: Story = {
  render: () => both,
  play: async ({ canvasElement }) => {
    await assertSurvivesRemount(canvasElement, "Native theme");
    await assertSurvivesRemount(canvasElement, "Compiled theme");
  },
};

/**
 * The reload itself, before React: the pre-paint script reads what the hook stored and paints the
 * same class the hook would. Each stored value, and nothing stored, on a browser reporting light.
 */
export const PrePaint: Story = {
  render: () => both,
  play: async () => {
    const run = (value: ThemePreference | null) => {
      html().classList.remove("dark", "light");
      if (value === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, value);
      // The script as the page's `<head>` would run it.
      new Function(THEME_PRE_PAINT_SCRIPT)();
      return ["dark", "light"].filter((c) => html().classList.contains(c)).join(" ");
    };
    await expect(run("dark")).toBe("dark");
    await expect(background()).toBe(DARK);
    await expect(run("light")).toBe("light");
    await expect(run("system")).toBe("");
    await expect(run(null)).toBe("");
    await expect(background()).toBe(LIGHT);

    // A dark-only palette is dark over a stored Light, and wears its attribute.
    window.localStorage.setItem(PALETTE_STORAGE_KEY, "monokai");
    await expect(run("light")).toBe("dark");
    await expect(html()).toHaveAttribute("data-palette", "monokai");
    await expect(background()).toBe(MONOKAI);
  },
};

/**
 * The palette choice under the theme: Monokai wears `data-palette`, is dark over a light browser,
 * and disables the theme choice while it is on; Default takes all three back.
 */
async function assertPalettes(canvasElement: HTMLElement, name: string, index: number) {
  reset();
  const canvas = within(canvasElement);
  const theme = within(canvas.getByRole("radiogroup", { name }));
  const palette = within(
    canvas.getAllByRole("radiogroup", { name: "Palette" })[index] as HTMLElement,
  );

  await expect(palette.getByRole("radio", { name: /Default/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await userEvent.click(palette.getByRole("radio", { name: /Monokai/ }));
  await waitFor(() => expect(html()).toHaveAttribute("data-palette", "monokai"));
  await expect(storedPalette()).toBe("monokai");
  await expect(html()).toHaveClass("dark");
  await expect(background()).toBe(MONOKAI);
  await expect(disabled(theme.getByRole("radio", { name: "Light" }))).toBe(true);

  await userEvent.click(palette.getByRole("radio", { name: /Default/ }));
  await waitFor(() => expect(html()).not.toHaveAttribute("data-palette"));
  await expect(storedPalette()).toBe("default");
  await expect(html()).not.toHaveClass("dark");
  await expect(background()).toBe(LIGHT);
  await expect(disabled(theme.getByRole("radio", { name: "Light" }))).toBe(false);
}

export const Palettes: Story = {
  render: () => (
    <SideBySide
      native={<NativeThemePicker aria-label="Native theme" palettes={PALETTE_PREFERENCES} />}
      compiled={<CompiledThemePicker aria-label="Compiled theme" palettes={PALETTE_PREFERENCES} />}
    />
  ),
  play: async ({ canvasElement }) => {
    await assertPalettes(canvasElement, "Native theme", 0);
    await assertPalettes(canvasElement, "Compiled theme", 1);
  },
};

/**
 * On System, a device that turns dark turns the page dark without a reload — and on the web that
 * means the `dark` class, because the DOM registry's stylesheet has no media query to follow.
 * `prefers-color-scheme` cannot be moved from inside the page, so `matchMedia` is stood in for.
 */
export const FollowsTheDevice: Story = {
  render: () => both,
  play: async ({ canvasElement }) => {
    const real = window.matchMedia;
    const query = "(prefers-color-scheme: dark)";
    let dark = false;
    const changes = new Set<() => void>();
    window.matchMedia = (q: string) => {
      if (q !== query) return real.call(window, q);
      return {
        get matches() {
          return dark;
        },
        media: q,
        addEventListener: (_: string, listener: () => void) => changes.add(listener),
        removeEventListener: (_: string, listener: () => void) => changes.delete(listener),
      } as unknown as MediaQueryList;
    };
    const flip = (next: boolean) => {
      dark = next;
      for (const change of changes) change();
    };
    try {
      for (const name of ["Native theme", "Compiled theme"]) {
        reset();
        dark = false;
        const group = within(within(canvasElement).getByRole("radiogroup", { name }));
        // Dark first, so choosing System is a change the hook's effect answers.
        await userEvent.click(group.getByRole("radio", { name: "Dark" }));
        await userEvent.click(group.getByRole("radio", { name: "System" }));
        await waitFor(() => expect(stored()).toBe("system"));
        await expect(html()).not.toHaveClass("dark");

        flip(true);
        await expect(html()).toHaveClass("dark");
        await expect(html()).not.toHaveClass("light");
        flip(false);
        await expect(html()).not.toHaveClass("dark");

        // Leave System, and the device no longer moves it.
        await userEvent.click(group.getByRole("radio", { name: "Light" }));
        flip(true);
        await expect(html()).not.toHaveClass("dark");
        await expect(html()).toHaveClass("light");
        flip(false);
      }
    } finally {
      window.matchMedia = real;
    }
  },
};

/**
 * Given `value`, the picker only reports: nothing stored, no class moved, and the app's own state
 * decides what is checked.
 */
function Controlled({
  Picker,
  onValueChange,
}: {
  Picker: Picker;
  onValueChange: PickerProps["onValueChange"];
}) {
  const [value, setValue] = useState<ThemePreference>("dark");
  return (
    <Picker
      aria-label="Controlled"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const onNative = fn();
const onCompiled = fn();

export const ControlledLeavesThePageAlone: Story = {
  render: () => (
    <SideBySide
      native={<Controlled Picker={NativeThemePicker} onValueChange={onNative} />}
      compiled={<Controlled Picker={CompiledThemePicker} onValueChange={onCompiled} />}
    />
  ),
  play: ({ canvasElement }) => assertControlled(canvasElement),
};

async function assertControlled(canvasElement: HTMLElement) {
  const groups = within(canvasElement).getAllByRole("radiogroup", { name: "Controlled" });
  const spies = [onNative, onCompiled];
  for (const [index, element] of groups.entries()) {
    const group = within(element);
    spies[index]?.mockClear();
    await expect(group.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(group.getByRole("radio", { name: "Light" }));
    await expect(spies[index]).toHaveBeenCalledWith("light");
    await waitFor(() =>
      expect(group.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true"),
    );
  }
  await expect(stored()).toBeNull();
  await expect(html()).not.toHaveClass("dark");
  await expect(html()).not.toHaveClass("light");
}

/**
 * `variant="compact"` where an app keeps a theme switch: a 14rem sidebar footer and a 6rem header
 * bar. One row of icon-only radios filling the width it is given — still a radiogroup, each radio
 * named by its caption, and on the web the caption is also the hover tooltip (`title`). Device has
 * no hover; there the caption is the screen-reader name only, which is not something a browser
 * can play.
 */
function CompactHarness({ Picker, name }: { Picker: Picker; name: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div data-testid={`${name} sidebar`} className="w-56 rounded-md border border-border p-2">
        <Picker variant="compact" aria-label={`${name} sidebar`} />
      </div>
      <div data-testid={`${name} header`} className="w-24">
        <Picker variant="compact" aria-label={`${name} header`} />
      </div>
    </div>
  );
}

async function assertCompact(canvasElement: HTMLElement, name: string, tooltips: boolean) {
  reset();
  const canvas = within(canvasElement);
  for (const where of ["sidebar", "header"]) {
    const group = canvas.getByRole("radiogroup", { name: `${name} ${where}` });
    const radios = within(group).getAllByRole("radio");
    await expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual([
      "Light",
      "Dark",
      "System",
    ]);
    for (const radio of radios) {
      // Icon-only: the caption is the name, not text on the screen.
      await expect(radio.textContent).toBe("");
      if (tooltips) await expect(radio).toHaveAttribute("title", radio.getAttribute("aria-label"));
    }
    // It fills the box it is put in, which is how the caller sizes it.
    const box = canvas.getByTestId(`${name} ${where}`);
    const inner = box.clientWidth - Number.parseFloat(getComputedStyle(box).paddingLeft) * 2;
    await expect(Math.round(group.getBoundingClientRect().width)).toBe(Math.round(inner));
    // One row: every segment on the same line.
    const tops = new Set(radios.map((r) => Math.round(r.getBoundingClientRect().top)));
    await expect(tops.size).toBe(1);
  }

  // Bound to the hook like the tiles: choosing stores it and moves the class, and the other
  // compact picker on the page follows.
  const sidebar = within(canvas.getByRole("radiogroup", { name: `${name} sidebar` }));
  const header = within(canvas.getByRole("radiogroup", { name: `${name} header` }));
  await userEvent.click(sidebar.getByRole("radio", { name: "Dark" }));
  await waitFor(() => expect(stored()).toBe("dark"));
  await expect(html()).toHaveClass("dark");
  await expect(background()).toBe(DARK);

  // The radio keyboard: arrows move and choose.
  sidebar.getByRole("radio", { name: "Dark" }).focus();
  await userEvent.keyboard("{ArrowRight}");
  await waitFor(() =>
    expect(sidebar.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true"),
  );
  await expect(stored()).toBe("system");
  await userEvent.click(header.getByRole("radio", { name: "Light" }));
  await waitFor(() => expect(stored()).toBe("light"));
  await expect(html()).toHaveClass("light");
}

export const Compact: Story = {
  render: () => (
    <SideBySide
      native={<CompactHarness Picker={NativeThemePicker} name="Native" />}
      compiled={<CompactHarness Picker={CompiledThemePicker} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    // react-native-web does not forward `title`; the compiled half is the web item that ships it.
    await assertCompact(canvasElement, "Native", false);
    await assertCompact(canvasElement, "Compiled", true);
  },
};

/** Compact takes `value` the same way: it reports, and leaves storage and `<html>` alone. */
export const CompactControlled: Story = {
  render: () => (
    <SideBySide
      native={<Controlled Picker={NativeCompact} onValueChange={onNative} />}
      compiled={<Controlled Picker={CompiledCompact} onValueChange={onCompiled} />}
    />
  ),
  play: ({ canvasElement }) => assertControlled(canvasElement),
};

function NativeCompact(props: PickerProps) {
  return <NativeThemePicker {...props} variant="compact" />;
}
function CompiledCompact(props: PickerProps) {
  return <CompiledThemePicker {...props} variant="compact" />;
}
