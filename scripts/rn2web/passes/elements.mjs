import { Node, SyntaxKind } from "ts-morph";
import {
  ACCESSIBILITY_STATE_ARIA,
  BUTTON_ROLES,
  DOM_INTERFACE,
  ELEMENTS,
  NATIVE_TAG_FOR_ROLE,
  NEEDS_BUTTON_TYPE,
  POINTER_EVENTS,
  PROP_MAP,
  REFUSED_PROPS,
  TAG_ROLE,
  WEB_AS_REPLACES_ROLE,
} from "../tables.mjs";
import { refuse } from "./refuse.mjs";

/** The `cn(...)` call, the string literal, or the bare expression a `className` was written as. */
function injectClasses(attr, classes, diagnostics) {
  if (!classes) {
    return;
  }
  if (!attr) {
    return;
  }

  const init = attr.getInitializer();
  if (!init) {
    return;
  }

  if (Node.isStringLiteral(init)) {
    attr.setInitializer(`"${classes} ${init.getLiteralValue()}"`);
    return;
  }
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (!expr) {
      return;
    }
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
  if (!attr) {
    return null;
  }
  const init = attr.getInitializer();
  if (Node.isStringLiteral(init)) {
    return init.getLiteralValue();
  }
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (Node.isStringLiteral(expr)) {
      return expr.getLiteralValue();
    }
    if (Node.isNumericLiteral(expr)) {
      return expr.getLiteralValue();
    }
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
  if (!attr) {
    return true;
  }

  const init = attr.getInitializer();
  const object = Node.isJsxExpression(init) ? init.getExpression() : null;
  if (Node.isObjectLiteralExpression(object) === false) {
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
    if (!key) {
      continue;
    }

    const accepted = ACCESSIBILITY_STATE_ARIA[key] ?? [];
    if (accepted.some((aria) => present.has(aria))) {
      continue;
    }

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

/** The last heading rank HTML has: `h6`. */
const DEEPEST_HEADING = 6;

function transformElement(open, elements, diagnostics) {
  const tagNode = open.getTagNameNode();
  const rnName = tagNode.getText();
  const entry = ELEMENTS[rnName];
  if (!entry || elements.has(rnName) === false) {
    return false;
  }

  const attrs = () => open.getAttributes().filter(Node.isJsxAttribute);
  const find = (name) => attrs().find((a) => a.getNameNode().getText() === name);

  /**
   * The paired element this tag belongs to, or `null` when the tag is its own element.
   *
   * `<View>…</View>` is a `JsxElement` whose opening tag is this node, and renaming it means
   * renaming the closing tag too — which is only reachable from the element. `<View />` is a
   * `JsxSelfClosingElement`, is the element, and has one tag.
   *
   * Asked as "is the parent a `JsxElement`" it gets the nested case wrong, because a self-closing
   * element's parent is whatever element encloses it: `<View><View /></View>` renamed the outer
   * tag a second time and left the inner `<View />` untouched, which `checkElementLeaks` then read
   * as an element chosen at runtime and refused the file over.
   */
  const element = Node.isJsxOpeningElement(open) ? open.getParent() : null;

  // --- refusals first, so a file that cannot be compiled says so before it is half-rewritten.
  for (const attr of attrs()) {
    const name = attr.getNameNode().getText();
    if (REFUSED_PROPS[name]) {
      refuse(diagnostics, attr, `\`${name}\` on a <${rnName}>: ${REFUSED_PROPS[name]}`);
      return false;
    }
  }
  if (!checkAccessibilityState(rnName, find, attrs, diagnostics)) {
    return false;
  }

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
    // A role the chosen element already has — `role="group"` written for the device on a `View`
    // that is a `<fieldset>` on the web — is the same thing said twice there, so it goes too.
    // So does a role the element says another way, which is `WEB_AS_REPLACES_ROLE`.
    dropRole =
      role !== null &&
      (NATIVE_TAG_FOR_ROLE[role] === webAs ||
        TAG_ROLE[webAs] === role ||
        WEB_AS_REPLACES_ROLE[webAs] === role);
  } else if (role === "heading") {
    const levelAttr = find("aria-level");
    const level = literalValue(levelAttr);
    const levelInit = levelAttr?.getInitializer();
    // A rank known only at runtime — `aria-level={level}` in a component whose caller picks it —
    // cannot become an `<hN>`, because the tag is written once, here. It is not refused either:
    // `role="heading"` + `aria-level` on the element map's tag is a heading of that rank to every
    // assistive technology, and it is exactly what react-native-web renders for the same source.
    // What it is not is an `h2` to a stylesheet or a `querySelector`, which is the trade.
    const dynamic =
      level === null &&
      Node.isJsxExpression(levelInit) &&
      levelInit.getExpression() !== undefined &&
      Node.isNumericLiteral(levelInit.getExpression()) === false &&
      Node.isStringLiteral(levelInit.getExpression()) === false;
    if (dynamic) {
      // Keep both attributes and the element map's own tag.
    } else if (!level || Number(level) < 1 || Number(level) > DEEPEST_HEADING) {
      refuse(
        diagnostics,
        roleAttr,
        '`role="heading"` needs an `aria-level` — a literal between 1 and 6, which the compiler ' +
          "emits as that heading element, or an expression, which it keeps as `role` + " +
          "`aria-level`. There is no such thing as a heading of unknown rank on the DOM",
      );
      return false;
    } else {
      tag = `h${Number(level)}`;
      levelAttr.remove();
      dropRole = true;
    }
  } else if (role && NATIVE_TAG_FOR_ROLE[role]) {
    tag = NATIVE_TAG_FOR_ROLE[role];
    dropRole = true;
  }
  // A role with no element of its own — `radiogroup`, `alert`, `img` — keeps its attribute. What
  // it may not keep is an element whose own semantics it overrides: see `BUTTON_ROLES`.
  else if (role && entry.generic && BUTTON_ROLES.has(role) === false) {
    tag = entry.generic.tag;
    reset = entry.generic.reset;
  }
  if (dropRole) {
    roleAttr.remove();
  }

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
    if (mapped) {
      attr.getNameNode().replaceWithText(mapped);
    }
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
      if (Node.isIdentifier(expr)) {
        refInit.replaceWithText(`{${expr.getText()} as React.Ref<${dom}>}`);
      }
    }
    for (const spread of open.getAttributes().filter(Node.isJsxSpreadAttribute)) {
      const expr = spread.getExpression();
      if (Node.isIdentifier(expr) === false) {
        continue;
      }
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

    if (element) {
      const kids = element
        .getJsxChildren()
        .map((c) => c.getText())
        .join("");
      element.setBodyText(`<div className=${innerClass}>${kids}</div>`);
    }
  }

  // --- the rename itself, last, so every lookup above ran against the React Native name.
  if (element) {
    element.getOpeningElement().getTagNameNode().replaceWithText(tag);
    element.getClosingElement().getTagNameNode().replaceWithText(tag);
  } else {
    tagNode.replaceWithText(tag);
  }
  return true;
}

