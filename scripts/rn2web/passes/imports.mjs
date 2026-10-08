import { ELEMENTS, FOLDED_IMPORTS, OUT_OF_SCOPE, TYPE_MAP } from "../tables.mjs";
import { refuse } from "./refuse.mjs";

/**
 * Reads the `react-native` import and decides whether this file can be compiled at all.
 *
 * Returns the set of local names bound to mapped elements. A name that is neither an element, nor
 * folded away, nor a mapped type is a refusal — the compiler does not pass an unrecognised React
 * Native export through and hope the DOM has one too.
 */
export function readReactNativeImport(sourceFile, diagnostics) {
  const elements = new Set();
  // Only the names this file actually imported. `ViewProps` is in the type map, and it is also a
  // perfectly ordinary local alias in half the registry — substituting the local one would silently
  // discard the `className` re-declaration every component in this repo depends on.
  const types = new Set();
  for (const decl of sourceFile.getImportDeclarations()) {
    if (decl.getModuleSpecifierValue() !== "react-native") {
      continue;
    }

    for (const named of decl.getNamedImports()) {
      const name = named.getName();
      if (named.getAliasNode()) {
        refuse(
          diagnostics,
          named,
          `\`${name}\` is imported under an alias; the element map reads the name`,
        );
        continue;
      }
      if (ELEMENTS[name]) {
        elements.add(name);
      } else if (FOLDED_IMPORTS.has(name)) {
        // Folded away by pass 2; nothing to bind.
      } else if (TYPE_MAP[name]) {
        types.add(name); // substituted by pass 5
      } else if (OUT_OF_SCOPE[name]) {
        refuse(
          diagnostics,
          named,
          `\`${name}\` is out of scope for the compiler — ${OUT_OF_SCOPE[name]}. Ship a hand-written \`.web.tsx\` for this item instead.`,
        );
      } else {
        refuse(
          diagnostics,
          named,
          `\`${name}\` has no entry in the element map, the type map or the refusal list`,
        );
      }
    }
    if (decl.getDefaultImport() || decl.getNamespaceImport()) {
      refuse(
        diagnostics,
        decl,
        "a default or namespace import of `react-native` cannot be resolved by name",
      );
    }
  }
  return { elements, types };
}
