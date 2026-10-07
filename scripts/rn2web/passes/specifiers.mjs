import { SyntaxKind } from "ts-morph";
import { refuse } from "./refuse.mjs";

/**
 * A compiled tree that reaches back into a React Native component is not a compiled tree, so a
 * sibling import is rewritten to the sibling's compiled file — and refused if that file is not
 * being produced.
 *
 * `./x` is this repo's spelling only, and it is load-bearing here: the side-by-side stories are in
 * the React Native tsconfig project, where `@/components/ui/button` means the native half, so a
 * compiled file that kept the alias would be typechecked against React Native components the
 * moment a story imported it. It is **not** what ships. The CLI places files by type — a
 * `registry:component` in `components/`, a `registry:ui` in `components/ui/` — and never rewrites a
 * relative specifier, so `publish-imports.mjs` turns every `./x` back into the alias for where `x`
 * lands, after `shadcn build`. `registry:check` rule 13 holds the result.
 */
export function rewriteSpecifiers(sourceFile, compiledNames, neutralNames, diagnostics) {
  for (const decl of sourceFile.getImportDeclarations()) {
    const spec = decl.getModuleSpecifierValue();

    // Every name it bound was mapped by an earlier pass or refused; nothing survives to import.
    if (spec === "react-native") {
      decl.remove();
      continue;
    }

    /*
     * `@/components/x` is a sibling too when `x` is compiled: a `registry:component` — a layout,
     * `action-button` — imports another by that alias. Left alone it typechecked against the
     * React Native half from a side-by-side story, which passed only while the two halves' props
     * happened to agree; `confirm-button` hands `ActionButton` an `onClick`, and they do not. A
     * name that is not compiled here is a web-only item, which has no other half to reach, so it
     * is left for the CLI rather than refused.
     */
    const component = spec.match(/^@\/components\/([^/]+)$/);
    if (component && compiledNames.has(component[1]) && neutralNames.has(component[1]) === false) {
      decl.setModuleSpecifier(`./${component[1]}`);
      continue;
    }

    const sibling = spec.match(/^@\/components\/(?:ui|layout)\/(.+)$/);
    if (!sibling) {
      continue;
    }
    const name = sibling[1];

    /**
     * A `-base.ts` is platform-neutral by construction — it is the shared types and the shared
     * class-name constants both halves implement, and the plan calls it the middleware layer for
     * exactly that reason. It has no web half because it needs none, so its specifier is left
     * alone and the shadcn CLI rewrites the alias at install time as usual.
     */
    if (neutralNames.has(name)) {
      continue;
    }

    if (compiledNames.has(name) === false) {
      refuse(
        diagnostics,
        decl,
        `imports \`${name}\`, which is not compiled — a compiled tree cannot reach back into a React Native component`,
      );
      continue;
    }
    decl.setModuleSpecifier(`./${name}`);
  }
}

/**
 * `cn` is the one identifier the compiler introduces on its own — `injectClasses` reaches for it
 * whenever a `className` is written as something other than a literal or an existing `cn(...)`, and
 * so does a scroll view's content container. A source file with no class merging of its own has no
 * reason to have imported it, so the import is added here rather than assumed.
 */
export function ensureCn(sourceFile) {
  const used = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .some((call) => call.getExpression().getText() === "cn");
  if (!used) {
    return;
  }

  const imported = sourceFile
    .getImportDeclarations()
    .some((decl) => decl.getNamedImports().some((spec) => spec.getName() === "cn"));
  if (imported) {
    return;
  }

  const last = sourceFile.getImportDeclarations().at(-1);
  sourceFile.insertImportDeclaration(last ? last.getChildIndex() + 1 : 0, {
    moduleSpecifier: "@/lib/utils",
    namedImports: ["cn"],
  });
}
