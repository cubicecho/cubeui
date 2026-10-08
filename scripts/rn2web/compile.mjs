/**
 * The transform: one React Native source file in, one DOM file out, or a list of refusals.
 *
 * Structure worth knowing before reading: every pass is **idempotent and re-queried**, and the
 * driver runs each one in a loop until it stops changing anything. ts-morph invalidates a node
 * handle the moment an ancestor is replaced, so holding node references across a mutation is the
 * one reliable way to make this crash in a way that is hard to read. Re-querying from the file is
 * slower and does not care.
 *
 * Each pass is a module in `passes/`, named as below. They run in this order, and the order is
 * load-bearing:
 *
 *   1. imports      — decide what this file is even made of, and refuse early if it is out of scope
 *   2. platform     — `Platform.OS` is `"web"` here by construction, so fold it away
 *   3. spreads      — folding leaves `{...({ 'aria-pressed': x })}`, which is just an attribute
 *   4. elements     — the element map, the ARIA inference, the reset classes, the prop renames
 *   5. types        — `ComponentProps<typeof View>` and friends
 *   6. specifiers   — `@/components/ui/x` is `./x` once both sides are compiled (in this repo;
 *                     the published registry gets the alias back — see `publish-imports.mjs`)
 *
 * 2 before 3 before 4 because each leaves the next one something simpler to look at: a compiled
 * `aria-pressed` was a `Platform.OS === "web"` ternary two passes earlier.
 */

import { Project } from "ts-morph";
import {
  checkElementLeaks,
  checkNativePropLeaks,
  checkNestedInteractive,
  renamePublicProps,
  transformElements,
} from "./passes/elements.mjs";
import { readReactNativeImport } from "./passes/imports.mjs";
import { foldPlatform } from "./passes/platform.mjs";
import { ensureCn, rewriteSpecifiers } from "./passes/specifiers.mjs";
import { inlineSpreads } from "./passes/spreads.mjs";
import { pruneRewrittenTypeImports, rewriteTypes } from "./passes/types.mjs";

const HEADER = {
  compile: (from) => `/**
 * Compiled from \`${from}\` by \`scripts/rn2web\`.
 * Do not edit — edit the source and re-run \`npm run compile\`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in \`scripts/rn2web/tables.mjs\` says what that became here.
 */
`,
  passthrough: (from) => `/**
 * Copied from \`${from}\` by \`scripts/rn2web\`.
 * Do not edit — edit the source and re-run \`npm run compile\`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */
`,
};

/**
 * A lint suppression for what the file becomes, not what it is: `// web: biome-ignore lint/…`.
 *
 * `useSemanticElements` only reads DOM elements, so on `<Text role="heading">` it has nothing to
 * say and a plain `biome-ignore` there is reported as unused — in this repo, and in every Expo app
 * that vendors the source (#286). The `<span role="heading">` it compiles to is where the rule
 * fires, so the comment is written inert in the source and switched on here.
 */
const WEB_ONLY_IGNORE = /^([ \t]*(?:\{\/\*\s*)?)\/\/ web: biome-ignore /gm;

/** Far more passes than any file needs; a loop that reaches it is a transform that never settles. */
const MAX_PASSES = 12;

/**
 * Compiles one file. Returns `{ code, diagnostics }`; `code` is null when anything was refused,
 * because a partially-transformed file is the one output worse than none.
 */
export function compileSource({
  filePath,
  text,
  compiledNames = new Set(),
  neutralNames = new Set(),
  origin = "compile",
}) {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
  const sourceFile = project.createSourceFile(filePath, text, { overwrite: true });
  const diagnostics = [];

  const { elements, types } = readReactNativeImport(sourceFile, diagnostics);
  if (diagnostics.length) {
    return { code: null, diagnostics };
  }

  // Each pass is idempotent, so running them to a fixed point is both simpler than ordering the
  // mutations by hand and the only thing that survives ts-morph forgetting a node mid-walk.
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let changed = false;
    if (foldPlatform(sourceFile)) {
      changed = true;
    }
    if (inlineSpreads(sourceFile)) {
      changed = true;
    }
    if (transformElements(sourceFile, elements, diagnostics)) {
      changed = true;
    }
    if (rewriteTypes(sourceFile, types, diagnostics)) {
      changed = true;
    }
    if (diagnostics.length) {
      return { code: null, diagnostics };
    }
    if (!changed) {
      break;
    }
  }

  renamePublicProps(sourceFile);
  pruneRewrittenTypeImports(sourceFile);
  ensureCn(sourceFile);
  checkElementLeaks(sourceFile, elements, diagnostics);
  checkNativePropLeaks(sourceFile, diagnostics);
  checkNestedInteractive(sourceFile, diagnostics);
  rewriteSpecifiers(sourceFile, compiledNames, neutralNames, diagnostics);
  if (diagnostics.length) {
    return { code: null, diagnostics };
  }

  const code = sourceFile.getFullText().replace(WEB_ONLY_IGNORE, "$1// biome-ignore ");
  return { code: `${HEADER[origin](filePath)}\n${code}`, diagnostics };
}

/**
 * Level 4 of the plan: an item with a hand-written `.web.tsx` supplies its own web half and nothing
 * is generated for it. It still goes through the same pipeline, for two reasons.
 *
 * The first is imports: `select.web.tsx` importing `@/components/ui/button` has to reach the
 * compiled button and not the React Native one. The second is the one the `file-picker` found. A
 * hand-written web half is written to run *inside an Expo app on web*, where react-native-web is
 * present, so nothing stops it reaching for a React Native `<Text>` — and that same file in the
 * compiled tree, which exists precisely so a DOM app needs no react-native-web, would be the one
 * import that drags the whole shim back in. Running the element map over it turns that `<Text>`
 * into the `<span>` react-native-web would have rendered anyway.
 */
export function passthroughSource(options) {
  return compileSource({ ...options, origin: "passthrough" });
}
