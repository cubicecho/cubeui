/**
 * Not a story: a typecheck fixture. Every call site below is written the way shadcn's own docs
 * (new-york-v4) write it, against the web halves `@/components/ui/*` resolves to under
 * `tsconfig.web.json`. If one stops compiling, a primitive has stopped being a superset of
 * shadcn's DOM API — which is the promise that lets a shadcn app switch registries without
 * touching its call sites. Nothing renders it; `tsc` is the test.
 *
 * The `@ts-expect-error` lines pin the other half: the contract is still checked, so a widening
 * did not quietly turn a prop into `any`.
 */
import * as React from "react";
import { COLOR_SWATCHES, ColorPicker } from "@/components/color-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ButtonCompat() {
  const ref = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button
        ref={ref}
        type="submit"
        variant="outline"
        size="icon-sm"
        onClick={(event) => event.preventDefault()}
        aria-label="Edit"
        data-testid="edit"
        form="settings"
      >
        <span />
      </Button>
      <Button size="xs">Tiny</Button>
      <Button size="icon-xs" variant="ghost" aria-label="x" />
      <Button size="icon-lg" variant="secondary" aria-label="y" />
      <Button asChild variant="link">
        <a href="/docs">Docs</a>
      </Button>
      <a className={buttonVariants({ variant: "destructive", size: "sm" })} href="/delete">
        Delete
      </a>
      {/* @ts-expect-error — not a size shadcn or cubeui has. */}
      <Button size="huge">No</Button>
    </>
  );
}

export function DialogCompat() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} modal>
        <DialogContent className="sm:max-w-md" showCloseButton={false} onOpenAutoFocus={() => {}}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes to your profile here.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Open</Button>
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay className="bg-black/50" />
        </DialogPortal>
        <DialogClose className="absolute" id="close" />
      </Dialog>
    </>
  );
}

export function PopoverCompat() {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div />
      </PopoverAnchor>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} className="w-80">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

export function TooltipCompat() {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={200}>
      <Tooltip open defaultOpen onOpenChange={() => {}} delayDuration={100}>
        <TooltipTrigger className="underline" type="button">
          Hover
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={0} align="start" className="max-w-xs">
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TabsCompat() {
  const [tab, setTab] = React.useState("account");
  return (
    <>
      <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="w-[400px]">
        <TabsList aria-label="Settings">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password" disabled>
            Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" forceMount>
          Account
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}

export function LabelCompat() {
  return (
    <Label htmlFor="email" id="email-label" onClick={() => {}}>
      Email
    </Label>
  );
}

export function BadgeCompat() {
  return (
    <>
      <Badge
        variant="secondary"
        className="text-blue-600"
        style={{ color: "red" }}
        title="Verified"
      >
        <span />
        Verified
      </Badge>
      <Badge variant="destructive">{8}</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge asChild variant="link">
        <a href="/x">Release notes</a>
      </Badge>
      <a className={badgeVariants({ variant: "outline" })} href="/y">
        Outline
      </a>
      {/* @ts-expect-error — not a variant. */}
      <Badge variant="neon">No</Badge>
    </>
  );
}

export function CardCompat() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email</CardDescription>
      </CardHeader>
      <CardContent>
        <Separator orientation="vertical" className="my-4" />
        <Skeleton className="h-4 w-[250px]" />
      </CardContent>
      <CardFooter className="flex-col gap-2" />
    </Card>
  );
}

export function AlertDialogCompat() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CommandCompat() {
  const [open, setOpen] = React.useState(false);
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Suggestions" forceMount>
          <CommandItem onSelect={() => {}}>Calendar</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function RadioGroupCompat() {
  return (
    <RadioGroup defaultValue="comfortable">
      <RadioGroupItem value="default" id="r1" title="The default spacing" />
    </RadioGroup>
  );
}

export function CalendarCompat() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      captionLayout="dropdown"
      showOutsideDays={false}
      className="rounded-md border shadow-sm"
    />
  );
}

export function ColorPickerCompat() {
  const [color, setColor] = React.useState<string | null>(null);
  return (
    <>
      {/* `main`'s popover picker's API. */}
      <ColorPicker
        value={color}
        onValueChange={setColor}
        swatches={COLOR_SWATCHES}
        placeholder="No color"
        popoverLabel="Colour"
        hexLabel="Hex"
        customLabel="Custom colour"
        swatchesLabel="Swatches"
        clearable
        clearLabel="Clear"
        disabled={false}
        contentClassName="w-64"
        id="colour"
        aria-label="Colour"
        aria-describedby="colour-help"
        aria-invalid={false}
        aria-required
      />
      {/* This registry's own. */}
      <ColorPicker value={color ?? ""} onChange={setColor} colors={["#000000"]} />
    </>
  );
}
