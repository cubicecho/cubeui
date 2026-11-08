/**
 * The native tooltip: long-press the trigger and the bubble appears above it,
 * for a time that grows with its text and starts again when the finger lifts.
 *
 * Hover does not exist on a touch screen, so radix's trigger has no direct
 * equivalent — but dropping the content entirely would lose the only place
 * some labels are written down. Long-press is the platform's own convention
 * for "tell me more about this control", and it costs no dependency.
 *
 * There is no wrapper around the trigger, as there is none on web, where radix's
 * root is a fragment. A `View` around it took the trigger's place in its parent,
 * so the trigger's own `absolute top-2 right-2` or `ml-auto` placed it inside the
 * wrapper rather than in the row (#423), and every icon `Button` has a tooltip.
 * The trigger reports where it was laid out instead, and the bubble is drawn
 * beside it in the same parent, over a box at that place and size.
 */

import {
  createContext,
  isValidElement,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type LayoutChangeEvent, type LayoutRectangle, Pressable, Text, View } from "react-native";
import {
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_SIDE_CLASS,
  TOOLTIP_TEXT_CLASS,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
  tooltipVisibleMs,
} from "@/components/ui/tooltip-base";
import { addHandlers, CardBodyContext, cn } from "@/lib/utils";

type TooltipState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * Where the trigger was last laid out in its parent. A ref, not state: every icon button has a
   * tooltip, and a render per button per layout is paid for a bubble that is rarely opened.
   */
  frame: RefObject<LayoutRectangle | null>;
  /** Counts the releases of an open bubble's trigger, so its clock starts again from each. */
  released: number;
  release: () => void;
};

const TooltipContext = createContext<TooltipState>({
  open: false,
  setOpen: () => {},
  frame: { current: null },
  released: 0,
  release: () => {},
});

/**
 * Nothing to provide on native; kept so call sites need not branch.
 *
 * `delayDuration` and `skipDelayDuration` are accepted and ignored. They describe
 * hover timing, and there is no hover here — the delay a touch user experiences is
 * the long press itself, which the platform already times.
 */
function TooltipProvider({ children }: TooltipProviderProps) {
  return children;
}

/** The root of a tooltip: it holds the open state. */
function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [released, setReleased] = useState(0);
  const frame = useRef<LayoutRectangle | null>(null);
  const release = () => setReleased((count) => count + 1);
  return (
    <TooltipContext.Provider value={{ open, setOpen, frame, released, release }}>
      {children}
    </TooltipContext.Provider>
  );
}

/**
 * The element the tooltip describes: hovered or focused on the web, long-pressed on device.
 *
 * With `asChild` the child is handed `onLongPress`, `onPressOut` and `onLayout`, and puts them on
 * the element it draws, as a `Pressable` and a `Button` do. Without `onLayout` the bubble has
 * nowhere to go and is not drawn; without `onPressOut` its clock runs from the long press alone.
 */
function TooltipTrigger({ asChild, className, children }: TooltipTriggerProps) {
  const { open, setOpen, frame, release } = useContext(TooltipContext);
  const show = () => setOpen(true);
  const lift = () => {
    if (open) {
      release();
    }
  };
  const measure = (event: LayoutChangeEvent) => {
    frame.current = event.nativeEvent.layout;
  };
  if (asChild && isValidElement(children)) {
    return addHandlers(children, { onLongPress: show, onPressOut: lift, onLayout: measure });
  }
  return (
    <Pressable onLongPress={show} onPressOut={lift} onLayout={measure} className={cn(className)}>
      {children}
    </Pressable>
  );
}

/** The tooltip's bubble and its text. */
function TooltipContent({ side = "top", className, children }: TooltipContentProps) {
  const { open, setOpen, frame, released } = useContext(TooltipContext);
  // A fixed 2.5s took a long hint away mid-sentence (WCAG 2.2.1), so the time grows with the text.
  // The clock runs from the long press and starts again when the finger lifts. It does not wait
  // for the lift: a release that never arrives (react-native-web drops one after a hold of a few
  // seconds) would leave the bubble up for good.
  const visibleMs = tooltipVisibleMs(children);

  // `released` is what restarts the clock; the effect does not read it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs again on each release
  useEffect(() => {
    if (open === false) {
      return;
    }
    const timer = setTimeout(() => setOpen(false), visibleMs);
    return () => clearTimeout(timer);
  }, [open, setOpen, visibleMs, released]);

  const at = frame.current;
  if (open === false || at === null) {
    return null;
  }
  // A box over the trigger, in the trigger's parent, so the side classes place the bubble against
  // the trigger as they did against the wrapper. A layout's position counts the parent's border
  // and an absolute one starts inside it, so a bordered parent moves the bubble by that border.
  return (
    <View
      className="absolute z-50"
      style={{
        left: at.x,
        top: at.y,
        width: at.width,
        height: at.height,
        pointerEvents: "none",
      }}
    >
      <View
        role="tooltip"
        className={cn("absolute", TOOLTIP_SIDE_CLASS[side], TOOLTIP_CONTENT_CLASS, className)}
      >
        <CardBodyContext.Provider value={false}>
          <Text className={TOOLTIP_TEXT_CLASS}>{children}</Text>
        </CardBodyContext.Provider>
      </View>
    </View>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
