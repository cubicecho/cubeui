/**
 * The transform: one React Native source file in, one DOM file out, or a list of refusals.
 *
 * Structure worth knowing before reading: every pass is **idempotent and re-queried**, and the
 * driver runs each one in a loop until it stops changing anything. ts-morph invalidates a node
 * handle the moment an ancestor is replaced, so holding node references across a mutation is the
 * one reliable way to make this crash in a way that is hard to read. Re-querying from the file is
 * slower and does not care.
 *
 * The passes run in this order, and the order is load-bearing:
 *
 *   1. imports      — decide what this file is even made of, and refuse early if it is out of scope
 *   2. platform     — `Platform.OS` is `"web"` here by construction, so fold it away
 *   3. spreads      — folding leaves `{...({ 'aria-pressed': x })}`, which is just an attribute
 *   4. elements     — the element map, the ARIA inference, the reset classes, the prop renames
 *   5. types        — `ComponentProps<typeof View>` and friends
 *   6. specifiers   — `@/components/ui/x` is `./x` once both sides are compiled
 *
 * 2 before 3 before 4 because each leaves the next one something simpler to look at: a compiled
 * `aria-pressed` was a `Platform.OS === "web"` ternary two passes earlier.
 */

import { Node, Project, SyntaxKind } from "ts-morph";
import {
  ACCESSIBILITY_STATE_ARIA,
  BUTTON_ROLES,
  DOM_INTERFACE,
  ELEMENTS,
  FOLDED_IMPORTS,
  NATIVE_TAG_FOR_ROLE,
  NEEDS_BUTTON_TYPE,
  OUT_OF_SCOPE,
  POINTER_EVENTS,
  PROP_MAP,
  PROPS_TAG,
  REF_TYPE,
  REFUSED_PROPS,
  TYPE_MAP,
} from "./tables.mjs";

