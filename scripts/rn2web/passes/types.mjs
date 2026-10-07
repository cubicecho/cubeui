import { Node, SyntaxKind } from "ts-morph";
import { ELEMENTS, PROP_MAP, PROPS_TAG, REF_TYPE, TYPE_MAP } from "../tables.mjs";
import { refuse } from "./refuse.mjs";

/**
 * `ElementRef` and `ComponentProps` imported by name from `react` are what {@link rewriteTypes}
 * replaces, so a file that used them only on a React Native element is left importing a name it
 * no longer mentions — which the linter reports on the compiled file, not the source.
 */
export function pruneRewrittenTypeImports(sourceFile) {
  const react = sourceFile.getImportDeclaration((d) => d.getModuleSpecifierValue() === "react");
  if (!react) {
    return;
  }
  for (const spec of react.getNamedImports()) {
    const name = spec.getName();
    if (name !== "ElementRef" && name !== "ComponentProps") {
      continue;
    }
    const used = sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .some(
        (id) => id.getText() === name && !id.getFirstAncestorByKind(SyntaxKind.ImportDeclaration),
      );
    if (!used) {
      spec.remove();
    }
  }
  if (
    react.getNamedImports().length === 0 &&
    !react.getDefaultImport() &&
    !react.getNamespaceImport()
  ) {
    react.remove();
  }
}

/**
 * `React.ComponentProps<typeof View>` -> `React.ComponentPropsWithoutRef<"div">`, and the indexed
 * form `[...]["onPress"]` -> `[...]["onClick"]` along with it, because the key is a prop name and
 * pass 4 already renamed the prop it refers to.
 */
export function rewriteTypes(sourceFile, types, diagnostics) {
  let changed = false;

  for (const ref of sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference)) {
    if (ref.wasForgotten()) {
      continue;
    }
    const name = ref.getTypeName().getText();
    const args = ref.getTypeArguments();

    const isProps = name === "ComponentProps" || name === "React.ComponentProps";
    const isRef = name === "ElementRef" || name === "React.ElementRef";
    if ((isProps || isRef) && args.length === 1) {
      const arg = args[0];
      const query = arg.asKind(SyntaxKind.TypeQuery);
      const rn = query?.getExprName().getText();
      if (rn && PROPS_TAG[rn]) {
        if (isRef) {
          ref.replaceWithText(REF_TYPE[rn]);
        } else {
          ref.replaceWithText(`React.ComponentPropsWithoutRef<"${PROPS_TAG[rn]}">`);
          // The indexed access sitting on top of it, if there is one.
          const parent = ref.getParent();
          if (Node.isIndexedAccessTypeNode(parent)) {
            const index = parent.getIndexTypeNode();
            const key = Node.isLiteralTypeNode(index) ? index.getLiteral() : null;
            if (Node.isStringLiteral(key) && PROP_MAP[key.getLiteralValue()]) {
              key.replaceWithText(`"${PROP_MAP[key.getLiteralValue()]}"`);
            }
          }
        }
        changed = true;
        continue;
      }
    }

    if (types.has(name)) {
      ref.replaceWithText(TYPE_MAP[name]);
      changed = true;
    }
  }

  // Any surviving `typeof View` is a reference the compiler did not understand; say so rather
  // than emit a file that names a component it no longer imports.
  for (const query of sourceFile.getDescendantsOfKind(SyntaxKind.TypeQuery)) {
    const name = query.getExprName().getText();
    if (ELEMENTS[name]) {
      refuse(
        diagnostics,
        query,
        `\`typeof ${name}\` is used in a type the compiler has no rule for`,
      );
    }
  }
  return changed;
}
