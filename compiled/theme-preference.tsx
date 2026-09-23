/**
 * Copied from `registry/ui/theme-preference.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The theme preference on the web — an Expo app's web build, where Metro picks this file over
 * `theme-preference.tsx`, and a DOM app, where it is the whole item. `theme-preference-base.ts`
 * holds what the two halves share.
 *
 * `localStorage` is the store, and the source of truth: the hook reads it through
 * `useSyncExternalStore`, so two components calling the hook, or two tabs, cannot disagree.
 * Applying the choice is a class on `<html>` — see `THEME_PRE_PAINT_SCRIPT` for the rule and why
 * System still sets `dark` on a dark device.
 *
 * Nothing touches `window` at import, and the server snapshot is `system`, so a server render
 * paints what the pre-paint script is about to correct rather than throwing.
 */

import { useEffect, useSyncExternalStore } from "react";
import {
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ThemePreferenceOptions,
  type ThemePreferenceState,
} from "@/components/ui/theme-preference-base";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Every hook on the page, told when one of them writes. `storage` events only reach other tabs. */
const listeners = new Set<() => void>();

/** The choice when storage refused it, so a click still sticks for the life of the page. */
let unsaved: ThemePreference | null = null;

function read(): ThemePreference {
  if (unsaved) return unsaved;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    // Storage switched off, or a sandboxed frame: there is nothing to read, which is `system`.
    return "system";
  }
}

function prefersDark() {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches;
}

function apply(preference: ThemePreference) {
  const classes = document.documentElement.classList;
  classes.toggle("dark", preference === "dark" || (preference === "system" && prefersDark()));
  classes.toggle("light", preference === "light");
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Module-level, so every caller's setter is the same function and safe in a dependency list. */
function setPreference(next: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    unsaved = null;
  } catch {
    // Not persisted, but still applied: the page should not ignore the click.
    unsaved = next;
  }
  apply(next);
  for (const listener of listeners) listener();
}

/**
 * The stored light / dark / system choice, and a setter that stores and applies it. Call it where
 * the app starts, so the choice is applied — and, on System, kept in step with the device — on
 * every screen, not only the one with the picker on it.
 */
export function useThemePreference(_options: ThemePreferenceOptions = {}): ThemePreferenceState {
  const preference = useSyncExternalStore(subscribe, read, () => "system" as const);

  useEffect(() => {
    apply(preference);
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    // Following the device means repainting when the device changes, without a reload.
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  return [preference, setPreference] as const;
}