/** A refusal. `line` is 1-based, so it pastes straight into an editor. */
function refuse(diagnostics, node, message) {
  const file = node.getSourceFile();
  diagnostics.push({
    // The project is an in-memory filesystem, so `getFilePath()` is rooted at `/`. The repo-relative
    // path is what pastes into an editor, and it is what was handed in.
    file: file.getFilePath().replace(/^\//, ""),
    line: file.getLineAndColumnAtPos(node.getStart()).line,
    message,
  });
}

// ---------------------------------------------------------------------------- 1. imports

/**
 * Reads the `react-native` import and decides whether this file can be compiled at all.
 *
 * Returns the set of local names bound to mapped elements. A name that is neither an element, nor
 * folded away, nor a mapped type is a refusal — the compiler does not pass an unrecognised React
 * Native export through and hope the DOM has one too.
 */
function readReactNativeImport(sourceFile, diagnostics) {
  const elements = new Set();
  // Only the names this file actually imported. `ViewProps` is in the type map, and it is also a
  // perfectly ordinary local alias in half the registry — substituting the local one would silently
  // discard the `className` re-declaration every component in this repo depends on.
  const types = new Set();
  for (const decl of sourceFile.getImportDeclarations()) {
    if (decl.getModuleSpecifierValue() !== "react-native") continue;

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

// ---------------------------------------------------------------------------- 2. platform

/**
 * `Platform.OS` is `"web"` in a file that only ever runs on the web, so the compiler substitutes
 * it and lets the branches collapse.
 *
 * This is what turns the source's platform-guarded a11y props — written that way because React
 * Native has no `aria-pressed` — into plain attributes in the output. The guard is a native-side
 * concern, and the compiled file is the side where it is answered.
 */
function foldPlatform(sourceFile) {
  let changed = false;

  for (const access of sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
    if (access.wasForgotten()) continue;
    if (access.getExpression().getText() !== "Platform") continue;

    if (access.getName() === "OS") {
      const parent = access.getParent();
      if (Node.isBinaryExpression(parent)) {
        const op = parent.getOperatorToken().getText();
        const other = parent.getLeft() === access ? parent.getRight() : parent.getLeft();
        const literal = Node.isStringLiteral(other) ? other.getLiteralValue() : null;
        if (literal !== null && (op === "===" || op === "==" || op === "!==" || op === "!=")) {
          const equal = literal === "web";
          parent.replaceWithText(String(op.startsWith("!") ? !equal : equal));
          changed = true;
          continue;
        }
      }
      access.replaceWithText('"web"');
      changed = true;
      continue;
    }

    // `Platform.select({ web, default })` — take the web arm, or the default, in that order.
    if (access.getName() === "select") {
      const call = access.getParent();
      if (!Node.isCallExpression(call)) continue;
      const arg = call.getArguments()[0];
      if (!Node.isObjectLiteralExpression(arg)) continue;
      const pick =
        arg.getProperty("web") ?? arg.getProperty("default") ?? arg.getProperty("native");
      if (!pick || !Node.isPropertyAssignment(pick)) continue;
      call.replaceWithText(pick.getInitializer().getText());
      changed = true;
    }
  }

  // `true ? a : b` is `a`. Runs after the substitution above, in the same loop the driver repeats.
  for (const cond of sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression)) {
    if (cond.wasForgotten()) continue;
    const test = cond.getCondition().getText();
    if (test !== "true" && test !== "false") continue;
    cond.replaceWithText((test === "true" ? cond.getWhenTrue() : cond.getWhenFalse()).getText());
    changed = true;
  }

  // The `Platform` import itself, once nothing references it.
  for (const decl of sourceFile.getImportDeclarations()) {
    if (decl.getModuleSpecifierValue() !== "react-native") continue;
    for (const named of decl.getNamedImports()) {
      if (!FOLDED_IMPORTS.has(named.getName())) continue;
      named.remove();
      changed = true;
    }
  }

  return changed;
}

// ---------------------------------------------------------------------------- 3. spreads

/** `{...({ 'aria-pressed': x } as const)}` is three attributes wearing a disguise. Undress it. */
function inlineSpreads(sourceFile) {
  let changed = false;

  for (const spread of sourceFile.getDescendantsOfKind(SyntaxKind.JsxSpreadAttribute)) {
    if (spread.wasForgotten()) continue;

    let expr = spread.getExpression();
    while (Node.isParenthesizedExpression(expr) || Node.isAsExpression(expr)) {
      expr = Node.isAsExpression(expr) ? expr.getExpression() : expr.getExpression();
    }
    if (!Node.isObjectLiteralExpression(expr)) continue;

    const parts = [];
    let literal = true;
    for (const prop of expr.getProperties()) {
      if (!Node.isPropertyAssignment(prop)) {
        literal = false;
        break;
      }
      const nameNode = prop.getNameNode();
      const name = Node.isStringLiteral(nameNode) ? nameNode.getLiteralValue() : nameNode.getText();
      // `{}` from a collapsed guard, and anything computed, are the two cases to leave alone.
      if (!/^[A-Za-z_][\w-]*$/.test(name)) {
        literal = false;
        break;
      }
      const value = prop.getInitializer();
      parts.push(
        Node.isStringLiteral(value) ? `${name}=${value.getText()}` : `${name}={${value.getText()}}`,
      );
    }
    if (!literal) continue;

    spread.replaceWithText(parts.join(" ") || "");
    changed = true;
  }

  // `{...{}}` collapses to the empty string above, which leaves a stray attribute slot.
  return changed;
}

// ---------------------------------------------------------------------------- 4. elements

/** The `cn(...)` call, the string literal, or the bare expression a `className` was written as. */
function injectClasses(attr, classes, diagnostics) {
  if (!classes) return;
  if (!attr) return;

  const init = attr.getInitializer();
  if (!init) return;

  if (Node.isStringLiteral(init)) {
    attr.setInitializer(`"${classes} ${init.getLiteralValue()}"`);
    return;
  }
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (!expr) return;
    if (Node.isCallExpression(expr) && expr.getExpression().getText() === "cn") {
      expr.insertArgument(0, `"${classes}"`);
      return;
    }
    // Anything else — a ternary, a variable, a template — is wrapped rather than parsed.
    init.replaceWithText(`{cn("${classes}", ${expr.getText()})}`);
    return;
  }
  refuse(
    diagnostics,
    attr,
    "`className` is written in a form the compiler cannot add the reset class to",
  );
}

/** The string value of a JSX attribute, when it is written as a literal. */
function literalValue(attr) {
  if (!attr) return null;
  const init = attr.getInitializer();
  if (Node.isStringLiteral(init)) return init.getLiteralValue();
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (Node.isStringLiteral(expr)) return expr.getLiteralValue();
    if (Node.isNumericLiteral(expr)) return expr.getLiteralValue();
  }
  return null;
}

