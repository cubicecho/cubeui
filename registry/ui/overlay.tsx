/**
 * Where something that floats is drawn on device, so that the box it was opened from does not clip
 * it and an open dialog does not cover it.
 *
 * React Native has no portal. A tooltip drawn beside its trigger is clipped by every `ScrollView`
 * it is inside: the top bar's places and a folded sidebar (#509). And a `Modal` is a window of its
 * own, so a toast drawn in the app's tree stays under an open dialog until the dialog closes
 * (#500). So a layer is drawn over the app once, at its root (`OverlayHost`, which `ToastProvider`
 * already draws on device), and again inside every `Modal` the registry opens (`OverlayLayer`:
 * the dialog, the popover, the menu and the select). What floats is drawn in the top one.
 *
 * Three ways were weighed (#509). A transparent `Modal` per tooltip needs no setup, but it is a
 * window for every bubble: it takes the touches meant for the screen under it while it is up, a
 * screen reader moves into it, and a toast would still need to be over other modals. react-native-
 * screens' `FullWindowOverlay` is over everything, but only on iOS: on Android a `Modal` is a
 * dialog window, and only what is inside it is drawn over it. A layer inside each modal is the one
 * that works on both, with no new dependency.
 *
 * A store rather than a context, as `bottom-bar` is: the toast stack is drawn by a provider near
 * the root, above the dialog that opens a layer, and a context only flows down.
 *
 * The web draws none of this. Radix portals its overlays to `<body>` and the toast stack is fixed
 * over dialogs, so nothing there opens a layer, `useTopLayer` is `null`, and the stack is drawn
 * where it always was.
 */
import {
  Fragment,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Platform, View } from "react-native";

/** A box drawn over the app, or over a modal, that floating content is drawn into. */
export type Layer = {
  /**
   * The layer's own element. On device a `View`, measured in the window so what is drawn into it
   * can be placed against something measured the same way.
   */
  readonly node: { current: unknown };
  /** Draws `content` in the layer, or replaces what was drawn under the same `id`. */
  put: (id: string, content: ReactNode) => void;
  /** Takes away what was drawn under `id`. */
  remove: (id: string) => void;
};

type Entry = { layer: Layer; modal: boolean };

const entries: Entry[] = [];
const listeners = new Set<() => void>();
let top: Layer | null = null;

function publish() {
  // A modal's layer is over the app's whichever mounted first. A dialog that is open on the first
  // render would register before the root around it, because a child's effects run first.
  let modal: Entry | undefined;
  for (const entry of entries) {
    if (entry.modal) {
      modal = entry;
    }
  }
  top = (modal ?? entries.at(-1))?.layer ?? null;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read() {
  return top;
}

function serverRead() {
  return null;
}

/**
 * The layer floating content goes in: the last modal's that is open, or the app's. `null` when
 * nothing draws one, as on the web, where the caller draws in place.
 */
export function useTopLayer(): Layer | null {
  return useSyncExternalStore(subscribe, read, serverRead);
}

const EMPTY: ReadonlyMap<string, ReactNode> = new Map();

/** The box itself: over the whole of its parent, and only what is drawn in it takes a touch. */
function LayerBox({ modal }: { modal: boolean }) {
  const node = useRef<unknown>(null);
  const [content, setContent] = useState(EMPTY);

  useLayoutEffect(() => {
    const layer: Layer = {
      node,
      put: (id, next) => setContent((drawn) => new Map(drawn).set(id, next)),
      remove: (id) =>
        setContent((drawn) => {
          if (drawn.has(id) === false) {
            return drawn;
          }
          const left = new Map(drawn);
          left.delete(id);
          return left;
        }),
    };
    const entry: Entry = { layer, modal };
    entries.push(entry);
    publish();
    return () => {
      entries.splice(entries.indexOf(entry), 1);
      publish();
    };
  }, [modal]);

  return (
    <View
      ref={(element) => {
        node.current = element;
      }}
      pointerEvents="box-none"
      className="absolute inset-0"
    >
      {Array.from(content, ([id, drawn]) => (
        <Fragment key={id}>{drawn}</Fragment>
      ))}
    </View>
  );
}

/**
 * The app's layer, for what floats over its screens: a tooltip opened inside a `ScrollView` is
 * drawn here, outside it, rather than clipped by it. Put it once near the root, inside the
 * providers its content reads (the palette's), as `ToastProvider` goes. `ToastProvider` draws one
 * itself, so an app that has one needs no other.
 *
 * On device only. Under the web the tooltip is radix's and portals to `<body>`, and a layer here
 * would take the toast stack out of the place a DOM app's dialogs expect it.
 */
export function OverlayHost({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      {Platform.OS === "web" ? null : <LayerBox modal={false} />}
    </>
  );
}

/**
 * A modal's layer, drawn last inside its `Modal`, so a tooltip or a toast raised while it is open
 * is drawn over it. The dialog, the popover, the menu and the select each draw one.
 */
export function OverlayLayer() {
  return <LayerBox modal />;
}

/**
 * Draws `children` in `layer` instead of here. They are drawn under the layer's providers, not
 * this element's, so they should read nothing from a context of their own.
 */
export function OverlayPortal({ layer, children }: { layer: Layer; children: ReactNode }) {
  const id = useId();
  // On every render, so the layer draws what this element would have.
  useLayoutEffect(() => {
    layer.put(id, children);
  });
  useLayoutEffect(() => () => layer.remove(id), [layer, id]);
  return null;
}
