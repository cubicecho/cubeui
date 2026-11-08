import type { Meta, StoryObj } from "@storybook/react-vite";
import { useContext } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button as Compiled } from "../compiled/button";
import {
  ChevronDown as CompiledChevron,
  Pencil as CompiledPencil,
  Plus as CompiledPlus,
  Trash2 as CompiledTrash,
} from "../compiled/icons";
import { Button as Native } from "../registry/ui/button";
import {
  ChevronDown as NativeChevron,
  Pencil as NativePencil,
  Plus as NativePlus,
  Trash2 as NativeTrash,
} from "../registry/ui/icons";
import { IconClassContext } from "../registry/ui/icons-base";
import {
  Tooltip as NativeTooltip,
  TooltipContent as NativeTooltipContent,
  TooltipTrigger as NativeTooltipTrigger,
} from "../registry/ui/tooltip.tsx";
import { SideBySide } from "./side-by-side";

/**
 * `Button`'s inside is three props — `iconSlot`, `content`, `trailingSlot` — and no children
 * (#243). That is what lets `loading` put a spinner where the icon was and swap the label, on both
 * halves, with nothing rebuilt at the call site.
 */
const meta = { title: "RN Parity/Button" } satisfies Meta;

export default meta;
type Story = StoryObj;

const halves = ["native", "compiled"] as const;

/** The three parts, in the order they are drawn whatever order they were passed in. */
export const Parts: Story = {
  render: () => (
    <SideBySide
      native={
        <div data-testid="native">
          <Native
            variant="outline"
            trailingSlot={<NativeChevron />}
            content="New workspace"
            iconSlot={<NativePlus />}
          />
        </div>
      }
      compiled={
        <div data-testid="compiled">
          <Compiled
            variant="outline"
            trailingSlot={<CompiledChevron />}
            content="New workspace"
            iconSlot={<CompiledPlus />}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      const frame = within(within(canvasElement).getByTestId(half));
      const button = frame.getByRole("button", { name: "New workspace" });
      const icon = button.querySelector(".lucide-plus")?.getBoundingClientRect();
      const label = within(button).getByText("New workspace").getBoundingClientRect();
      const trailing = button.querySelector(".lucide-chevron-down")?.getBoundingClientRect();
      if (!icon || !trailing) {
        throw new Error(`the ${half} icons should render`);
      }
      // `half` rides along so a failure names which half broke.
      await expect({
        half,
        inOrder: icon.right <= label.left && label.right <= trailing.left,
      }).toEqual({ half, inOrder: true });
    }
  },
};

const pressed = { native: fn(), compiled: fn() };

/**
 * `loading` (#243): disabled, `aria-busy`, a spinner where the icon was, and `loadingLabel` in
 * place of the label. The spinner is hidden, so the button's name is the label alone and not
 * "Loading Saving…".
 */
export const Loading: Story = {
  render: () => (
    <SideBySide
      native={
        <div data-testid="native" className="flex flex-row gap-2">
          <Native
            loading
            loadingLabel="Saving…"
            content="Save"
            iconSlot={<NativePlus />}
            onPress={pressed.native}
          />
          <Native loading variant="outline" content="Reload models" />
        </div>
      }
      compiled={
        <div data-testid="compiled" className="flex flex-row gap-2">
          <Compiled
            loading
            loadingLabel="Saving…"
            content="Save"
            iconSlot={<CompiledPlus />}
            onClick={pressed.compiled}
          />
          <Compiled loading variant="outline" content="Reload models" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      pressed[half].mockClear();
      const frame = within(within(canvasElement).getByTestId(half));
      const saving = frame.getByRole("button", { name: "Saving…" });
      await expect(saving).toHaveAttribute("aria-busy", "true");
      await expect(saving).toBeDisabled();
      // The spinner is drawn in the icon's place, and is not part of the name.
      await expect(saving.querySelector(".lucide-plus")).toBeNull();
      await expect(saving.querySelector("svg")).not.toBeNull();
      await expect(frame.queryByRole("status")).toBeNull();

      await userEvent.click(saving, { pointerEventsCheck: 0 });
      await expect(pressed[half]).not.toHaveBeenCalled();

      // With no `loadingLabel` the label stays, and with no icon the spinner goes before it.
      const reloading = frame.getByRole("button", { name: "Reload models" });
      const spinner = reloading.querySelector("svg");
      if (!spinner) {
        throw new Error(`the ${half} spinner should render`);
      }
      const label = within(reloading).getByText("Reload models").getBoundingClientRect();
      await expect(spinner.getBoundingClientRect().right).toBeLessThanOrEqual(label.left);
    }
  },
};

/**
 * Two icon buttons: one with only a name, and one with a `hint` that can be disabled. The
 * compiled half speaks DOM prop names — `onClick` — so each half is handed its own.
 */