/**
 * `accessibilityState` is the native spelling of something the web has to be told separately, and
 * the whole reason is in `ACCESSIBILITY_STATE_ARIA`. Every key in it must also be said with an
 * explicit `aria-*` on the same element; then, and only then, the prop is dropped.
 *
 * By the time this runs, passes 2 and 3 have already folded `Platform.OS === "web" ? {...} : {}`
 * down to plain attributes, so the `aria-*` this is looking for is a real attribute on the element
 * even though the source wrote it behind a platform guard.
 */
function checkAccessibilityState(rnName, find, attrs, diagnostics) {
  const attr = find("accessibilityState");
  if (!attr) return true;

  const init = attr.getInitializer();
  const object = Node.isJsxExpression(init) ? init.getExpression() : null;
  if (!Node.isObjectLiteralExpression(object)) {
    refuse(
      diagnostics,
      attr,
      "`accessibilityState` has to be written as an object literal here, so the compiler can check " +
        "that each state it names is also said with an `aria-*` prop the web will actually read",
    );
    return false;
  }

  const present = new Set(attrs().map((a) => a.getNameNode().getText()));
  for (const prop of object.getProperties()) {
    const key = Node.isShorthandPropertyAssignment(prop)
      ? prop.getName()
      : Node.isPropertyAssignment(prop)
        ? prop
            .getNameNode()
            .getText()
            .replace(/^["']|["']$/g, "")
        : null;
    if (!key) continue;

    const accepted = ACCESSIBILITY_STATE_ARIA[key] ?? [];
    if (accepted.some((aria) => present.has(aria))) continue;

    refuse(
      diagnostics,
      attr,
      `\`accessibilityState={{ ${key} }}\` on a <${rnName}> says nothing on the web. ` +
        "react-native-web drops `accessibilityState` entirely — it forwards an allowlist of `aria-*` " +
        "props and nothing else — so this element is styled and silent to a screen reader today, " +
        `before any compiling. Say it again on the source element as ${accepted.map((a) => `\`${a}\``).join(" or ")}` +
        ', guarded by `Platform.OS === "web"` because React Native has no such prop. Which one ' +
        "depends on the role; `aria-selected` on a button is an `aria-allowed-attr` violation.",
    );
    return false;
  }

  attr.remove();
  return true;
}

function transformElement(open, elements, diagnostics) {
  const tagNode = open.getTagNameNode();
  const rnName = tagNode.getText();
  const entry = ELEMENTS[rnName];
  if (!entry || !elements.has(rnName)) return false;

  const attrs = () => open.getAttributes().filter(Node.isJsxAttribute);
  const find = (name) => attrs().find((a) => a.getNameNode().getText() === name);

  // --- refusals first, so a file that cannot be compiled says so before it is half-rewritten.
  for (const attr of attrs()) {
    const name = attr.getNameNode().getText();
    if (REFUSED_PROPS[name]) {
      refuse(diagnostics, attr, `\`${name}\` on a <${rnName}>: ${REFUSED_PROPS[name]}`);
      return false;
    }
  }
  if (!checkAccessibilityState(rnName, find, attrs, diagnostics)) return false;

  // --- the tag. `webAs` (level 3) beats inferred ARIA (level 2) beats the element map (level 1).
  const webAs = literalValue(find("webAs"));
  const roleAttr = find("role") ?? find("accessibilityRole");
  const role = literalValue(roleAttr);
  let tag = entry.tag;
  let reset = entry.reset;
  let dropRole = false;

  if (webAs) {
    tag = webAs;
    find("webAs").remove();
  } else if (role === "heading") {
    const levelAttr = find("aria-level");
    const level = literalValue(levelAttr);
    if (!level || Number(level) < 1 || Number(level) > 6) {
      refuse(
        diagnostics,
        roleAttr,
        '`role="heading"` needs a literal `aria-level` between 1 and 6 — the compiler emits the ' +
          "heading element, and there is no such thing as a heading of unknown rank on the DOM",
      );
      return false;
    }
    tag = `h${Number(level)}`;
    levelAttr.remove();
    dropRole = true;
  } else if (role && NATIVE_TAG_FOR_ROLE[role]) {
    tag = NATIVE_TAG_FOR_ROLE[role];
    dropRole = true;
  }
  // A role with no element of its own — `radiogroup`, `alert`, `img` — keeps its attribute. What
  // it may not keep is an element whose own semantics it overrides: see `BUTTON_ROLES`.
  else if (role && entry.generic && !BUTTON_ROLES.has(role)) {
    tag = entry.generic.tag;
    reset = entry.generic.reset;
  }
  if (dropRole) roleAttr.remove();

  // --- the props.
  const extraClasses = [];
  for (const attr of attrs()) {
    const name = attr.getNameNode().getText();

    if (name === "pointerEvents") {
      const value = literalValue(attr);
      const cls = POINTER_EVENTS[value];
      if (!cls) {
        refuse(
          diagnostics,
          attr,
          `\`pointerEvents=\` is only compiled from a literal, and only for ${Object.keys(POINTER_EVENTS).join(", ")}`,
        );
        return false;
      }
      extraClasses.push(cls);
      attr.remove();
      continue;
    }

    if (name === "accessibilityRole" && !dropRole) {
      attr.getNameNode().replaceWithText("role");
      continue;
    }
    const mapped = PROP_MAP[name];
    if (mapped) attr.getNameNode().replaceWithText(mapped);
  }

  // --- the reset class, and whatever the element map adds on top of it.
  const classes = [reset, entry.classes, ...extraClasses].filter(Boolean).join(" ");
  const classAttr = find("className");
  if (classAttr) {
    injectClasses(classAttr, classes, diagnostics);
  } else {
    open.addAttribute({ name: "className", initializer: `"${classes}"` });
  }

  // --- `type="button"`, which has no React Native counterpart and is not optional. A `<button>`
  //     with no type submits the form it happens to be inside; a `Pressable` never does.
  if (NEEDS_BUTTON_TYPE.has(tag) && !find("type")) {
    open.insertAttribute(0, { name: "type", initializer: '"button"' });
  }

  // --- the two casts. See `DOM_INTERFACE` for why they are here and what the alternative was.
  const dom = DOM_INTERFACE[tag];
  if (dom) {
    const refAttr = find("ref");
    const refInit = refAttr?.getInitializer();
    if (Node.isJsxExpression(refInit)) {
      const expr = refInit.getExpression();
      if (Node.isIdentifier(expr))
        refInit.replaceWithText(`{${expr.getText()} as React.Ref<${dom}>}`);
    }
    for (const spread of open.getAttributes().filter(Node.isJsxSpreadAttribute)) {
      const expr = spread.getExpression();
      if (!Node.isIdentifier(expr)) continue;
      spread.replaceWithText(
        `{...(${expr.getText()} as React.ComponentPropsWithoutRef<"${tag}">)}`,
      );
    }
  }

  // --- the content container, the one element the compiler emits that the source did not write.
  //     See `ELEMENTS.ScrollView`: a scroll view is a viewport and a content box, and padding
  //     written for the content box scrolls away if it is put on the viewport.
  if (entry.contentContainer) {
    const inner = entry.contentContainer;
    const fromAttr = find(inner.from);
    const innerClass = fromAttr
      ? (() => {
          const init = fromAttr.getInitializer();
          const expr = Node.isJsxExpression(init)
            ? init.getExpression()?.getText()
            : init.getText();
          fromAttr.remove();
          return `{cn("${inner.reset}", ${expr})}`;
        })()
      : `"${inner.reset}"`;

    const host = open.getParent();
    if (Node.isJsxElement(host)) {
      const kids = host
        .getJsxChildren()
        .map((c) => c.getText())
        .join("");
      host.setBodyText(`<div className=${innerClass}>${kids}</div>`);
    }
  }

  // --- the rename itself, last, so every lookup above ran against the React Native name.
  const parent = open.getParent();
  if (Node.isJsxElement(parent)) {
    parent.getOpeningElement().getTagNameNode().replaceWithText(tag);
    parent.getClosingElement().getTagNameNode().replaceWithText(tag);
  } else {
    tagNode.replaceWithText(tag);
  }
  return true;
}

