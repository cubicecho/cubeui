# cubeui controls: Theme

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Theme

```tsx
// Web: nothing to pass. The picker stores the choice and applies it.
<ThemePicker />

// A sidebar footer or a header bar: one row of icon-only radios.
<ThemePicker variant="compact" />

// Device: pass storage once, where the app starts. The picker writes through it too.
import AsyncStorage from "@react-native-async-storage/async-storage";
useThemePreference({ storage: AsyncStorage });
```

<!-- props:ThemePicker -->
`ThemePicker`'s props, from the TSDoc in `registry/ui/theme-picker.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `variant` | `"card" \| "compact"` |  | `card` (the default): three tiles, icon over caption, for a settings page. `compact`: one row of icon-only segments, the caption as the name and (on the web) the tooltip. |
| `value` | `ThemePreference` |  | The checked choice, for a controlled picker. Left out, the picker is bound to the hook. |
| `onValueChange` | `((value: ThemePreference) => void)` |  | Told of every choice — the only way a controlled picker changes; a bound one also stores it. |
| `disabled` | `boolean` |  | The choices cannot be changed, and are drawn faded. |
| `id` | `string` |  | The group's id, for a label or a description elsewhere to point at. |
| `className` | `string` |  | On the group the choices sit in. |
| `aria-label` | `string` |  | The group's name. Defaults to "Theme"; pass `aria-labelledby` instead when a heading names it. |
| `aria-labelledby` | `string` |  | The id of a visible heading that names the group, in place of `aria-label`. |
| `aria-describedby` | `string` |  | The ids of what describes the group, such as a bound field's hint. |
| `palettes` | `readonly PalettePreference[]` |  | Offer a palette as well, under the theme: these, in this order. Left out, no palette choice. |
| `palette` | `PalettePreference` |  | The checked palette, for a controlled picker. Left out, the palette is bound to its hook. |
| `onPaletteChange` | `((value: PalettePreference) => void)` |  | Told of every palette chosen; a bound picker also stores it. |
<!-- /props -->

`@cubeui/theme-picker` works on both platforms. `ThemePicker` is a `RadioGroup variant="card"`
with Light, Dark and System. Do not hand-roll it from `RadioGroup`. The control is the easy part,
and the storage, the class and the first paint are what hand-rolled versions get wrong.

- **Bound by default.** Without `value`, the picker reads and writes `useThemePreference()`.
  Pass `value` and it is controlled. It then only calls `onValueChange` and never touches storage,
  the class or `Appearance`. Use that when the preference lives on the account or in a settings
  form.
- **Call `useThemePreference()` at the app's root as well**, not only on the settings screen. That
  way the choice is applied on every screen, and System keeps following the device. It returns
  `[preference, setPreference]`, the same state the picker shows.
- **Web:** the choice goes in `localStorage` under `THEME_STORAGE_KEY` (`"cubeui-theme"`). It is
  applied as a class on `<html>`: `dark` for Dark, `light` for Light, and for System `dark` only
  while the device is dark. A DOM app's `tokens.web.css` has only `.dark`, which is why System
  still sets it. The hook reads nothing at import, so it renders on a server.
- **Device:** the choice is applied with `Appearance.setColorScheme`, with `"unspecified"` for System. That
  is the spelling React Native 0.82+ requires, and 0.81 treats it the same way.
  `storage` is any `{ getItem, setItem }`, sync or async. Wrap MMKV or `expo-secure-store` in two
  lambdas. Without `storage` the choice lasts until the app closes. The stored value is read
  asynchronously, so hold the splash screen if a flash of the system theme matters.
- **`variant="compact"`** is for where tiles do not fit, such as a 14rem sidebar footer or a 6rem
  phone header. It draws one row of Sun / Moon / Monitor segments (`RadioGroup
  variant="segmented"`) and is as wide as the column it is stacked in, so size the container, not the picker. In a
  row beside other things — `SidebarLayout`'s `actionSlot`, a header bar — it is as wide as its
  three segments, which is what lets it and a button fit a 320px bar; pass `className="flex-1"`
  there to make it take what the row has left.
  It is still a radiogroup of three radios with the same keyboard and the same `value` /
  `onValueChange` or hook binding. Each caption ("Light", "Dark", "System") is the radio's
  `aria-label`, and on the web it is also the hover tooltip (`title`). A device has no hover, so
  there the caption is only the name VoiceOver and TalkBack read. Do not hand-draw an icon-only
  theme `<fieldset>` beside it.
