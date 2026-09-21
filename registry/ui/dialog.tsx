/**
 * The native dialog: a transparent `Modal` with a dimmed backdrop and a centred
 * card, matching what radix renders on web closely enough that no call site
 * needs to branch.
 *
 * What does not carry over from radix, and is not faked here: the focus trap
 * and the scroll lock (a `Modal` already owns the screen) and the enter/exit
 * animations beyond the `fade` the `Modal` does itself. `Escape` becomes
 * `onRequestClose`, which is the Android back button.
 *
 * `open === false` renders nothing at all, so a dialog's body unmounts between
 * openings exactly as it does on web.
 */

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  useContext,
  useRef,
} from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type {
  DialogContentProps,
  DialogProps,
  DialogSectionProps,
  DialogTriggerProps,
} from "@/components/ui/dialog-base";
import { X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** The open side of the same problem, read by `DialogTrigger`. */
const DialogOpenContext = createContext<(open: boolean) => void>(() => {});

/**
 * `onEscapeKeyDown` belongs to `DialogContent` — that is where radix puts it — but the
 * thing that fires it here is the hardware back button, which `Modal` reports to
 * `Dialog`. The handler is published upward through a ref rather than downward, because
 * the component that has it is below the component that hears the event.
 */
const DialogEscapeContext = createContext<{ current: ((event: Event) => void) | undefined }>({
  current: undefined,
});

/**
 * Radix wires its `Close` up through the `Root` it is nested in. There is no
 * equivalent on native, so `Dialog` publishes the closer and `DialogContent`
 * — which owns both the backdrop and the X — reads it.
 */
const DialogCloseContext = createContext<() => void>(() => {});

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const escape = useRef<((event: Event) => void) | undefined>(undefined);

  // The trigger has to render while the dialog is shut, and everything else must not.
  // On web that falls out of radix's portal; here the children are split by type, because
  // `Modal` renders nothing at all until `visible` and a trigger inside it would never
  // appear. This is why `DialogTrigger` must be a direct child of `Dialog`.
  const parts = Children.toArray(children);
  const triggers = parts.filter((c) => isValidElement(c) && c.type === DialogTrigger);
  const rest = parts.filter((c) => !(isValidElement(c) && c.type === DialogTrigger));

  // Android's back button is native's Escape: the one way the dialog closes that the
  // caller did not ask for. `preventDefault` keeps it open, exactly as it does on web.
  const requestClose = () => {
    const handler = escape.current;
    if (!handler) return onOpenChange(false);
    const event = new Event("keydown", { cancelable: true });
    handler(event);
    if (!event.defaultPrevented) onOpenChange(false);
  };

  return (
    <DialogOpenContext.Provider value={onOpenChange}>
      {triggers}
      <DialogEscapeContext.Provider value={escape}>
        <Modal visible={open} transparent animationType="fade" onRequestClose={requestClose}>
          <DialogCloseContext.Provider value={() => onOpenChange(false)}>
            {rest}
          </DialogCloseContext.Provider>
        </Modal>
      </DialogEscapeContext.Provider>
    </DialogOpenContext.Provider>
  );
}

/**
 * A trigger, so a dialog can own its own open state at the call site.
 *
 * On web this is radix's, which also wires `aria-haspopup` and returns focus. Here
 * it is the press that flips the context's open flag — but the flag lives on
 * `Dialog`'s own props, so the native trigger is the caller's `onPress`, cloned.
 */
function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const open = useContext(DialogOpenContext);
  const show = () => open(true);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ onPress?: () => void }>, { onPress: show });
  }
  return (
    <Pressable onPress={show} role="button">
      {children}
    </Pressable>
  );
}

function DialogContent({
  className,
  showCloseButton = true,
  onEscapeKeyDown,
  onInteractOutside,
  children,
}: DialogContentProps) {
  const close = useContext(DialogCloseContext);
  const escape = useContext(DialogEscapeContext);
  escape.current = onEscapeKeyDown;

  // The backdrop press is native's "interact outside". `preventDefault` on the
  // synthetic event is what a caller uses to keep the dialog open, matching radix.
  const interactOutside = () => {
    if (!onInteractOutside) return close();
    const event = new Event("pointerdown", { cancelable: true });
    onInteractOutside(event);
    if (!event.defaultPrevented) close();
  };
  return (
    <View className="flex-1 items-center justify-center bg-black/80 p-6">
      {/* The backdrop is a sibling laid out underneath rather than a parent of
          the card, because `Pressable` has no `stopPropagation` — nesting the
          card inside it would make every press on the card close the dialog. */}
      <Pressable
        className="absolute inset-0"
        onPress={interactOutside}
        role="button"
        aria-label="Close"
      />
      <View
        className={cn(
          "w-full max-w-lg gap-4 rounded-lg border border-border bg-background p-6",
          className,
        )}
      >
        {children}
        {showCloseButton ? (
          <Pressable
            className="absolute right-4 top-4 opacity-70"
            onPress={close}
            // The `role` is hand-written because a `<button>` has no native counterpart.
            role="button"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// `space-y-*` and `space-x-*` are child-combinator utilities nativewind does
// not implement; `gap` is the cross-platform equivalent and behaves the same
// for these two rows.
function DialogHeader({ className, children }: DialogSectionProps) {
  return <View className={cn("gap-1.5", className)}>{children}</View>;
}

function DialogFooter({ className, children }: DialogSectionProps) {
  return <View className={cn("flex-row justify-end gap-2", className)}>{children}</View>;
}

function DialogTitle({ className, children }: DialogSectionProps) {
  return (
    <Text
      // The `role` is hand-written because an `<h2>` has no native counterpart.
      role="heading"
      aria-level={2}
      className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    >
      {children}
    </Text>
  );
}

function DialogDescription({ className, children }: DialogSectionProps) {
  return <Text className={cn("text-sm text-muted-foreground", className)}>{children}</Text>;
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