function transformElements(sourceFile, elements, diagnostics) {
  let changed = false;
  const opens = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];
  for (const open of opens) {
    if (open.wasForgotten()) continue;
    if (transformElement(open, elements, diagnostics)) changed = true;
  }
  return changed;
}

/**
 * A `<button>` inside a `<button>` is invalid HTML and an axe violation, and it is the one way
 * the Pressable mapping can go wrong that no single element's transform can see.
 */
function checkNestedInteractive(sourceFile, diagnostics) {
  for (const open of sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
    if (open.getTagNameNode().getText() !== "button") continue;
    const outer = open.getFirstAncestor(
      (a) =>
        Node.isJsxElement(a) &&
        a.getOpeningElement() !== open &&
        a.getOpeningElement().getTagNameNode().getText() === "button",
    );
    if (outer) {
      refuse(
        diagnostics,
        open,
        "this compiles to a <button> inside a <button>, which is invalid HTML and an axe violation. " +
          "One of the two Pressables wants a different role, or the inner one wants to be the whole target.",
      );
    }
  }
}

/**
 * A React Native component named anywhere other than a JSX tag — `const C = onPress ? Pressable :
 * View` — means the element is chosen at runtime, and everything the compiler does is a function of
 * knowing the element: the tag, the reset class, the inferred role, whether `type="button"` applies.
 *
 * The compiler could emit `const C = onPress ? "button" : "div"` and carry a parallel ternary for
 * each of those, and the output would be something nobody could read or trust. Refusing is better,
 * and the fix is an improvement to the source in its own right: writing the branch out says the
 * same thing in the same number of lines and stops the two containers sharing a prop list they do
 * not actually share.
 */
