/**
 * Says a toast aloud on the web, which needs nothing said: the stack is a live region, and a
 * `status` or an `alert` drawn in it is read by the browser. `toast-announce.tsx` is the device
 * half, for iOS, which has no live regions.
 */

/** Nothing: the live region announces the toast. */
export function announceToast(_message: string, _interrupt: boolean): void {}
