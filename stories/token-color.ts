/**
 * What `var(--<token>)` resolves to right now, in the colour syntax the browser reports a computed
 * colour in, so an assertion compares like with like whichever notation the stylesheet emitted.
 *
 * Resolved inside `inside`, the page's body unless given: pass the story's own element where a
 * palette or a theme is set on an ancestor of it rather than on the page.
 */
export function tokenColor(token: string, inside: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  inside.append(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}
