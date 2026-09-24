import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  type ReactElement,
  useContext,
  useState,
} from "react";
import { Text } from "react-native";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { ArrowRight, Pencil } from "../compiled/icons";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "../compiled/menu";
import {
  MenuContent as NativeContent,
  MenuItem as NativeItem,
  Menu as NativeMenu,
  MenuTrigger as NativeTrigger,
} from "../registry/ui/menu.tsx";

/**
 * A `MenuItem` that navigates. On the web the row is the router's own `<a>` — radix's item
 * rendered as the link element it is handed — so a router that preloads on intent (TanStack's
 * `preload="intent"`, React Router's `prefetch="intent"`) hears the hover and the focus.
 *
 * The router here is a fake on purpose: the registry takes no router dependency, and what is
 * being proved is only that the row hands the link's handlers the events a real one listens to.
 * `FakeLink` renders an `<a>`, calls the handlers it was given first — as TanStack's, React
 * Router's and Next's links all do — and then does what a router does: preloads on enter and
 * focus, and on a click prevents the browser's navigation and records its own.
 */
const meta = { title: "Menu links", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj;

const Log = createContext<(entry: string) => void>(() => {});

function FakeLink({
  to,
  onClick,
  onMouseEnter,
  onFocus,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { to: string }) {
  const log = useContext(Log);
  return (
    <a
      {...props}
      href={to}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        log(`preload ${to} on hover`);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        log(`preload ${to} on focus`);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        log(`navigate ${to}`);
      }}
    />
  );
}

function ProjectMenu({ defaultOpen }: { defaultOpen?: boolean }) {
  const [entries, setEntries] = useState<string[]>([]);
  const log = (entry: string) =>
    setEntries((all) => (all.at(-1) === entry ? all : [...all, entry]));
  return (
    <Log.Provider value={log}>
      <div className="flex flex-col gap-2">
        <Menu defaultOpen={defaultOpen}>
          <MenuTrigger>Project actions</MenuTrigger>
          <MenuContent>
            <MenuItem icon={<Pencil />} label="Rename" onSelect={() => log("select rename")} />
            <MenuItem
              icon={<ArrowRight />}
              label="Open project"
              trailing="⌘O"
              link={<FakeLink to="/projects/7" />}
              onSelect={() => log("select open")}
            />
            <MenuItem label="Archived" disabled link={<FakeLink to="/projects/7/archived" />} />
            <MenuSeparator />
            <MenuItem label="Help" href="#menu-links-help" />
          </MenuContent>
        </Menu>
        <output aria-label="Router log" className="whitespace-pre text-xs">
          {entries.join("\n") || "nothing"}
        </output>
      </div>
    </Log.Provider>
  );
}

const body = () => within(document.body);
// `hidden`: while the menu is open radix hides the rest of the page from the accessibility tree.
const routerLog = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("status", { name: "Router log", hidden: true });

async function openMenu(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Project actions" }));
  return body().findByRole("menu");
}

/** The row is the link's `<a>`, as a menu item, and the keys follow it and close the menu. */
export const WebLinkKeyboard: Story = {
  render: () => <ProjectMenu />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Project actions" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await body().findByRole("menu");
    const open = within(menu).getByRole("menuitem", { name: /^Open project/ });

    await expect(open.tagName).toBe("A");
    await expect(open).toHaveAttribute("href", "/projects/7");
    await expect(open).toHaveAttribute("data-slot", "menu-item");

    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Rename"));
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(open);
    await expect(routerLog(canvasElement)).toHaveTextContent("preload /projects/7 on focus");

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    // Radix's select ran before the router's click, so both happened and in that order.
    await expect(routerLog(canvasElement).textContent).toMatch(
      /select open\nnavigate \/projects\/7$/,
    );
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/** Hover reaches the link's own handler — the one a router preloads from — and a click follows it. */
export const WebLinkPointer: Story = {
  render: () => <ProjectMenu />,
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    const open = within(menu).getByRole("menuitem", { name: /^Open project/ });

    await userEvent.hover(open);
    await expect(routerLog(canvasElement)).toHaveTextContent("preload /projects/7 on hover");
    // Radix focuses the row under the pointer, so a router listening for focus hears it too.
    await waitFor(() => expect(document.activeElement).toBe(open));
    await expect(routerLog(canvasElement)).toHaveTextContent("preload /projects/7 on focus");

    await userEvent.click(open);
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(routerLog(canvasElement)).toHaveTextContent("navigate /projects/7");
  },
};

/**
 * A disabled link row is not a link, and nothing follows it; a plain `href` is a plain `<a>`; and
 * a link row is drawn exactly like the button row above it.
 */