function checkElementLeaks(sourceFile, elements, diagnostics) {
  for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
    if (id.wasForgotten() || !elements.has(id.getText())) continue;
    if (id.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue;
    refuse(
      diagnostics,
      id,
      `\`${id.getText()}\` is referenced outside a JSX tag, so the element is chosen at runtime. ` +
        "Everything the compiler does depends on knowing the element — the tag, the reset class, the " +
        'inferred role, whether `type="button"` applies — so write the branch out (`if (onPress) ' +
        "return <Pressable …>; return <View …>;`) or ship a hand-written `.web.tsx`.",
    );
  }
}

/**
 * The public API, renamed to the names the platform actually has.
 *
 * A compiled `<Button>` renders a `<button>`, so it takes `onClick`. This is a real fork and the
 * README records it as an open decision, because the other answer — keeping `onPress` on the web
 * half so one call site works on both platforms — is also defensible. What settled it for now:
 * every compiled component inherits its props from `ComponentPropsWithoutRef<"button">`, which
 * already *has* `onClick`, so keeping `onPress` would mean an `Omit` and a hand-written adapter on
 * every single component. Generated adapters are exactly the "looks nearly right" surface this
 * compiler exists to avoid.
 *
 * The consequence is narrow in practice: the two halves serve different apps. A React Native app
 * installs the React Native item and writes `onPress`; a DOM app installs the compiled one and
 * writes `onClick`, which is the name a web developer was going to reach for anyway.
 *
 * The local binding keeps the source's own name — `{ onClick: onPress }` — rather than renaming
 * every reference in the function body. The declared prop is what callers see, and chasing
 * references through a file the compiler has already rewritten buys nothing.
 */
function renamePublicProps(sourceFile) {
  // `aria-label` and `data-slot` are not identifiers, so as a member name or an object key they
  // have to be quoted. As a JSX attribute they must not be.
  const key = (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `"${name}"`);

  for (const sig of sourceFile.getDescendantsOfKind(SyntaxKind.PropertySignature)) {
    const mapped = PROP_MAP[sig.getName()];
    if (mapped) sig.getNameNode().replaceWithText(key(mapped));
  }

  for (const binding of sourceFile.getDescendantsOfKind(SyntaxKind.BindingElement)) {
    if (binding.getPropertyNameNode()) continue;
    const name = binding.getNameNode().getText();
    const mapped = PROP_MAP[name];
    if (mapped) binding.replaceWithText(`${key(mapped)}: ${name}`);
  }

  // Whatever is still a capitalised tag at this point is a component, not a host element: every
  // mapped element became a lowercase tag two passes ago.
  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const mapped = PROP_MAP[attr.getNameNode().getText()];
    if (!mapped) continue;
    const owner = attr.getFirstAncestor(
      (a) => Node.isJsxOpeningElement(a) || Node.isJsxSelfClosingElement(a),
    );
    if (!owner) continue;
    if (!/^[A-Z]/.test(owner.getTagNameNode().getText())) continue;
    attr.getNameNode().replaceWithText(mapped);
  }
}

// ---------------------------------------------------------------------------- 5. types

/**
 * `React.ComponentProps<typeof View>` -> `React.ComponentPropsWithoutRef<"div">`, and the indexed
 * form `[...]["onPress"]` -> `[...]["onClick"]` along with it, because the key is a prop name and
 * pass 4 already renamed the prop it refers to.
 */
