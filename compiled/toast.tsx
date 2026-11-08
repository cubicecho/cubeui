/**
 * Compiled from `registry/ui/toast.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * Transient messages for mutations fired outside a form.
 *
 * A dialog can show a failure beside its form, and a card can show one in
 * the card. Everything else — a checkbox toggled in a list, a drag that
 * reorders, a switch on a settings row — has no surface of its own, so those failures reach
 * `console.error` and nowhere else: the control springs back and the user is
 * never told why. This is the surface for those.
 *
 * Built on react-native primitives rather than `<div>` so the same provider
 * serves web and native; only the viewport's positioning differs.
 *
 * A toast can carry an `actionSlot`: elements of the caller's, drawn under the message — a link to
 * where the thing went, an Undo. Pressing them does not dismiss the toast; pass a function
 * `(dismiss) => …` to close it from inside. A toast with one stays up longer, so there is time to
 * reach it.
 *
 * On the web the stack stays reachable while a dialog is open (#477): it is drawn above dialogs,
 * and it is a live region from the first render, which is what keeps radix's `hideOthers` from
 * marking it `aria-hidden` when a modal opens.
 */
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconClassContext } from "@/components/ui/icons-base";
import { type BottomBarUntil, useBottomBar } from "@/lib/bottom-bar";
import { cn, hasSlot, type SlotNode, touchTarget } from "@/lib/utils";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "./icons";

/** The dismiss ✕'s drawn box, a 16px glyph in `p-1`, grown to a finger's 44pt on device (#470). */
const DISMISS_DRAWN = { width: 24, height: 24 } as const;

/**
 * What kind of message a toast is, which picks its colour, how long it stays and how it is
 * announced. The colour tokens' words: `negative` for a failure, `warning`, `positive` and `info`.
 * `error` is `negative`'s old name, kept working and deprecated.
 */
export type ToastTone = Tone | "error";

/** The tones, without the deprecated name. */
type Tone = "negative" | "warning" | "positive" | "info";

/** `error` was the one tone not named for its token. */
const TONE: Record<ToastTone, Tone> = {
  negative: "negative",
  error: "negative",
  warning: "warning",
  positive: "positive",
  info: "info",
};

/**
 * What a toast carries besides its words: elements to act on the message with. A function is handed
 * the toast's `dismiss`, for content that should close it — a link that navigates away.
 */
export type ToastActionSlot = SlotNode | ((dismiss: () => void) => SlotNode);

/** What else a toast can carry. */
export type ToastOptions = {
  /**
   * Elements under the message: a link-styled `Button`, an Undo, anything. Pressing them does not
   * dismiss the toast; a function `(dismiss) => …` gets the toast's `dismiss` to do that.
   */
  actionSlot?: ToastActionSlot | undefined;
};

type Toast = {
  id: number;
  message: string;
  tone: Tone;
  actionSlot: ToastActionSlot | undefined;
};

