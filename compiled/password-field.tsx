/**
 * Copied from `registry/web/password-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * `PasswordField`, for the apps that import it from here. It lives in `app-form` now, so it is on
 * `field.*` beside the other light fields; this file is the old import path, kept working.
 */
import { PasswordField } from "./app-form";
import { PasswordInput } from "./password-input";

// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone, so the `from` form would ship
// a path that does not exist in a consumer's tree. See AGENTS.md.
export { PasswordField, PasswordInput };
