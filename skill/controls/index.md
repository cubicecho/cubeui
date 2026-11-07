# cubeui controls

Read [SKILL.md](../SKILL.md) first, and [vocabulary.md](../vocabulary.md) before writing a slot
prop. These are the controls, not the shells: each one is a real
control with a real accessible name, usable on its own or inside a `FormField`. Every one of them
has a bound counterpart in [forms/index.md](../forms/index.md) — reach for that inside a TanStack form, and for
these in a filter bar, a toolbar, or a plain `useState` screen.

**Web only**, except the icons, the segmented control, `DatePicker`, `DateRangePicker`, `DateTimeInput`, `ColorPicker` and the
colour display parts, the removable badge, the spinner, the alert, the menu, the combobox, the theme picker, the copy button, the code block, the icon in an input, the search box, the progress bar, and the file picker (its native half only draws the zone), which each say so. Everything else here is a DOM
component with no React Native half, so it does not install in an Expo project. The native set is
[native.md](../native.md).

**The controls files.** Each holds one group; [SKILL.md](../SKILL.md)'s choosing table links straight to the section you need.

| File | What is in it |
| --- | --- |
| [icons.md](icons.md) | `@cubeui/icons` |
| [buttons.md](buttons.md) | `Button`, icon buttons, `CopyButton`, `DownloadButton`, `ConfirmButton` |
| [menus.md](menus.md) | `Menu`, `MenuItem` and its checkbox and radio rows, `Command`, `CommandDialog` |
| [combobox.md](combobox.md) | `Combobox`, `SegmentedGroup`, `SegmentedButton` |
| [dates.md](dates.md) | `DatePicker`, `DateRangePicker`, `DateTimeInput`, the `format*` helpers |
| [code-and-markdown.md](code-and-markdown.md) | `CodeBlock`, `Markdown`, `MarkdownEditor`, `MarkdownCodeEditor` |
| [inputs.md](inputs.md) | icons and fixed text in an input, `SearchInput`, `PasswordInput`, `FilePicker` |
| [display.md](display.md) | `Progress`, `ColorDot`, `Badge onRemove`, `Alert`, `Spinner`, `Toast`, `Skeleton`, `Separator` |
| [theme.md](theme.md) | `ThemePicker`, `useThemePreference`, `usePalettePreference`, `PaletteProvider` |

## Hover, focus, chosen and disabled

Every control in the registry draws its states from the same few classes. A row, a card or a
control you compose yourself uses them too, so it does not sit beside a registry one and give a
second answer.

| State | Draw it with | Notes |
|---|---|---|
| Under the pointer | `hover:bg-hover` | Grey, on every unchosen control and row. A filled button darkens its own fill instead: `hover:bg-neutral/90`. A chosen thing tints a step further: `hover:bg-active/60`. |
| Keyboard focus | the hover look: `focus-visible:bg-hover` | No ring. A row whose focus is on a child uses `has-[:focus-visible]:bg-hover`. A filled button looks hovered too: `focus-visible:bg-hover focus-visible:text-foreground`, so its label and icon turn `foreground` with the fill. A chosen thing looks hovered as a chosen thing does: `focus-visible:bg-active/60`, its ink unchanged. |
| Focus in a field | `focus:border-active` | Input, textarea, select trigger. No ring here either. |
| Pressed, on a device | `active:bg-hover` | There is no pointer to hover with, so the press is where the grey shows. A filled button darkens its own fill: `active:bg-neutral/90`; a chosen thing tints further: `active:bg-active/60`. |
| Chosen | `bg-active/40 text-foreground`, `hover:bg-active/60` | Every chosen, current, checked, on or selected thing: the current sidebar row, the active tab, the pressed segment, an on chip, a picked day, a table row, a `ListItem`, `Item` or `FileTree` file with `selected`, the option a select or a combobox is on, a checked menu row. A tint, so the thing's own text, badges and colour dots still read; its text is `foreground`, the secondary lines and quiet icons included, because the `/60` grey is under 4.5:1 on the tint. |
| Chosen, with an edge | the tint and `border-active` | A control whose edge is what shows it is there — a checked box, an on switch's track, a chosen radio's circle, an on chip, a radio tile, a selected `StatTile`. The tint is not 3:1 from the surface, and the `active` edge is. The check, the thumb and the dot are `foreground`, 3:1 or more on the tint. |
| Disabled | `opacity-50` | `disabled:opacity-50 disabled:cursor-not-allowed` on a DOM control. It takes no hover. |

- **Chosen is the active tint, a step stronger under the pointer.** Never the hover grey, and
  hover never `active`: a grey chosen row is a hover that stuck. Never a solid `bg-active` either:
  coloured content on it is unreadable, and its pointer step was too small to see. Write it
  `selected && "bg-active/40 hover:bg-active/60 focus-visible:bg-active/60"`.
- **A label's `Text` names its own colour, so a filled button's focus reaches it through a named
  group.** Put `group/<name>` on the pressable and `group-focus-visible/<name>:text-foreground` on
  the `Text` inside it, as `Button` does. The group variant selects what is inside the group, so it
  does nothing on the element that names it: that element turns its own ink with plain
  `focus-visible:text-foreground`. A chosen thing needs none of it: its ink is `foreground` already.
- **The colour is not the whole of chosen.** Say it as well: `aria-current="page"` on the link to
  the current place, `aria-selected` on an option in a listbox or a tab, `aria-pressed` on a
  toggle, `aria-checked` on a box or a switch. `ListItem`, `SidebarItem`, `Tabs`,
  `SegmentedGroup` and `ToggleChip` set theirs. On `Item` the link is yours, so `aria-current`
  goes on it yourself.
- **Use the prop before the class.** `selected` on `Item`, `ListItem`, `ToggleChip` and
  `StatTile`, `active` on `SidebarItem` and `AppBarItem`, `data-state="selected"` on a
  `TableRow`. The classes above are for a row that is none of those.

### Elevation

A shadow says how far a thing floats, and there are three:

| Where it sits | Shadow | What |
|---|---|---|
| In the page's flow | none | `Card`, `CardLayout`, `Alert`, a code block, a switch's track |
| A part laid over content | `shadow-sm` | A switch's thumb, a copy button over a code block |
| Floating over the page | `shadow-md` | Popover, menu, a select's list, tooltip, toast |
| Modal | `shadow-lg` | `Dialog`, `AlertDialog` |

Do not give a card in the page a shadow to lift it: its edge and fill do that.