export const WebLinkDisabledAndHref: Story = {
  render: () => <ProjectMenu />,
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);

    const archived = within(menu).getByRole("menuitem", { name: "Archived" });
    await expect(archived.tagName).not.toBe("A");
    await expect(archived).not.toHaveAttribute("href");
    await expect(archived).toHaveAttribute("aria-disabled", "true");
    // `fireEvent`: the row is `pointer-events: none`, and this is a click that arrives anyway.
    fireEvent.click(archived);
    await expect(routerLog(canvasElement)).not.toHaveTextContent("archived");
    await expect(body().getByRole("menu")).toBeInTheDocument();

    const rename = within(menu).getByRole("menuitem", { name: "Rename" });
    const open = within(menu).getByRole("menuitem", { name: /^Open project/ });
    const look = (el: Element) => {
      const style = getComputedStyle(el);
      return [style.display, style.height, style.padding, style.gap, style.color, style.cursor];
    };
    await expect(look(open)).toEqual(look(rename));

    // Down from Open project skips the disabled row and lands on the plain link.
    open.focus();
    await userEvent.keyboard("{ArrowDown}");
    const help = within(menu).getByRole("menuitem", { name: "Help" });
    await expect(document.activeElement).toBe(help);
    await expect(help.tagName).toBe("A");
    await expect(help).toHaveAttribute("href", "#menu-links-help");

    // Stop the browser following it after radix has had the click, and record that it would have.
    let followed = "";
    const stop = (event: MouseEvent) => {
      followed = (event.target as Element).closest("a")?.getAttribute("href") ?? "";
      event.preventDefault();
    };
    document.addEventListener("click", stop);
    try {
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
      await expect(followed).toBe("#menu-links-help");
    } finally {
      document.removeEventListener("click", stop);
    }
  },
};

/** Open, so the axe run every story gets is run over the link rows as well. */
export const WebLinkOpen: Story = {
  parameters: {
    // Radix's, as in the Menu stories: the page behind the menu is `aria-hidden` and its trigger
    // still has a tab stop, which the focus trap keeps unreachable and axe cannot see.
    a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
  },
  render: () => <ProjectMenu defaultOpen />,
  play: async () => {
    await expect(await body().findByRole("menu")).toBeInTheDocument();
  },
};

/**
 * The shape of expo-router's `Link asChild`: it clones its one child and hands it a press handler
 * of its own, beside the one the child already has.
 */
function FakeNativeLink({
  href,
  asChild,
  children,
}: {
  href: string;
  asChild?: boolean;
  children?: ReactElement<{ onPress?: () => void }>;
}) {
  const log = useContext(Log);
  if (!asChild || !children) throw new Error("FakeNativeLink wants asChild and one child");
  return cloneElement(children, {
    onPress: () => {
      children.props.onPress?.();
      log(`navigate ${href}`);
    },
  });
}

function NativeProjectMenu() {
  const [entries, setEntries] = useState<string[]>([]);
  const log = (entry: string) => setEntries((all) => [...all, entry]);
  return (
    <Log.Provider value={log}>
      <div className="flex flex-col gap-2">
        <NativeMenu>
          <NativeTrigger>
            <Text className="text-foreground">Native project actions</Text>
          </NativeTrigger>
          <NativeContent aria-label="Native project actions">
            <NativeItem
              label="Open project"
              link={<FakeNativeLink href="/projects/7" />}
              onSelect={() => log("select open")}
            />
            <NativeItem label="Archived" disabled link={<FakeNativeLink href="/archived" />} />
            <NativeItem label="Help" href="/help" onSelect={() => log("select help")} />
          </NativeContent>
        </NativeMenu>
        <output aria-label="Native router log" className="whitespace-pre text-xs">
          {entries.join("\n") || "nothing"}
        </output>
      </div>
    </Log.Provider>
  );
}

/**
 * On the native half a `link` takes the row `asChild`, so pressing it runs `onSelect`, closes the
 * sheet and navigates; a disabled row is never handed to the link; `href` alone only selects.
 */
export const NativeLink: Story = {
  parameters: {
    // As in the Menu stories: under Vite the native popover resolves to the radix half, whose
    // unnamed `role="dialog"` wraps the sheet. Never shipped; the menu inside is named.
    a11y: { config: { rules: [{ id: "aria-dialog-name", enabled: false }] } },
  },
  render: () => <NativeProjectMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = () => canvas.getByRole("status", { name: "Native router log" });
    const trigger = canvas.getByRole("button", { name: "Native project actions" });

    await userEvent.click(trigger);
    let menu = await body().findByRole("menu", { name: "Native project actions" });
    const archived = within(menu).getByRole("menuitem", { name: "Archived" });
    await expect(archived).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(archived);
    await expect(log()).toHaveTextContent("nothing");

    await userEvent.click(within(menu).getByRole("menuitem", { name: "Open project" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(log().textContent).toBe("select open\nnavigate /projects/7");

    await userEvent.click(trigger);
    menu = await body().findByRole("menu", { name: "Native project actions" });
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Help" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(log().textContent).toBe("select open\nnavigate /projects/7\nselect help");
  },
};