function IconRow({
  half,
  disabled = false,
}: {
  half: (typeof halves)[number];
  disabled?: boolean;
}) {
  if (half === "native") {
    return (
      <div data-testid="native" className="flex flex-row gap-2">
        <Native
          aria-label="Edit workspace"
          variant="outline"
          size="icon"
          onPress={pressed.native}
          iconSlot={<NativePencil />}
        />
        <Native
          aria-label="Delete lane"
          hint="Empty the lane first"
          variant="outline"
          size="icon"
          disabled={disabled}
          onPress={pressed.native}
          iconSlot={<NativeTrash />}
        />
      </div>
    );
  }
  return (
    <div data-testid="compiled" className="flex flex-row gap-2">
      <Compiled
        aria-label="Edit workspace"
        variant="outline"
        size="icon"
        onClick={pressed.compiled}
        iconSlot={<CompiledPencil />}
      />
      <Compiled
        aria-label="Delete lane"
        hint="Empty the lane first"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={pressed.compiled}
        iconSlot={<CompiledTrash />}
      />
    </div>
  );
}

/**
 * An icon button: an icon and nothing else, still a named button, and with no `hint` its name is
 * the tooltip (#419), without also being its description.
 * Storybook resolves `tooltip.web.tsx` the way Metro does, so the tooltip is radix on both
 * halves. The device's long press and accessibility hint have no browser to run in, and are
 * typechecked, not played.
 */
export const IconButtons: Story = {
  render: () => (
    <SideBySide native={<IconRow half="native" />} compiled={<IconRow half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      pressed[half].mockClear();
      const frame = within(within(canvasElement).getByTestId(half));

      const edit = frame.getByRole("button", { name: "Edit workspace" });
      await userEvent.hover(edit);
      await expect(await screen.findByRole("tooltip")).toHaveTextContent("Edit workspace");
      await expect(edit).not.toHaveAttribute("aria-describedby");
      await userEvent.unhover(edit);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());

      // The one with a hint shows the hint instead.
      const remove = frame.getByRole("button", { name: "Delete lane" });
      await userEvent.hover(remove);
      await expect(await screen.findByRole("tooltip")).toHaveTextContent("Empty the lane first");
      await userEvent.unhover(remove);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());

      await userEvent.click(edit);
      await expect(pressed[half]).toHaveBeenCalledOnce();
    }
  },
};

/**
 * `disabled` with a `hint` (#320): unavailable to assistive technology on **both** halves, and
 * still focusable and hoverable so the reason can be read. react-native-web's `Pressable` writes
 * its own `aria-disabled` from `disabled` over the one it is handed, so the native half sets the
 * attribute on the element itself.
 */
export const DisabledButStillReadable: Story = {
  render: () => (
    <SideBySide
      native={<IconRow half="native" disabled />}
      compiled={<IconRow half="compiled" disabled />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      pressed[half].mockClear();
      const frame = within(within(canvasElement).getByTestId(half));
      const remove = frame.getByRole("button", { name: "Delete lane" });

      // Announced as unavailable, without the attribute that would mute it.
      await expect(remove).toHaveAttribute("aria-disabled", "true");
      await expect(remove).not.toHaveAttribute("disabled");

      // Reachable by keyboard, and the press is refused.
      remove.focus();
      await expect(remove).toHaveFocus();
      await userEvent.click(remove);
      await expect(pressed[half]).not.toHaveBeenCalled();

      // The reason is read with no tooltip open: an always-mounted description.
      const describedBy = remove.getAttribute("aria-describedby");
      await expect(describedBy).toBeTruthy();
      await expect(document.getElementById(describedBy as string)).toHaveTextContent(
        "Empty the lane first",
      );

      // And the tooltip says it too, on a control a `disabled` button would never have let hover.
      await userEvent.hover(remove);
      await expect(await screen.findByRole("tooltip")).toHaveTextContent("Empty the lane first");
      await userEvent.unhover(remove);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    }
  },
};

/**
 * The native icon button as a device draws it: under the native `Tooltip`, which Storybook would
 * otherwise swap for radix as Metro does on the web. This is the tree `Button` builds on device,
 * spelled out, with its own tooltip off so there is only one.
 */
function DeviceIconButton({ name, className }: { name: string; className: string }) {
  return (
    <NativeTooltip>
      <NativeTooltipTrigger asChild>
        <Native
          aria-label={name}
          variant="outline"
          size="icon-sm"
          tooltip={false}
          className={className}
          iconSlot={<NativePencil />}
        />
      </NativeTooltipTrigger>
      <NativeTooltipContent>{name}</NativeTooltipContent>
    </NativeTooltip>
  );
}

