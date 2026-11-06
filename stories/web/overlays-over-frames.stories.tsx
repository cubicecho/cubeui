import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

/**
 * Overlays on a page that frames another app (`@cubeui/frame-focus-guard`).
 *
 * Some framed apps focus themselves from script, and a frame taking focus blurs this window. Radix
 * closes a menu or a select on window blur, so on such a page every menu opened and closed at once;
 * a dialog stayed open but lost its focus to the frame. personal-homepage found it framing Actual
 * Budget.
 *
 * The frame is a `data:` URL, so it is another origin, as a real framed app is: Chrome lets a
 * cross-origin frame focus itself even while it is `inert`, which is why the guard has to catch the
 * blur and cannot rely on `inert` alone. It takes focus when told to (`postMessage("grab")`) rather
 * than on a timer, so each step below knows the steal happened, and when.
 */
const meta = {
  title: "Behaviours/Overlays over frames",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** A framed app that focuses its own field when asked, and says whether its document then has focus. */
const GRABBING_FRAME = `data:text/html,${encodeURIComponent(`<!doctype html>
<input id="field" aria-label="Framed field">
<script>
  addEventListener("message", () => {
    document.getElementById("field").focus();
    parent.postMessage({ grabbed: document.hasFocus() }, "*");
  });
</script>`)}`;

/** How long to give a steal, the guard's next tick and Radix's reaction before reading the page. */
const SETTLE_MS = 300;

/** Window blurs seen in the bubble phase, by a listener added before any overlay opened: Radix's place. */
let bubbleBlurs = 0;
window.addEventListener("blur", () => {
  bubbleBlurs += 1;
});

const body = () => within(document.body);
const frame = () => document.querySelector<HTMLIFrameElement>('iframe[title="Framed app"]');
const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

/** Tells the framed app to take focus, and waits for it to say it did. */
async function grabFocus(): Promise<boolean> {
  const target = frame();
  if (target === null) {
    throw new Error("The framed app is not on the page.");
  }
  const answer = new Promise<boolean>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { grabbed?: unknown } | null;
      if (typeof data?.grabbed === "boolean") {
        window.removeEventListener("message", onMessage);
        resolve(data.grabbed);
      }
    };
    window.addEventListener("message", onMessage);
  });
  target.contentWindow?.postMessage("grab", "*");
  const grabbed = await answer;
  await settle();
  return grabbed;
}

function FramedPage() {
  const [chosen, setChosen] = useState("nothing");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-row gap-2">
        <Menu>
          <MenuTrigger asChild>
            <Button variant="outline" content="Actions" />
          </MenuTrigger>
          <MenuContent>
            <MenuItem label="Rename" onSelect={() => setChosen("rename")} />
            <MenuItem label="Delete" destructive onSelect={() => setChosen("delete")} />
          </MenuContent>
        </Menu>
        <Button variant="outline" content="Edit" onClick={() => setDialogOpen(true)} />
      </div>
      <p role="status" aria-label="Chosen">
        {chosen}
      </p>
      <iframe
        title="Framed app"
        src={GRABBING_FRAME}
        className="h-40 w-full border border-foreground/10"
      />
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            fieldRef.current?.focus();
          }}
        >
          <DialogTitle>Edit</DialogTitle>
          <DialogDescription>
            A framed app focusing itself must not take this field.
          </DialogDescription>
          <Input ref={fieldRef} aria-label="Title" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * A menu stays open when the framed app takes focus, and the guard's capture listener stops that blur
 * before a bubble listener added earlier — Radix's kind — hears it.
 */
export const MenuStaysOpen: Story = {
  render: () => <FramedPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await body().findByRole("menu");
    await expect(frame()?.inert).toBe(true);

    const before = bubbleBlurs;
    await expect(await grabFocus()).toBe(true);
    await expect(body().queryByRole("menu")).not.toBeNull();
    await expect(bubbleBlurs).toBe(before);
    await waitFor(() => expect(document.activeElement?.closest('[role="menu"]')).not.toBeNull());

    await userEvent.click(body().getByRole("menuitem", { name: "Rename" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("status", { name: "Chosen" })).toHaveTextContent("rename");
    await expect(frame()?.inert).toBe(false);
  },
};

/**
 * A click where the frame sits lands on the page under it, since the frame is inert, and closes the
 * menu as a click outside it should. The test reads what is under the frame's middle, as the browser
 * does, and presses there: a testing library refuses to press an element with no pointer events.
 */
export const ClickOnFrameCloses: Story = {
  render: () => <FramedPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await body().findByRole("menu");
    const target = frame();
    if (target === null) {
      throw new Error("The framed app is not on the page.");
    }
    const box = target.getBoundingClientRect();
    const under = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(under).not.toBe(target);
    if (under === null) {
      throw new Error("Nothing is under the frame.");
    }
    fireEvent.pointerDown(under);
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(target.inert).toBe(false);
  },
};

/**
 * A window blur with focus still in the menu, and the window really unfocused — a switch of tab or
 * app — closes it, a tick later than Radix alone would. A test cannot leave its own window, so it
 * says what the browser would: the document no longer has focus.
 */
export const RealBlurCloses: Story = {
  render: () => <FramedPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await body().findByRole("menu");
    const hasFocus = document.hasFocus;
    document.hasFocus = () => false;
    try {
      window.dispatchEvent(new FocusEvent("blur"));
      await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    } finally {
      document.hasFocus = hasFocus;
    }
  },
};

/** A dialog keeps its field focused when the framed app takes focus, and keeps what was typed. */
export const DialogKeepsFocus: Story = {
  render: () => <FramedPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    const field = await body().findByRole("textbox", { name: "Title" });
    await waitFor(() => expect(document.activeElement).toBe(field));
    await userEvent.keyboard("ab");

    await expect(await grabFocus()).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(field));
    await userEvent.keyboard("cd");
    await expect(field).toHaveValue("abcd");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(frame()?.inert).toBe(false);
  },
};
