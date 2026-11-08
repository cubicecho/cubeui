/**
 * The native tooltip: long-press the trigger and the bubble appears above it
 * for a few seconds.
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
} from "@/components/ui/tooltip-base";
import { addHandlers, cn } from "@/lib/utils";

type TooltipState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * Where the trigger was last laid out in its parent. A ref, not state: every icon button has a
   * tooltip, and a render per button per layout is paid for a bubble that is rarely opened.
   */
  frame: RefObject<LayoutRectangle | null>;
};

const TooltipContext = createContext<TooltipState>({
  open: false,
  setOpen: () => {},
  frame: { current: null },
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
  const frame = useRef<LayoutRectangle | null>(null);
  return (
    <TooltipContext.Provider value={{ open, setOpen, frame }}>{children}</TooltipContext.Provider>
  );
}

/**
 * The element the tooltip describes: hovered or focused on the web, long-pressed on device.
 *
 * With `asChild` the child is handed `onLongPress` and `onLayout`, and has to put both on the
 * element it draws, as a `Pressable` and a `Button` do. Without `onLayout` the bubble has nowhere
 * to go and is not drawn.
 */
function TooltipTrigger({ asChild, className, children }: TooltipTriggerProps) {
  const { setOpen, frame } = useContext(TooltipContext);
  const show = () => setOpen(true);
  const measure = (event: LayoutChangeEvent) => {
    frame.current = event.nativeEvent.layout;
  };
  if (asChild && isValidElement(children)) {
    return addHandlers(children, { onLongPress: show, onLayout: measure });
  }
  return (
    <Pressable onLongPress={show} onLayout={measure} className={cn(className)}>
      {children}
    </Pressable>
  );
}

/** How long the bubble stays up before dismissing itself. */
const VISIBLE_MS = 2500;

/** The tooltip's bubble and its text. */
function TooltipContent({ side = "top", className, children }: TooltipContentProps) {
  const { open, setOpen, frame } = useContext(TooltipContext);

  useEffect(() => {
    if (open === false) {
      return;
    }
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [open, setOpen]);

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
        <Text className={TOOLTIP_TEXT_CLASS}>{children}</Text>
      </View>
    </View>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
