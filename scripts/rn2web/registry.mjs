/**
 * `registry.web.json`, derived from `registry.json`.
 *
 * Two registries, one repo, one source. The compiled web half builds to `public/r` and the React
 * Native half to `public/r/native`, and a consumer points `@cubeui` at whichever one matches the
 * platform it is:
 *
 *   DOM app    "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json"
 *   Expo app   "@cubeui": "https://cubicecho.github.io/cubeui/r/native/{name}.json"
 *
 * The web half holds the shorter URL even though this registry is React Native first, and that is
 * the whole point of the layout. `…/cubeui/r/{name}.json` is the string ten DOM consumers map to
 * `@cubeui` today, and this repo is the branch that becomes that repo — so keeping `/r/` meaning
 * "web" makes the flip a no-op for every consumer that already exists. The Expo apps are new
 * consumers with no mapping to preserve, so they take the longer URL. Pointing `/r/` at the native
 * half instead would have silently handed React Native source to ten DOM apps.
 *
 * The item names are the same on both sides — `card` is `card` — which is the whole point. A single
 * registry could not do that: the shadcn CLI resolves a cross-item import by the source file's
 * *basename*, so `registry/ui/card.tsx` and `compiled/card.tsx` in one registry would be ambiguous,
 * and the way out would have been a permanent `web-card` in every DOM consumer's file tree. Split
 * into two registries the basenames never meet, and `check-registry-build.mjs` checks each one on
 * its own.
 *
 * `registryDependencies` need no rewriting at all, which is the part that makes this cheap. They are
 * already written `@cubeui/utils`, and `@cubeui` resolves against the *consumer's* `components.json`
 * — so the same string reaches the React Native `utils` in an Expo app and the compiled one in a DOM
 * app, with nothing in this repo knowing which.
 *
 * Derived rather than hand-maintained, because a second registry.json is a second place to forget.
 * `npm run compile` writes it and `compile:check` fails if it is stale.
 */

import { basename } from "node:path";

/**
 * Packages only an Expo app needs. Everything else an item declares is kept, including the ones only
 * its web half uses — `radix-ui`, `react-day-picker` — because in the web registry that half is the
 * whole item.
 */
const NATIVE_ONLY = new Set([
  "expo-document-picker",
  "expo-file-system",
  "lucide-react-native",
  "nativewind",
  "react-native-css",
  "react-native-safe-area-context",
  "react-native-svg",
]);

/**
 * Files that exist only to serve React Native, and so are not in the web half of the item that
 * ships them.
 *
 * `web-as.d.ts` augments React Native's `ViewProps`, which a DOM app has no module to augment — it
 * is the compiler's *input* vocabulary, and by the time an item reaches this registry the compiler
 * has already read it and emitted the element it named.
 */
const NATIVE_ONLY_FILES = new Set(["registry/lib/web-as.d.ts"]);

/**
 * Descriptions are shared: an item is one component, and "a radix listbox on web, a Modal sheet on
 * device" is worth reading in either registry — it says what arrives and that the other half
 * exists. The exception is a description that names a file this registry does not ship.
 */
const DESCRIPTIONS = {
  tokens:
    "The palette as a Tailwind stylesheet, emitted from the same source as the native one so the " +
    "two cannot drift.",
};

/** `nativewind@^5.0.0-rc.0` -> `nativewind`. */
const packageName = (spec) => spec.replace(/@[\^~><=\d].*$/, "");

/**
 * Where an item's file comes from in the web registry.
 *
 * Returns `null` for a file the web half does not ship, and the string `"missing"` for one that
 * should have compiled and did not — the caller turns that into a dropped item rather than a
 * registry entry pointing at a file that is not there.
 */
function webPath(path, emitted) {
  if (NATIVE_ONLY_FILES.has(path)) return null;

  // A `-base.ts` is the contract both halves implement. It is platform-neutral by construction and
  // installs unchanged, which is also why the compiled tree leaves its import specifiers alone.
  if (/-base\.ts$/.test(path)) return path;

  // `.tsx` and `.web.tsx` of the same item are two sources for one output, so the pair collapses
  // here: `select.tsx` and `select.web.tsx` both name `compiled/select.tsx`, and the duplicate is
  // dropped by the caller.
  if (path.endsWith(".tsx")) {
    const file = `${basename(path).replace(/\.web\.tsx$/, ".tsx")}`;
    return emitted.has(file) ? `compiled/${file}` : "missing";
  }

  if (path.startsWith("registry/lib/")) {
    const file = basename(path);
    return emitted.has(file) ? `compiled/${file}` : path;
  }

  // The palette, in the encoding the platform can read. The web one is `oklch()`; `theme.ts` exists
  // for React Native props that take a colour string and cannot read a CSS variable, which is not a
  // problem the DOM has.
  if (path === "dist/tokens.native.css") return "dist/tokens.web.css";
  if (path === "dist/theme.ts") return null;

  return path;
}

/** The web registry, as an object ready to be written. */
export function deriveWebRegistry(registry, emitted) {
  const items = [];
  const dropped = [];

  for (const item of registry.items) {
    const files = [];
    let drop = false;

    for (const file of item.files) {
      const path = webPath(file.path, emitted);
      if (path === null) continue;
      if (path === "missing") {
        drop = true;
        break;
      }
      if (files.some((f) => f.path === path)) continue;
      files.push({ ...file, path });
    }

    if (drop || files.length === 0) {
      dropped.push(item.name);
      continue;
    }

    const next = { ...item, files };
    if (DESCRIPTIONS[item.name]) next.description = DESCRIPTIONS[item.name];
    const deps = (item.dependencies ?? []).filter((d) => !NATIVE_ONLY.has(packageName(d)));
    if (deps.length) next.dependencies = deps;
    else delete next.dependencies;
    items.push(next);
  }

  // An item whose dependency was dropped cannot install, so it goes too, and so does anything that
  // depended on *it*. Run to a fixed point rather than one pass: the cascade is the same shape as
  // the compiler's, because it has the same cause.
  for (;;) {
    const have = new Set(items.map((i) => i.name));
    const broken = items.filter((i) =>
      (i.registryDependencies ?? []).some(
        (d) => d.startsWith("@cubeui/") && !have.has(d.slice("@cubeui/".length)),
      ),
    );
    if (broken.length === 0) break;
    for (const item of broken) {
      dropped.push(item.name);
      items.splice(items.indexOf(item), 1);
    }
  }

  return {
    registry: {
      $schema: registry.$schema,
      name: registry.name,
      homepage: `${registry.homepage}/web`,
      items,
    },
    dropped: dropped.sort(),
  };
}