/** A bordered box with a button in its corner, and a row with a button pushed to its end. */
function PlacedButtons({ half }: { half: (typeof halves)[number] }) {
  const corner = "absolute top-2 right-2";
  const end = "ml-auto";
  return (
    <div className="flex flex-col gap-2">
      <div data-testid={`${half}-corner`} className="relative h-24 border border-foreground/10">
        {half === "native" ? (
          <DeviceIconButton name={`${half} corner`} className={corner} />
        ) : (
          <Compiled
            aria-label={`${half} corner`}
            variant="outline"
            size="icon-sm"
            className={corner}
            iconSlot={<CompiledPencil />}
          />
        )}
      </div>
      <div
        data-testid={`${half}-row`}
        className="flex flex-row items-center border border-foreground/10 p-2"
      >
        <span className="text-sm">Endpoint</span>
        {half === "native" ? (
          <DeviceIconButton name={`${half} end`} className={end} />
        ) : (
          <Compiled
            aria-label={`${half} end`}
            variant="outline"
            size="icon-sm"
            className={end}
            iconSlot={<CompiledPencil />}
          />
        )}
      </div>
    </div>
  );
}

/** The 1px border every frame in `PlacedButtons` has, which an inset is measured inside of. */
const FRAME_BORDER = 1;
/** `top-2`, `right-2` and `p-2`. */
const INSET = 8;
/** How long a press is held to count as a long one: react-native's 500ms, and some to spare. */
const LONG_PRESS_MS = 700;

/**
 * Layout classes on an icon button place it in its parent (#423). Every icon `Button` has a
 * tooltip since #419, and on device the tooltip wrapped its trigger in a `View`, so
 * `absolute top-2 right-2` and `ml-auto` placed the button inside that wrapper and not in the
 * box or the row. The native tooltip now draws nothing around its trigger, and its bubble still
 * opens over the button. The compiled half's radix tooltip adds no element either.
 */
export const LayoutClassesPlaceTheButton: Story = {
  render: () => (
    <SideBySide
      native={<PlacedButtons half="native" />}
      compiled={<PlacedButtons half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of halves) {
      const box = canvas.getByTestId(`${half}-corner`);
      const corner = within(box).getByRole("button", { name: `${half} corner` });
      await expect(corner.parentElement).toBe(box);
      const inBox = box.getBoundingClientRect();
      const placed = corner.getBoundingClientRect();
      // `half` rides along so a failure names which half broke.
      await expect({
        half,
        top: Math.round(placed.top - inBox.top - FRAME_BORDER),
        right: Math.round(inBox.right - FRAME_BORDER - placed.right),
      }).toEqual({ half, top: INSET, right: INSET });

      const row = canvas.getByTestId(`${half}-row`);
      const end = within(row).getByRole("button", { name: `${half} end` });
      await expect(end.parentElement).toBe(row);
      const inRow = row.getBoundingClientRect();
      await expect({
        half,
        right: Math.round(inRow.right - FRAME_BORDER - end.getBoundingClientRect().right),
      }).toEqual({ half, right: INSET });
    }

    // The native bubble opens on a long press, above the button and centred on it, as it did
    // against the wrapper. Within the frame's border, which a layout's position counts.
    const corner = canvas.getByRole("button", { name: "native corner" });
    await userEvent.pointer({ keys: "[MouseLeft>]", target: corner });
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_MS));
    await userEvent.pointer({ keys: "[/MouseLeft]", target: corner });
    const bubble = await canvas.findByRole("tooltip");
    await expect(bubble).toHaveTextContent("native corner");
    const button = corner.getBoundingClientRect();
    const tip = bubble.getBoundingClientRect();
    await expect(tip.bottom).toBeLessThanOrEqual(button.top + FRAME_BORDER);
    const offCentre = Math.abs(tip.left + tip.width / 2 - (button.left + button.width / 2));
    await expect(offCentre).toBeLessThanOrEqual(FRAME_BORDER);
  },
};

/** The glyph each size draws, in px: 14 beside `xs`'s small label, 20 in the largest square. */
const GLYPH = { xs: 14, "icon-xs": 14, icon: 16, default: 16, lg: 16, "icon-lg": 20 } as const;
const TEXT_SIZES = ["xs", "default", "lg"] as const;
const ICON_SIZES = ["icon-xs", "icon", "icon-lg"] as const;