/** Show a message. Defaults to `negative`, which is what nearly every caller wants. */
type ShowToast = (message: string, tone?: ToastTone, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

/**
 * Five seconds at the least, so a message can be read by someone who looked away. Failures and
 * warnings stay longer: the user has to read a reason.
 */
const DURATION_MS: Record<Tone, number> = {
  negative: 6000,
  warning: 6000,
  positive: 5000,
  info: 5000,
};

/**
 * The least time a toast with an `actionSlot` stays up: a confirmation's five seconds is enough to
 * read "Moved." and not always enough to move the pointer to "Go to Media".
 */
const ACTION_MIN_DURATION_MS = 10000;

/**
 * A failure interrupts a screen reader; everything else waits for a pause (WCAG 4.1.3). A
 * warning is not a failure: nothing has stopped the user's work.
 */
const ROLE: Record<Tone, "alert" | "status"> = {
  negative: "alert",
  warning: "status",
  positive: "status",
  info: "status",
};

/**
 * How many toasts are drawn at once, the newest. A longer stack covers the page and is read as
 * noise; the older ones keep their timers, and come back if the newer go first.
 */
const MAX_VISIBLE = 3;

/**
 * The tone's glyph and its ink: the only place the tone's hue reaches the toast. The box is a
 * raised surface and the words are the foreground, so a toast does not read as a filled button —
 * which a block of `bg-negative` with white text beside an ✕ was — and the tone is said by a shape
 * as well as a colour.
 */
const TONE_ICON: Record<Tone, { glyph: ReactNode; ink: string }> = {
  negative: { glyph: <CircleAlert />, ink: "text-negative" },
  warning: { glyph: <TriangleAlert />, ink: "text-warning" },
  positive: { glyph: <CircleCheck />, ink: "text-positive" },
  info: { glyph: <Info />, ink: "text-info" },
};

/**
 * `position: "fixed"` keeps the stack pinned to the viewport on web no matter
 * which scroll container the mutation was fired from. It is a real CSS value
 * that react-native-web passes through, but not one react-native's `ViewStyle`
 * admits, hence the cast. Native gets `absolute`, which resolves against the
 * router's full-screen container.
 *
 * `zIndex` 60 is one over the dialog's 50, so a toast raised while a dialog is open is drawn over
 * its scrim rather than under it. A stacking context around the provider would cap it, which is
 * why the provider goes near the root.
 */
const VIEWPORT_STYLE = {
  position: "fixed",
  right: 16,
  bottom: 16,
  width: 384,
  maxWidth: "calc(100vw - 32px)",
  zIndex: 60,
} as React.CSSProperties;

/**
 * How far the stack rises off the bottom while a layout draws a bar there — `SidebarLayout`'s
 * `barPosition="bottom"` on a phone — so a toast is never laid over the places. The bar's own
 * `min-h-14` and the bottom safe-area inset the bar pads itself by (#460), under the bar's own
 * breakpoint; a margin, which a fixed or absolute box keeps from the edge it is pinned to. Literal
 * classes, per rule 3.
 */
const LIFT: Record<BottomBarUntil, string> = {
  always: "mb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)]",
  sm: "mb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] sm:mb-0",
  md: "mb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] md:mb-0",
  lg: "mb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] lg:mb-0",
  xl: "mb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] xl:mb-0",
};

/** What holds the timers: a pointer over a toast, or focus inside one. */
type Holds = { hovered: boolean; focused: boolean };

const NO_HOLDS: Holds = { hovered: false, focused: false };

/** A toast's timer, which can stop and start again with what it had left. */
type Timer = { remaining: number; startedAt: number; handle: ReturnType<typeof setTimeout> | null };

/** Holds the toasts and draws them over the app. Put it once, near the root. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, Timer>());
  const holds = useRef<Holds>(NO_HOLDS);
  const bottomBar = useBottomBar();

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      stopTimer(timer);
      timers.current.delete(id);
    }
    if (timers.current.size === 0) {
      // The pointer that was over the last toast, or the focus that was in it, went with it and
      // will not say so: a leave is never fired for an element that is gone.
      holds.current = NO_HOLDS;
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTimer = useCallback(
    (id: number, timer: Timer) => {
      timer.startedAt = Date.now();
      timer.handle = setTimeout(() => dismiss(id), timer.remaining);
    },
    [dismiss],
  );

  // A toast someone is reading or reaching for does not leave under them, so the clocks stop
  // while the pointer is over a toast or focus is in one, and go on with what they had left.
  const hold = useCallback(
    (reason: keyof Holds, on: boolean) => {
      const wasHeld = isHeld(holds.current);
      holds.current = { ...holds.current, [reason]: on };
      const held = isHeld(holds.current);
      if (held === wasHeld) {
        return;
      }
      for (const [id, timer] of timers.current) {
        if (held) {
          stopTimer(timer);
        } else {
          startTimer(id, timer);
        }
      }
    },
    [startTimer],
  );

  const show = useCallback<ShowToast>(
    (message, tone = "negative", options = {}) => {
      const id = nextId.current++;
      const { actionSlot } = options;
      const kind = TONE[tone];
      const hasAction = typeof actionSlot === "function" || hasSlot(actionSlot);
      const duration = hasAction
        ? Math.max(DURATION_MS[kind], ACTION_MIN_DURATION_MS)
        : DURATION_MS[kind];
      setToasts((prev) => [
        ...prev,
        { id, message, tone: kind, actionSlot: hasAction ? actionSlot : undefined },
      ]);
      const timer: Timer = { remaining: duration, startedAt: Date.now(), handle: null };
      timers.current.set(id, timer);
      if (isHeld(holds.current) === false) {
        startTimer(id, timer);
      }
    },
    [startTimer],
  );

  // A toast outlives the component that raised it, so the timer has to be
  // cleaned up here rather than at the call site.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        stopTimer(timer);
      }
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/*
       * Drawn while empty too. radix's `hideOthers` marks everything outside an opening modal
       * `aria-hidden`, except what is a live region at that moment, so a stack mounted with its
       * first toast lands inside the hidden tree and is never announced (#477). It is empty and
       * `box-none`, so it covers nothing.
       */}
      <div
        data-slot="toast-viewport"
        aria-live="polite"
        style={VIEWPORT_STYLE}
        className={cn("cube-rn-view cube-rn-pe-box-none", "gap-2", bottomBar && LIFT[bottomBar])}
      >
        {/*
         * The announcement and the dismiss target are two elements, not one. They were one — a
         * `Pressable` with `accessibilityRole="alert"` — and `rn2web` is what showed that to be
         * wrong: a role replaces an element's semantics rather than adding to them, so that
         * markup was an alert with a click handler nothing could reach by keyboard. The same
         * was true on device, where the role told the screen reader it was looking at a
         * message and not at something to activate.
         */}
        {toasts.slice(-MAX_VISIBLE).map((toast) => {
          const { glyph, ink } = TONE_ICON[toast.tone];
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: the role is a status or an alert, from a table Biome cannot read
            <div
              key={toast.id}
              role={ROLE[toast.tone]}
              onPointerEnter={() => hold("hovered", true)}
              onPointerLeave={() => hold("hovered", false)}
              onFocus={() => hold("focused", true)}
              onBlur={() => hold("focused", false)}
              className="cube-rn-view w-full flex-row items-start gap-3 rounded-md border border-foreground/10 bg-secondary px-4 py-3 shadow-md"
            >
              {/* `[&_svg]:size-4` for the web, where an icon does not read the context below and
                    drew at its own 24px beside 14px text; the context sizes it on a device. */}
              <div
                aria-hidden
                className={cn("cube-rn-view", "mt-0.5 shrink-0 [&_svg]:size-4", ink)}
              >
                <IconClassContext.Provider value={cn("size-4 shrink-0", ink)}>
                  {glyph}
                </IconClassContext.Provider>
              </div>
              {/* The action sits under the words rather than beside them: the toast is a set width,
                    and a link beside the message would squeeze it to a column. */}
              <div className="cube-rn-view min-w-0 flex-1 gap-1.5">
                <span className="cube-rn-text text-sm text-foreground">{toast.message}</span>
                {typeof toast.actionSlot === "function" || hasSlot(toast.actionSlot) ? (
                  <div className="cube-rn-view flex-row flex-wrap items-center gap-2">
                    {typeof toast.actionSlot === "function"
                      ? toast.actionSlot(() => dismiss(toast.id))
                      : toast.actionSlot}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                {...touchTarget(DISMISS_DRAWN)}
                // The ink is on the press target too, not only in the context: the glyph draws in
                // `currentColor`, and a `<button>` resets that to the UA's black.
                // Under the pointer, the keyboard and a finger it looks the same: hovered.
                className="cube-rn-view cube-rn-pressable -m-1 shrink-0 rounded-md p-1 text-foreground/60 hover:bg-hover hover:text-foreground focus-visible:bg-hover focus-visible:text-foreground focus-visible:outline-none active:bg-hover [&_svg]:size-4"
              >
                <IconClassContext.Provider value="size-4 text-foreground/60">
                  <X />
                </IconClassContext.Provider>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function isHeld(holds: Holds): boolean {
  return holds.hovered || holds.focused;
}

/** Stops a timer and keeps what it had left, for `startTimer` to go on from. */
function stopTimer(timer: Timer) {
  if (timer.handle === null) {
    return;
  }
  clearTimeout(timer.handle);
  timer.handle = null;
  timer.remaining -= Date.now() - timer.startedAt;
}

/**
 * Throws when no provider is mounted rather than silently swallowing the
 * message — a toast that never appears is the bug this module exists to fix.
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return show;
}
