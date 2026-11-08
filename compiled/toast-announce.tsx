/**
 * Copied from `registry/ui/toast-announce.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * Says a toast aloud on the web, which needs nothing said: the stack is a live region, and a
 * `status` or an `alert` drawn in it is read by the browser. `toast-announce.tsx` is the device
 * half, for iOS, which has no live regions.
 */

/** Nothing: the live region announces the toast. */
export function announceToast(_message: string, _interrupt: boolean): void {}