function SizedRow({ half }: { half: (typeof halves)[number] }) {
  if (half === "native") {
    return (
      <div data-testid="native" className="flex flex-row flex-wrap items-center gap-2">
        {TEXT_SIZES.map((size) => (
          <Native
            key={size}
            size={size}
            variant="outline"
            content={`native ${size}`}
            iconSlot={<NativePlus />}
          />
        ))}
        {ICON_SIZES.map((size) => (
          <Native
            key={size}
            size={size}
            aria-label={`native ${size}`}
            variant="outline"
            iconSlot={<NativePencil />}
          />
        ))}
      </div>
    );
  }
  return (
    <div data-testid="compiled" className="flex flex-row flex-wrap items-center gap-2">
      {TEXT_SIZES.map((size) => (
        <Compiled
          key={size}
          size={size}
          variant="outline"
          content={`compiled ${size}`}
          iconSlot={<CompiledPlus />}
        />
      ))}
      {ICON_SIZES.map((size) => (
        <Compiled
          key={size}
          size={size}
          aria-label={`compiled ${size}`}
          variant="outline"
          iconSlot={<CompiledPencil />}
        />
      ))}
    </div>
  );
}

/**
 * The glyph follows the button's size (#472): 14px at `xs` and `icon-xs`, 20px in `icon-lg`, where
 * 16px sat lost in a 44px square, and 16px everywhere else — the same on both halves.
 */
export const IconSizes: Story = {
  render: () => (
    <SideBySide native={<SizedRow half="native" />} compiled={<SizedRow half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      const frame = within(within(canvasElement).getByTestId(half));
      for (const size of [...TEXT_SIZES, ...ICON_SIZES]) {
        const button = frame.getByRole("button", { name: `${half} ${size}` });
        const glyph = button.querySelector("svg")?.getBoundingClientRect();
        await expect({ half, size, glyph: glyph && [glyph.width, glyph.height] }).toEqual({
          half,
          size,
          glyph: [GLYPH[size], GLYPH[size]],
        });
      }
    }
  },
};

/** Stands in for a device icon, which is the only kind that reads the class it is handed. */
function ProbeIcon({ name }: { name: string }) {
  const inherited = useContext(IconClassContext);
  return <span data-testid={`icon-${name}`} data-class={inherited ?? ""} />;
}

/**
 * The device half of `IconSizes`. On the web the `[&_svg]:` classes size the glyph; on device an
 * icon is sized only by the class `IconClassContext` hands it, and was lucide's own 24px. The web
 * icon set ignores that context, so a probe reads what a device icon would be given.
 */
export const IconSizeOnDevice: Story = {
  render: () => (
    <div className="flex flex-row gap-2 bg-background p-6">
      <Native content="Add" iconSlot={<ProbeIcon name="default" />} />
      <Native size="xs" content="Add" iconSlot={<ProbeIcon name="xs" />} />
      <Native size="icon-xs" aria-label="Edit" iconSlot={<ProbeIcon name="icon-xs" />} />
      <Native size="icon-lg" aria-label="Edit" iconSlot={<ProbeIcon name="icon-lg" />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const classes = (name: string) =>
      (canvas.getByTestId(`icon-${name}`).getAttribute("data-class") ?? "").split(" ");
    for (const [name, size] of [
      ["default", "size-4"],
      ["xs", "size-3.5"],
      ["icon-xs", "size-3.5"],
      ["icon-lg", "size-5"],
    ] as const) {
      // Sized, and still in the variant's ink.
      await expect({ name, classes: classes(name) }).toEqual({
        name,
        classes: expect.arrayContaining([size, "shrink-0", "text-neutral-foreground"]),
      });
    }
  },
};

/** A hint long enough to need more than the 2.5s every bubble used to get: 63 characters. */
const LONG_HINT = "Empty the lane first: a lane with cards in it cannot be deleted";
/** Past the moment the bubble used to close, 2.5s after it opened, counted from the release. */
const PAST_OLD_LIMIT_MS = 2800;

/**
 * The device tooltip stays longer for a longer hint (#472, WCAG 2.2.1), and its clock starts
 * again when the finger lifts. It used to close 2.5s after it opened, whatever it said.
 * `tooltip-base.test.ts` holds the time to the length.
 */
export const DeviceTooltipWaitsForTheReader: Story = {
  render: () => (
    <div className="bg-background p-16">
      <NativeTooltip>
        <NativeTooltipTrigger asChild>
          <Native
            aria-label="Delete lane"
            variant="outline"
            size="icon"
            tooltip={false}
            iconSlot={<NativeTrash />}
          />
        </NativeTooltipTrigger>
        <NativeTooltipContent>{LONG_HINT}</NativeTooltipContent>
      </NativeTooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Delete lane" });
    await userEvent.pointer({ keys: "[MouseLeft>]", target: button });
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_MS));
    await userEvent.pointer({ keys: "[/MouseLeft]", target: button });
    await expect(canvas.getByRole("tooltip")).toHaveTextContent(LONG_HINT);
    await new Promise((resolve) => setTimeout(resolve, PAST_OLD_LIMIT_MS));
    // Past where the old 2.5s would have closed it: still up.
    await expect(canvas.getByRole("tooltip")).toBeVisible();
    await waitFor(() => expect(canvas.queryByRole("tooltip")).toBeNull(), { timeout: 3000 });
  },
};
