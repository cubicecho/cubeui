import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ThemePicker as CompiledThemePicker } from "../compiled/theme-picker";
import { ThemePicker as NativeThemePicker } from "../registry/ui/theme-picker";
import {
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
  value?: ThemePreference | undefined;
  onValueChange?: ((value: ThemePreference) => void) | undefined;
  "aria-label"?: string | undefined;
};
type Picker = ComponentType<PickerProps>;

const html = () => document.documentElement;
const stored = () => window.localStorage.getItem(THEME_STORAGE_KEY);
// Off the variable, as `tokens.stories.tsx` reads it: a component's computed colour straight after
// the class flips is the start of a transition, not the value the tokens set.
const background = () => getComputedStyle(html()).getPropertyValue("--background").trim();
const LIGHT = "#ffffff";
const DARK = "#0a0a0a";

function reset() {
  html().classList.remove("dark", "light");
  window.localStorage.removeItem(THEME_STORAGE_KEY);
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
    reset();
    return () => {
      html().classList.toggle("dark", classes.dark);
      html().classList.toggle("light", classes.light);
      if (before === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, before);
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
  play: async ({ canvasElement }) => {
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
  },
};
