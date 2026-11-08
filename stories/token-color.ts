/** Where to resolve a token, and at which of the muted steps. */
type TokenColorOptions = {
  /**
   * The element to resolve inside, the page's body unless given: pass the story's own element
   * where a palette or a theme is set on an ancestor of it rather than on the page.
   */
  inside?: Element;
  /**
   * A muted step, as `bg-active/40` or `text-foreground/60` writes it: the token mixed with
   * transparent, which is what Tailwind compiles the class to.
   */
  opacity?: number;
};

/**
 * Where a colour is spelled out: a span in a shadow root, made once.
 *
 * Not a probe appended beside the story and removed again. `waitFor` re-runs its callback on every
 * change to the document, so a `tokenColor` call inside one changed the document each time it
 * read it, and the callback re-ran itself in a loop of microtasks that never let `waitFor`'s own
 * timer fire: a condition that never came true hung the renderer instead of failing (#497). A
 * shadow root is outside what an observer of the document sees, so only the first call is a change.
 */
let probe: HTMLSpanElement | undefined;
function colourProbe() {
  if (probe?.isConnected !== true) {
    const host = document.createElement("span");
    host.hidden = true;
    document.documentElement.append(host);
    probe = host.attachShadow({ mode: "open" }).appendChild(document.createElement("span"));
  }
  return probe;
}

/**
 * What `var(--<token>)` resolves to right now, in the colour syntax the browser reports a computed
 * colour in, so an assertion compares like with like whichever notation the stylesheet emitted.
 *
 * It is read off `color`, and serves a background or a border as well: a colour computes to the
 * same spelling whichever property holds it. Safe inside a `waitFor` callback.
 */
export function tokenColor(
  token: string,
  { inside = document.body, opacity }: TokenColorOptions = {},
) {
  const value = getComputedStyle(inside).getPropertyValue(`--${token}`).trim();
  const target = colourProbe();
  target.style.color =
    opacity === undefined ? value : `color-mix(in oklab, ${value} ${opacity}%, transparent)`;
  return getComputedStyle(target).color;
}
