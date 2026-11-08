import { cdp } from "vitest/browser";

/**
 * The `safe-area` test project's setup: the browser reports the bottom safe-area inset of an
 * iPhone with a home indicator, so `env(safe-area-inset-bottom)` is 34px rather than 0.
 *
 * Chromium's own emulation, through the DevTools protocol, because a play function has no hold on
 * the viewport and a stylesheet cannot set `env()`. It reaches the story's frame as well as the
 * page that holds it.
 */
const HOME_INDICATOR = 34;

await cdp().send("Emulation.setSafeAreaInsetsOverride", { insets: { bottom: HOME_INDICATOR } });

// A check of the harness rather than of a component: with the emulation gone quiet, the stories
// tagged `safe-area` would pass against an inset of 0 and prove nothing.
const probe = document.createElement("div");
probe.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
document.body.append(probe);
const reported = getComputedStyle(probe).paddingBottom;
probe.remove();
if (reported !== `${HOME_INDICATOR}px`) {
  throw new Error(`the emulated bottom inset should be ${HOME_INDICATOR}px, and is ${reported}`);
}
