/**
 * Whether a disclosure chevron is turned to point down, however its half says so: Tailwind's
 * `rotate` property on the compiled half, or a `transform` where NativeWind styles the native one.
 */
export function isTurned(svg: Element) {
  const style = getComputedStyle(svg);
  return style.rotate === "90deg" || /^matrix\(0, 1, -1, 0/.test(style.transform);
}
