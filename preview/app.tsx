import { Boxes, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { useState } from "react";

import { CardLayout } from "@/registry/new-york/layout/card-layout";
import { DialogLayout } from "@/registry/new-york/layout/dialog-layout";
import { StickyHeaderContentFooter } from "@/registry/new-york/layout/header-content-footer";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import { Separator } from "@/registry/new-york/ui/separator";

/** Enough fields to push the dialog past its cap, which is the thing worth looking at. */
const FIELDS = [
  "Workspace name",
  "Description",
  "Endpoint",
  "Bearer token",
  "Default model",
  "Refining agent",
  "Retry limit",
  "Timeout",
  "Webhook URL",
  "Owner",
  "Notes",
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        setDark((on) => !on);
        document.documentElement.classList.toggle("dark");
      }}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function Rows({ items }: { items: string[] }) {
  return items.map((item) => (
    <div
      key={item}
      className="flex items-center justify-between border-b py-2 text-sm last:border-0"
    >
      <span className="truncate">{item}</span>
      <Button variant="ghost" size="icon" aria-label={`Delete ${item}`} className="size-8">
        <Trash2 />
      </Button>
    </div>
  ));
}

export function App() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <StickyHeaderContentFooter
      width="page"
      className="h-dvh"
      header={
        <div className="flex min-h-14 items-center justify-between gap-4 border-b px-4 py-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">cubeui</h1>
            <p className="truncate text-sm text-muted-foreground">
              Layout shells, in the chassis they are built on.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DialogLayout
              trigger={<Button>New workspace</Button>}
              title="New workspace"
              description="The body scrolls; the title and the buttons do not."
              size="lg"
              content={
                <div className="flex flex-col gap-4 py-2">
                  {FIELDS.map((field) => (
                    <div key={field} className="flex flex-col gap-2">
                      <Label htmlFor={field}>{field}</Label>
                      <Input id={field} placeholder={field} />
                    </div>
                  ))}
                </div>
              }
              footer={
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  Delete
                </Button>
              }
              footerActions={
                <>
                  <Button variant="ghost">Cancel</Button>
                  <Button>Save</Button>
                </>
              }
            />
            <ThemeToggle />
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
          <span>3 components</span>
          <span>The body above scrolls; this stays.</span>
        </div>
      }
      content={
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <CardLayout
            icon={<Boxes />}
            title="Servers"
            description="Disable one to drop it from the aggregate without removing its overrides."
            action={
              <Button size="sm">
                <Plus />
                Add
              </Button>
            }
            content={<Rows items={["mcp-router", "kanban", "philotes", "eunomia"]} />}
            footer={<span className="text-xs text-muted-foreground">Updated 2 minutes ago</span>}
            footerActions={<Button size="sm">Save</Button>}
          />

          <CardLayout
            title="Categories"
            description="Deleting a category keeps its activities — they go back to uncategorized."
            // An empty map, which is what a card is handed the moment its data is empty.
            content={<Rows items={[]} />}
            empty={<p className="text-sm text-muted-foreground">No categories yet.</p>}
          />

          <CardLayout
            title="Still fetching"
            description="`loading` outranks `empty`: nothing has come back, so nothing says it is empty."
            loading={loading}
            content={<Rows items={["one", "two", "three"]} />}
            empty={<p className="text-sm text-muted-foreground">No rows.</p>}
            footerActions={
              <Button size="sm" variant="outline" onClick={() => setLoading((on) => !on)}>
                {loading ? "Land the data" : "Fetch again"}
              </Button>
            }
          />

          <CardLayout
            title="No footer, no action"
            content={
              <p className="text-sm text-muted-foreground">
                An absent slot draws nothing — no empty wrapper, no spent gap.
              </p>
            }
          />

          <CardLayout
            title="Controlled dialog"
            description="Opened from outside its own trigger."
            content={
              <>
                <p className="text-sm text-muted-foreground">
                  Pass <code className="font-mono text-xs">open</code> and{" "}
                  <code className="font-mono text-xs">onOpenChange</code> when a row menu, a route
                  or a shortcut opens it. Leave both off and the trigger drives it.
                </p>
                <Separator className="my-3" />
                <DialogLayout
                  open={open}
                  onOpenChange={setOpen}
                  title="Delete workspace?"
                  description="Its servers go, and every override with them."
                  size="sm"
                  content={
                    <p className="py-2 text-sm text-muted-foreground">
                      A short dialog does not scroll, and the footer sits where the content ends.
                    </p>
                  }
                  footerActions={
                    <>
                      <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => setOpen(false)}>
                        Delete
                      </Button>
                    </>
                  }
                />
              </>
            }
            footerActions={
              <Button size="sm" onClick={() => setOpen(true)}>
                Open
              </Button>
            }
          />

          <div className="h-[60vh] rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
            Filler, so the page has something to scroll under the header.
          </div>
        </div>
      }
    />
  );
}
