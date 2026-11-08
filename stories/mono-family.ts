/**
 * The theme's monospace stack (`--font-mono`) as the browser writes a computed `font-family`, to
 * compare with one read off an element: the variable's own text is quoted and spaced as the
 * stylesheet wrote it, and the computed value is not.
 *
 * Read in a shadow root made once, as `tokenColor` is, so a call inside a `waitFor` does not change
 * the document it watches (#497). The variable inherits into it; the stylesheet's classes would not.
 */
let probe: HTMLSpanElement | undefined;

export function monoFamily(): string {
  if (probe?.isConnected !== true) {
    const host = document.createElement("span");
    host.hidden = true;
    document.documentElement.append(host);
    probe = host.attachShadow({ mode: "open" }).appendChild(document.createElement("span"));
    probe.style.fontFamily = "var(--font-mono)";
  }
  return getComputedStyle(probe).fontFamily;
}
