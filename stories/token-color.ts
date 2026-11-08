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
 * What `var(--<token>)` resolves to right now, in the colour syntax the browser reports a computed
 * colour in, so an assertion compares like with like whichever notation the stylesheet emitted.
 *
 * It is read off `color`, and serves a background or a border as well: a colour computes to the
 * same spelling whichever property holds it.
 */
export function tokenColor(
  token: string,
  { inside = document.body, opacity }: TokenColorOptions = {},
) {
  const probe = document.createElement("span");
  probe.style.color =
    opacity === undefined
      ? `var(--${token})`
      : `color-mix(in oklab, var(--${token}) ${opacity}%, transparent)`;
  inside.append(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}
