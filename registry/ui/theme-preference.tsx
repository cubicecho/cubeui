/**
 * The theme preference on device. `theme-preference.web.tsx` is the web half — Metro picks it for
 * an Expo app's web build — and `theme-preference-base.ts` holds what the two share.
 *
 * Applying the choice is `Appearance.setColorScheme`: the native tokens follow the system
 * appearance through `prefers-color-scheme`, and that call is what moves it for this app.
 * `"unspecified"` hands it back to the system, which then follows the device by itself — so, unlike
 * the web, System needs no listener here.
 *
 * Storing it is the app's: `storage` is an adapter over whatever the app already persists with, so
 * the item depends on no storage package. The read is asynchronous, so the stored choice lands a
 * moment after the first render — while the splash screen is still up, in an app that holds it
 * until its own state is loaded.
 */

import { useEffect, useSyncExternalStore } from "react";
import { Appearance } from "react-native";
import {
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ThemePreferenceOptions,
  type ThemePreferenceState,
  type ThemeStorage,
} from "@/components/ui/theme-preference-base";

/**
 * One preference per app, held here rather than per hook: the picker's hook and the one at the
 * app's root are the same choice. There is no device to read at import, so nothing does.
 */
let current: ThemePreference = "system";
/** The adapter the most recent hook that passed one was given, so a hook without one writes too. */
let storage: ThemeStorage | null = null;
/** Whether a stored value has been read, or overtaken by a choice made before it arrived. */
let settled = false;
const listeners = new Set<() => void>();

/**
 * "Follow the device", in the spelling both sides of React Native 0.82 accept at runtime. From 0.82
 * `setColorScheme` takes `"unspecified"` and hands `null` to the native module as is; before it,
 * `null` was the typed spelling but was turned into `"unspecified"` on the way down anyway. The
 * cast is for the 0.81 types, which do not list the string — it keeps one call compiling on both.
 */
const FOLLOW_SYSTEM = "unspecified" as unknown as Parameters<typeof Appearance.setColorScheme>[0];

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot() {
  return current;
}

function apply(next: ThemePreference) {
  current = next;
  Appearance.setColorScheme(next === "system" ? FOLLOW_SYSTEM : next);
  for (const listener of listeners) listener();
}

/** Module-level, so every caller's setter is the same function and safe in a dependency list. */
function setPreference(next: ThemePreference) {
  settled = true;
  apply(next);
  if (!storage) return;
  Promise.resolve(storage.setItem(THEME_STORAGE_KEY, next)).catch(() => {
    // Not persisted, but still applied: the app should not ignore the tap.
  });
}

/**
 * The stored light / dark / system choice, and a setter that stores and applies it. Call it with
 * `storage` where the app starts; the `ThemePicker` and any other caller share that choice.
 */
export function useThemePreference(options: ThemePreferenceOptions = {}): ThemePreferenceState {
  const adapter = options.storage;
  const preference = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => {
    if (!adapter) return;
    storage = adapter;
    if (settled) return;
    let cancelled = false;
    Promise.resolve(adapter.getItem(THEME_STORAGE_KEY))
      .then((stored) => {
        // A choice made while the read was in flight is newer than what it will return.
        if (cancelled || settled) return;
        settled = true;
        if (isThemePreference(stored) && stored !== current) apply(stored);
      })
      .catch(() => {
        // Nothing readable is the same as nothing stored: follow the system.
      });
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  return [preference, setPreference] as const;
}