- `aria-label` defaults to "Theme". Pass `aria-labelledby` when a heading names the group.
- **An app that already stored a theme under its own key** keeps its readers' choices with
  `migrateThemePreference`. The storage keys are fixed, so without it everyone who had chosen
  dark is back on System the day the app adopts the picker. Call it once where the app boots,
  before the first render:

  ```tsx
  import { migrateThemePreference } from "@/components/ui/theme-preference";

  void migrateThemePreference({ theme: ["myapp-theme"], palette: ["myapp-palette"] });
  // On device, pass the adapter: migrateThemePreference({ theme: ["myapp-theme"] }, { storage })
  ```

  For each of cubeui's keys that is empty, the first old key holding a valid value (`light`,
  `dark` or `system`; a palette name) is copied in and removed. A choice already under cubeui's
  key is never overwritten. On the web the copy is done when the call returns. On a device it is
  asynchronous, the hooks' first read waits for it, and the old key is removed only if `storage`
  has a `removeItem`. Translate values that are not these three in your own code first.

### Palettes

A palette is a second choice beside the theme: whose colours, where the theme is light or dark.
`PALETTE_PREFERENCES` lists them — `"default"` (cubeui's own) and `"monokai"`. Monokai is dark
only, so it is in `DARK_ONLY_PALETTES`, and while it is chosen the app is dark whatever the theme
says.

- **`<ThemePicker palettes={PALETTE_PREFERENCES} />`** adds a Palette radiogroup under the
  theme. While a dark-only palette is chosen the theme radios are disabled, and they come back
  as they were when Default is chosen again. Controlled, it takes `palette` and
  `onPaletteChange` beside `value` and `onValueChange`.
- **`usePalettePreference()`** returns `[palette, setPalette]`, for a control of your own. It
  takes the same `storage` as `useThemePreference`.
- **Web:** stored under `PALETTE_STORAGE_KEY` (`"cubeui-palette"`) and applied as
  `data-palette="monokai"` on `<html>`, which the tokens stylesheet keys on. The pre-paint
  script below reads it too. `useThemePreference()` at the root applies both.
- **Device:** there is no `<html>`, so wrap the app's root in **`PaletteProvider`**, inside
  nothing that draws. It hands the palette's colours to NativeWind's `VariableContextProvider`,
  so they reach a `Modal` too, and a dark-only palette also sets `Appearance` to dark. On the
  web `PaletteProvider` renders its children and nothing more, so one root serves both.
- **A colour the user picked follows the palette by itself.** `ColorDot` and `Card accentColor`
  read the page and card they are drawn on (`useSurfaceColors`), so a pick stays as picked where
  it already shows and moves just far enough where it does not — in Monokai as in light and dark
  ([Colour](display.md#colour)).
- **A checked, pressed or current control is drawn in `active`**, not `primary`: a quiet cyan in the
  default palette, Monokai's purple in Monokai. It is the tint, `bg-active/40` with
  `text-foreground`, a step stronger (`/60`) under the pointer, and a selected state you draw
  yourself uses the same, so it follows the palette; `primary` stays the colour of a button to
  press. The active tab and the sidebar's current row are the tint too. Hover is the pale `hover` fill and
  never `active`. The whole rule, state by state, is in
  [Hover, focus, chosen and disabled](index.md#hover-focus-chosen-and-disabled).
- **Every palette draws the same steps.** A card or popover (`secondary`) is about 1.1:1 off the
  page and `hover` about 1.2:1 beyond it, in light, dark and Monokai alike. The four status colours
  differ in lightness as well as hue, so they stay apart for a reader with a colour-vision
  deficiency. Colour alone still says nothing to some readers, so a dot that means something gets
  a `label`, which the web shows as a tooltip. App chrome, a sidebar or a bar, is `bg-background`,
  and shadcn's `sidebar` alias is too.
- The colours are in `palettes` in `@/lib/cubeui-theme`; `paletteFor(scheme, palette)` gives the
  set a screen is painted with, for a chart or anything else that takes a colour as a prop.

```tsx
const storage = { getItem: (k) => mmkv.getString(k) ?? null, setItem: (k, v) => mmkv.set(k, v) };

export default function Root() {
  useThemePreference({ storage });
  usePalettePreference({ storage });
  return (
    <PaletteProvider>
      <Stack />
    </PaletteProvider>
  );
}
```

**Paint the stored theme and palette before React mounts**, or a reload flashes the other one. Put this in
`<head>`, before any stylesheet:

```html
<script>(function(){try{var s=localStorage,p=s.getItem("cubeui-theme"),q=s.getItem("cubeui-palette"),k=["monokai"].indexOf(q)>=0,d=k||p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches),e=document.documentElement,c=e.classList;c.toggle("dark",d);c.toggle("light",!k&&p==="light");if(["monokai"].indexOf(q)>=0)e.setAttribute("data-palette",q)}catch(e){}})();</script>
```

Where the head is React, as in Expo's `app/+html.tsx` or a Next layout, render the export rather
than pasting it:

```tsx
import { THEME_PRE_PAINT_SCRIPT } from "@/components/ui/theme-preference-base";

<script dangerouslySetInnerHTML={{ __html: THEME_PRE_PAINT_SCRIPT }} />

// With older keys to bring across, so the first paint after the upgrade is already right:
import { themePrePaintScript } from "@/components/ui/theme-preference-base";

const script = themePrePaintScript({ legacyKeys: { theme: ["myapp-theme"] } });
<script dangerouslySetInnerHTML={{ __html: script }} />
```

## Type and spacing

cubeui's tokens hold colour and radius. Type and spacing are Tailwind's own steps, and cubeui uses
only a few of them, each for one job. Draw your own text and gaps from the same steps, so a screen
of yours sits beside cubeui's on one scale rather than two. The steps are far enough apart that two
neighbours always look different, which is what makes picking one quick.

**Type is a size on its line.**

| Class | Size / line | For |
| --- | --- | --- |
| `text-xs` | 12px / 16px | The floor, and nothing is smaller: a badge, a caption, a row's `meta`, a menu group's label. |
| `CODE_TEXT` | 12px / 20px, mono | Code: `Code`, `CodeBlock` and both Markdown editors. In `@/lib/utils`. |
| `text-sm` | 14px / 20px | The body: every control, field and row, and a block's title and the line under it. |
| `text-sm leading-relaxed` | 14px / 22.75px | Prose read at length: a Markdown document, a hint's paragraph. |
| `text-base` | 16px / 24px | The smallest title over a page or a block: `PageHeader` `sm`, `###`, `EmptyTitle`, a fieldset's legend. |
| `text-lg` | 18px / 28px | `##`. A dialog's title is `text-lg leading-tight`, 18px on 22.5px, so it holds together when it wraps at phone width. |
| `text-xl` | 20px / 28px | `PageHeader` `md`, `#`. |
| `text-2xl` | 24px / 32px | A page's title: `PageHeader` `lg`, `CenteredCardLayout`. A `StatTile`'s figure. |

- **Line height follows the size.** Small text takes a tall line for its size, and a large title a
  short one, so leave the size's own line alone except for three steps: `leading-5` (a 20px line,
  for code, or to say `text-sm`'s line again where a parent's would carry over), `leading-relaxed`
  (prose) and `leading-tight` (a title of 18px or more that may wrap).
- **Two weights.** `font-normal` for text, and `font-semibold` for a title, a label or a button.
  Hierarchy comes from weight and ink (`text-foreground/60`) before size: a block's title and its
  description are both 14px. The classes for that are `HEADING_TITLE` and `HEADING_DESCRIPTION` in
  `@/lib/utils`.

**Spacing is 4px steps.** Padding, margins and gaps are `1` (4px), `2` (8px), `3` (12px), `4`
(16px), `6` (24px) and `8` (32px), further apart the larger they get. Two half-steps are on the
scale, each for one job, and no other:

- `0.5` (2px) nudges a 16px icon onto the middle of a 20px line (`mt-0.5`), pads a badge or inline
  code, and packs the rows of a nav list (`gap-0.5`).
- `1.5` (6px) is the pad above and below a menu, select, command or segment row (`py-1.5`, which
  with a 20px line makes a 32px row), and the room between a tab's or a segment's icon and its
  label. A tab is `h-7.5` (30px) on the web, so its framed list is a field's height.

**Sizes.** A control is 28px (`h-7`, `xs`), 36px (`h-9`, `sm`) or 40px (`h-10`, the default and every
field), and 44px (`h-11`) where it is pressed on a phone. An icon is 16px (`size-4`), 14px
(`size-3.5`) in an `xs` control or beside 12px text, and 20px (`size-5`) beside a large title. A dot
is 8px (`size-2`) inside a row or a chip, and 10px (`size-2.5`) beside its label.