export function transformElements(sourceFile, elements, diagnostics) {
  let changed = false;
  const opens = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];
  for (const open of opens) {
    if (open.wasForgotten()) {
      continue;
    }
    if (transformElement(open, elements, diagnostics)) {
      changed = true;
    }
  }
  return changed;
}

/**
 * A `<button>` inside a `<button>` is invalid HTML and an axe violation, and it is the one way
 * the Pressable mapping can go wrong that no single element's transform can see.
 */
export function checkNestedInteractive(sourceFile, diagnostics) {
  for (const open of sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
    if (open.getTagNameNode().getText() !== "button") {
      continue;
    }
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
export function checkElementLeaks(sourceFile, elements, diagnostics) {
  for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
    if (id.wasForgotten() || elements.has(id.getText()) === false) {
      continue;
    }
    if (id.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) {
      continue;
    }
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
 * No React Native prop name survived into the output *as a prop name*.
 *
 * `renamePublicProps` walks the syntactic places a prop name can appear, and the way it failed
 * was by there being one more. A name it misses does not break the build and does not warn: React
 * hands an unrecognised prop straight to the DOM node, so the component renders, the attribute is
 * invalid HTML, and whatever the prop was for — an accessible name, in the case that found this —
 * is simply absent. Only a reader using a screen reader would ever notice.
 *
 * "As a prop name" is the whole precision of this. A renamed prop keeps the source's own local
 * name on purpose — `{ "aria-label": accessibilityLabel }` — and the body then references that
 * local freely, so an `accessibilityLabel` *identifier* in the output is normal and an
 * `accessibilityLabel` *key* is the bug. The four positions below are where a key can be written;
 * every other appearance is a reference and is left alone. Comments are outside the syntax tree
 * entirely, which is why the six compiled files explaining `accessibilityState` in prose are fine.
 */
export function checkNativePropLeaks(sourceFile, diagnostics) {
  const leaked = (node, name) =>
    refuse(
      diagnostics,
      node,
      `\`${name}\` is used as a prop name in the compiled output, where it is a React Native name ` +
        "the DOM does not have. React forwards an unknown prop to the element, so this ships as an " +
        "invalid attribute and whatever it was for is silently missing. Add it to `PROP_MAP` in " +
        "`tables.mjs`, or to `REFUSED_PROPS` if it has no web equivalent.",
    );
  const native = (text) => /^accessibility[A-Z]/.test(text);

  // A shorthand is both positions at once, which is exactly how this class of bug hides.
  for (const node of sourceFile.getDescendantsOfKind(SyntaxKind.ShorthandPropertyAssignment)) {
    if (node.wasForgotten() === false && native(node.getName())) {
      leaked(node, node.getName());
    }
  }
  for (const kind of [
    SyntaxKind.JsxAttribute,
    SyntaxKind.PropertySignature,
    SyntaxKind.PropertyAssignment,
  ]) {
    for (const node of sourceFile.getDescendantsOfKind(kind)) {
      if (node.wasForgotten()) {
        continue;
      }
      const name = node
        .getNameNode()
        .getText()
        .replace(/^["']|["']$/g, "");
      if (native(name)) {
        leaked(node.getNameNode(), name);
      }
    }
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
export function renamePublicProps(sourceFile) {
  // `aria-label` and `data-slot` are not identifiers, so as a member name or an object key they
  // have to be quoted. As a JSX attribute they must not be.
  const key = (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `"${name}"`);

  for (const sig of sourceFile.getDescendantsOfKind(SyntaxKind.PropertySignature)) {
    const mapped = PROP_MAP[sig.getName()];
    if (mapped) {
      sig.getNameNode().replaceWithText(key(mapped));
    }
  }

  for (const binding of sourceFile.getDescendantsOfKind(SyntaxKind.BindingElement)) {
    if (binding.getPropertyNameNode()) {
      continue;
    }
    const name = binding.getNameNode().getText();
    const mapped = PROP_MAP[name];
    if (mapped) {
      binding.replaceWithText(`${key(mapped)}: ${name}`);
    }
  }

  /*
   * `{...(label ? { accessibilityLabel } : {})}` -> `{...(label ? { "aria-label": accessibilityLabel } : {})}`.
   *
   * A shorthand property is a prop name and a variable name in one token, and the passes above
   * only ever saw it as the second. So `toggle-chip`'s conditional spread — the idiom this repo
   * uses everywhere a prop is optional under `exactOptionalPropertyTypes` — put a literal
   * `accessibilityLabel` attribute on a DOM `<button>`, where React passes unknown props straight
   * through to the element: an invalid attribute in the HTML, and a chip whose accessible name
   * never arrived. Silent, because nothing errors and the component looks right.
   *
   * Only expanded inside a JSX spread, which is what makes this safe rather than a rename of
   * every object key that happens to collide with a React Native prop name. An object being
   * spread onto an element is an attribute list; an object anywhere else is the author's own.
   */
  for (const short of sourceFile.getDescendantsOfKind(SyntaxKind.ShorthandPropertyAssignment)) {
    const mapped = PROP_MAP[short.getName()];
    if (!mapped) {
      continue;
    }
    if (!short.getFirstAncestorByKind(SyntaxKind.JsxSpreadAttribute)) {
      continue;
    }
    short.replaceWithText(`${key(mapped)}: ${short.getName()}`);
  }

  // Whatever is still a capitalised tag at this point is a component, not a host element: every
  // mapped element became a lowercase tag two passes ago.
  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const mapped = PROP_MAP[attr.getNameNode().getText()];
    if (!mapped) {
      continue;
    }
    const owner = attr.getFirstAncestor(
      (a) => Node.isJsxOpeningElement(a) || Node.isJsxSelfClosingElement(a),
    );
    if (!owner) {
      continue;
    }
    if (/^[A-Z]/.test(owner.getTagNameNode().getText()) === false) {
      continue;
    }
    attr.getNameNode().replaceWithText(mapped);
  }
}