function rewriteTypes(sourceFile, types, diagnostics) {
  let changed = false;

  for (const ref of sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference)) {
    if (ref.wasForgotten()) continue;
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

// ---------------------------------------------------------------------------- 6. specifiers

/**
 * A compiled tree that reaches back into a React Native component is not a compiled tree, so a
 * sibling import is rewritten to the sibling's compiled file — and refused if that file is not
 * being produced.
 */
function rewriteSpecifiers(sourceFile, compiledNames, neutralNames, upstreamNames, diagnostics) {
  for (const decl of sourceFile.getImportDeclarations()) {
    const spec = decl.getModuleSpecifierValue();

    // Every name it bound was mapped by an earlier pass or refused; nothing survives to import.
    if (spec === "react-native") {
      decl.remove();
      continue;
    }

    const sibling = spec.match(/^@\/components\/(?:ui|layout)\/(.+)$/);
    if (!sibling) continue;
    const name = sibling[1];

    /**
     * A `-base.ts` is platform-neutral by construction — it is the shared types and the shared
     * class-name constants both halves implement, and the plan calls it the middleware layer for
     * exactly that reason. It has no web half because it needs none, so its specifier is left
     * alone and the shadcn CLI rewrites the alias at install time as usual.
     */
    if (neutralNames.has(name)) continue;

    /**
     * An upstream shadcn component — `separator`, `skeleton`, `command`. It is not compiled
     * here and never will be: it is already a DOM component, the item declares it as a bare
     * `registryDependency`, and the consumer's CLI fetches it from ui.shadcn.com and writes it
     * to that consumer's own `components/ui/`. So `@/components/ui/separator` resolves in the
     * installed tree — leaving it alone is what makes it resolve, and rewriting it to `./`
     * would point at a file this registry does not ship.
     *
     * `vendor/shadcn/` is the list, because that is where the copies used to typecheck the web
     * half live. A name is upstream because a file is there, which keeps the two from drifting.
     */
    if (upstreamNames.has(name)) continue;

    if (!compiledNames.has(name)) {
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
function ensureCn(sourceFile) {
  const used = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .some((call) => call.getExpression().getText() === "cn");
  if (!used) return;

  const imported = sourceFile
    .getImportDeclarations()
    .some((decl) => decl.getNamedImports().some((spec) => spec.getName() === "cn"));
  if (imported) return;

  const last = sourceFile.getImportDeclarations().at(-1);
  sourceFile.insertImportDeclaration(last ? last.getChildIndex() + 1 : 0, {
    moduleSpecifier: "@/lib/utils",
    namedImports: ["cn"],
  });
}

// ---------------------------------------------------------------------------- driver

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
 * Compiles one file. Returns `{ code, diagnostics }`; `code` is null when anything was refused,
 * because a partially-transformed file is the one output worse than none.
 */
export function compileSource({
  filePath,
  text,
  compiledNames = new Set(),
  neutralNames = new Set(),
  upstreamNames = new Set(),
  origin = "compile",
}) {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
  const sourceFile = project.createSourceFile(filePath, text, { overwrite: true });
  const diagnostics = [];

  const { elements, types } = readReactNativeImport(sourceFile, diagnostics);
  if (diagnostics.length) return { code: null, diagnostics };

  // Each pass is idempotent, so running them to a fixed point is both simpler than ordering the
  // mutations by hand and the only thing that survives ts-morph forgetting a node mid-walk.
  for (let pass = 0; pass < 12; pass += 1) {
    let changed = false;
    if (foldPlatform(sourceFile)) changed = true;
    if (inlineSpreads(sourceFile)) changed = true;
    if (transformElements(sourceFile, elements, diagnostics)) changed = true;
    if (rewriteTypes(sourceFile, types, diagnostics)) changed = true;
    if (diagnostics.length) return { code: null, diagnostics };
    if (!changed) break;
  }

  renamePublicProps(sourceFile);
  ensureCn(sourceFile);
  checkElementLeaks(sourceFile, elements, diagnostics);
  checkNestedInteractive(sourceFile, diagnostics);
  rewriteSpecifiers(sourceFile, compiledNames, neutralNames, upstreamNames, diagnostics);
  if (diagnostics.length) return { code: null, diagnostics };

  return { code: `${HEADER[origin](filePath)}\n${sourceFile.getFullText()}`, diagnostics };
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
