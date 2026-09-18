/**
 * The compiler's judgement, in tables.
 *
 * Everything the transform decides that is not mechanical lives here rather than in the visitor,
 * because these are the entries a reader has to argue with. The visitor below them is meant to be
 * boring: look a thing up, and if it is not in a table, refuse.
 *
 * "Refuse" is the load-bearing word. The compiler emits nothing it cannot justify from these
 * tables — a construct with no entry is a diagnostic naming the file and line, not a guess. A
 * compiler that silently emits subtly-wrong DOM is worse than no compiler, because the RN half
 * stays right and nobody looks at the web half again.
 */

/**
 * Level 1 of the plan: the element map.
 *
 * `reset` is the class from `compiled/cube-rn-reset.css` that restores what react-native-web's
 * per-component base class was supplying and what Yoga supplies on device. Without it a compiled
 * `<div>` is `display: block` and every `flex-row` in the source silently stops meaning anything.
 * This was the plan's open risk #1; `stories/card.stories.tsx` is what settles it.
 */
export const ELEMENTS = {
  View: { tag: "div", reset: "cube-rn-view" },
  Text: { tag: "span", reset: "cube-rn-text" },
  /**
   * A `Pressable` is a button by definition — it exists to be pressed — so it compiles to a real
   * `<button>` rather than to a `div` with a click handler, which is not reachable by keyboard.
   *
   * This is not the compiler taking a position. react-native-web already renders this `<button>`,
   * `type="button"` included, and `stories/card.stories.tsx` asserts it on both halves. Compiling
   * removes the runtime that was deriving it, and changes nothing about the result.
   */
  /**
   * `generic` is what a `Pressable` becomes when the author asked for a role a `<button>` may not
   * carry — see `BUTTON_ROLES`. It drops `cube-rn-pressable` with the element, because that class
   * exists only to undo a `<button>`'s user-agent chrome and there is none on a `<div>`.
   */
  Pressable: {
    tag: "button",
    generic: { tag: "div", reset: "cube-rn-view" },
    reset: "cube-rn-view cube-rn-pressable",
    attrs: { type: "button" },
  },
  /**
   * `overflow-auto` rather than `overflow-scroll`: a `ScrollView` shorter than its content scrolls
   * on device and one taller than its content shows no bar, which is `auto`.
   *
   * `contentContainer` is the one place the compiler emits an element the source did not write.
   * A `ScrollView` is two boxes, not one — the scrolling viewport and the content container the
   * `contentContainerClassName` prop styles — and react-native-web renders both for the same
   * reason. Collapsing them into a single `<div>` would put the padding on the scroller, where it
   * scrolls away instead of surrounding the content.
   */
  ScrollView: {
    tag: "div",
    reset: "cube-rn-view",
    classes: "overflow-auto",
    contentContainer: { reset: "cube-rn-view", from: "contentContainerClassName" },
  },
};

/**
 * React Native imports that are legal in a compiled file without being elements.
 *
 * `Platform` is here because it is folded away rather than emitted — see `foldPlatform`. Anything
 * from `react-native` that is in neither this set nor `ELEMENTS` is a refusal.
 */
export const FOLDED_IMPORTS = new Set(["Platform"]);

/**
 * React Native components that are deliberately out of scope, with the reason given to the author.
 *
 * Every one of these is a real component with a real web answer, and the answer is long enough
 * that a table entry would be a lie: `Modal` is a focus trap, a scroll lock and an inert
 * background; `TextInput` is `<input>` or `<textarea>` depending on a prop, with its own
 * keyboard, autocapitalisation and placeholder vocabulary. Those get a hand-written `.web.tsx`,
 * which is level 4 of the plan and already how the twelve behavioural items work.
 */
export const OUT_OF_SCOPE = {
  Modal: "a modal is a focus trap, a scroll lock and an inert background, not an element",
  TextInput: "an input's type, keyboard and placeholder vocabulary do not survive a table",
  FlatList: "a virtualised list has no DOM counterpart worth generating",
  SectionList: "a virtualised list has no DOM counterpart worth generating",
  Image: "`resizeMode`, `source` and the URI/require split need their own decision",
  Animated: "the driver differs; write the web half",
  KeyboardAvoidingView: "there is no soft keyboard to avoid",
  SafeAreaView: "there are no insets",
  Switch: "the native control and `<input type=checkbox>` differ in more than markup",
  ActivityIndicator: "the spinner is drawn, not declared",
};

/**
 * Level 2 of the plan: the semantics already written in the React Native source.
 *
 * A role in this table names an HTML element that *is* that role, so the compiler emits the
 * element and drops the attribute — `role="button"` on a `<button>` is the same thing said twice,
 * and a redundant role is the kind of thing that later disagrees with the element it sits on.
 *
 * A role that is not in this table keeps its `role` attribute and its mapped tag, because ARIA
 * can say things HTML has no element for (`radiogroup`, `alert`, `img` on a coloured bar).
 */
export const NATIVE_TAG_FOR_ROLE = {
  // `heading` is a function of `aria-level`, handled separately: h1..h6.
  button: "button",
  link: "a",
  list: "ul",
  listitem: "li",
  navigation: "nav",
  main: "main",
  article: "article",
  banner: "header",
  contentinfo: "footer",
};

/**
 * The roles a `<button>` is allowed to carry, and the reason a `Pressable` does not always become
 * one.
 *
 * A role on an element replaces that element's own semantics rather than adding to them, so
 * `<button role="alert">` is not a button that also announces — it is an alert, and the press
 * handling a `Pressable` was written for has quietly stopped being exposed. ARIA calls this out
 * explicitly, and it is the one case where compiling the element map straight through produces
 * markup that passes a glance and fails an audit.
 *
 * The roles here are the interactive ones a `<button>` legitimately takes: the ARIA checkbox,
 * radio, switch, tab and menu-item patterns are all conventionally built on a real `<button>`,
 * which is what gives them focus and the space/enter handling for free. Anything else — `alert`,
 * `img`, `radiogroup`, `progressbar` — is non-interactive, and the compiler emits the generic box
 * with the role on it, which is also what react-native-web renders.
 */
export const BUTTON_ROLES = new Set([
  "button",
  "checkbox",
  "combobox",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "switch",
  "tab",
  "treeitem",
]);

/**
 * Tags that must carry `type="button"` however they were arrived at.
 *
 * A `<button>` with no type submits the form it happens to be inside. A `Pressable` never does
 * that, so leaving the type off would be the compiler inventing a behaviour the source does not
 * have. react-native-web emits it for the same reason.
 */
export const NEEDS_BUTTON_TYPE = new Set(["button"]);

/**
 * Props that are spelled differently on the two platforms but mean the same thing.
 *
 * This applies **only to attributes on a mapped element**, never to a component's own declared
 * props. A compiled `<Card onPress={...}>` still takes `onPress`: keeping one public API across
 * both platforms is the entire point of compiling, and renaming the prop would produce two
 * components that have to be learned separately.
 */
export const PROP_MAP = {
  onPress: "onClick",
  accessibilityRole: "role",
  accessibilityLabel: "aria-label",
  accessibilityHint: "aria-description",
  accessibilityLabelledBy: "aria-labelledby",
  accessibilityValue: null, // handled: expanded into aria-value*
  nativeID: "id",
  /**
   * `testID` becomes `data-slot`, which is the vocabulary cubeui's authoring rules already use on
   * the web and what its `check-vocabulary.mjs` reads. react-native-web spells the same prop
   * `data-testid`; the registry's rule 6 is about slots, not about tests, so `data-slot` is the
   * one that keeps the two registries speaking one language.
   */
  testID: "data-slot",
};

/**
 * Props with no honest translation, each with the sentence the author gets.
 *
 * `accessibilityState` is the entry worth reading. It is not merely untranslatable — it is
 * **silently dropped by react-native-web today**, which is a live bug in any component that
 * relies on it, and the Stage 0 spike found three. So the compiler refuses it rather than
 * dropping it quietly, and the refusal is what stops the bug coming back.
 */
export const REFUSED_PROPS = {
  onLayout: "there is no measurement callback; use a ResizeObserver in a hand-written `.web.tsx`",
  onLongPress: "a long press is a gesture, not an event; decide what it means on a pointer first",
  hitSlop: "an expanded touch target is padding plus a negative margin, which is a design choice",
  numberOfLines: "truncation is `line-clamp-N`, which belongs in the source's own className",
  ellipsizeMode: "see `numberOfLines`",
  allowFontScaling: "the browser scales text itself",
  removeClippedSubviews: "a virtualisation hint with no counterpart",
  collapsable: "a native view-flattening hint with no counterpart",
  renderToHardwareTextureAndroid: "a native rasterisation hint with no counterpart",
  shouldRasterizeIOS: "a native rasterisation hint with no counterpart",
};

/**
 * What each key of an `accessibilityState` has to be said again as, for the element to still say it
 * on the web.
 *
 * This table is the Stage 0 spike's one real finding, written down so it cannot be forgotten.
 * **react-native-web drops `accessibilityState` entirely** — it forwards an allowlist of `aria-*`
 * props and nothing else — so a component that announces its state only this way is styled and
 * silent on web, and a screen reader user cannot tell which pill of a segmented control is current.
 * The spike found three such components in this registry.
 *
 * So `accessibilityState` is not refused and it is not dropped quietly. The compiler checks that
 * every key in it is also said with an explicit `aria-*` prop on the same element, and refuses the
 * file if one is not. When they are all covered the prop is dropped, because by then it is the
 * native spelling of something the output already says.
 *
 * Each key lists every `aria-*` that would be an acceptable answer, because the right one depends
 * on the role: `selected` is `aria-pressed` on a button, `aria-selected` on a tab or an option, and
 * `aria-checked` on a radio. Picking the wrong one is not a detail — `aria-selected` on a button is
 * an `aria-allowed-attr` violation that axe fails the build over.
 */
export const ACCESSIBILITY_STATE_ARIA = {
  selected: ["aria-pressed", "aria-selected", "aria-checked", "aria-current"],
  checked: ["aria-checked"],
  disabled: ["aria-disabled", "disabled"],
  expanded: ["aria-expanded"],
  busy: ["aria-busy"],
};

/**
 * `pointerEvents` is a prop on native and a style on the web, and its two "box" values describe a
 * view and its children disagreeing — which CSS says with two rules on two selectors rather than
 * one value on one element. So each value maps to a class in `cube-rn-reset.css` rather than to an
 * inline style, and those four classes are transcribed from react-native-web's own style compiler
 * (`exports/StyleSheet/compiler/index.js`), `!important` included.
 */
export const POINTER_EVENTS = {
  auto: "cube-rn-pe-auto",
  none: "cube-rn-pe-none",
  "box-none": "cube-rn-pe-box-none",
  "box-only": "cube-rn-pe-box-only",
};

/**
 * Type-level equivalents, so the compiled file typechecks against the DOM rather than against
 * React Native's own prop types.
 *
 * This is where compiling has a cost that cannot be hidden, and it is worth stating rather than
 * burying: `React.ComponentProps<typeof View>` and `React.ComponentPropsWithoutRef<"div">` are
 * not the same set. A caller's escape hatch — `onLayout` on one side, `onMouseEnter` on the
 * other — is a different escape hatch on each platform. The component's *own* props are
 * identical, which is the part that matters, but one shared `.d.ts` cannot describe both.
 */
export const REF_TYPE = {
  View: "HTMLDivElement",
  Text: "HTMLSpanElement",
  Pressable: "HTMLButtonElement",
  ScrollView: "HTMLDivElement",
};

/** The DOM tag whose props stand in for each React Native component's props. */
export const PROPS_TAG = {
  View: "div",
  Text: "span",
  Pressable: "button",
  ScrollView: "div",
};

/**
 * The DOM interface behind each tag the compiler can emit, for the casts on `ref` and `{...props}`.
 *
 * These casts are the second honest cost of compiling, after the props type, and they exist because
 * React Native has one view type where the DOM has thirty. `React.ElementRef<typeof Text>` is a
 * single thing; the `<span>`, `<h3>` and `<button>` it can compile to are three, and a component
 * that renders a `<Text role="heading">` therefore declares a ref its own output does not satisfy.
 * The cast reconciles the compiler's own inference with the type the source could express, and it
 * is sound in the only direction that matters: the node really is the element the compiler emitted.
 *
 * The alternative was rewriting each component's declared ref and props types from the element it
 * renders, which works right up until two components share a `ViewProps` alias and render different
 * tags — which is the first thing `card.tsx` does.
 */
export const DOM_INTERFACE = {
  a: "HTMLAnchorElement",
  article: "HTMLElement",
  button: "HTMLButtonElement",
  div: "HTMLDivElement",
  footer: "HTMLElement",
  h1: "HTMLHeadingElement",
  h2: "HTMLHeadingElement",
  h3: "HTMLHeadingElement",
  h4: "HTMLHeadingElement",
  h5: "HTMLHeadingElement",
  h6: "HTMLHeadingElement",
  header: "HTMLElement",
  li: "HTMLLIElement",
  main: "HTMLElement",
  nav: "HTMLElement",
  section: "HTMLElement",
  span: "HTMLSpanElement",
  ul: "HTMLUListElement",
};

/**
 * Type-level names from `react-native` that have a DOM equivalent good enough to substitute.
 *
 * `ViewStyle` becomes `React.CSSProperties` and not something narrower on purpose: the two are
 * genuinely different sets — `shadowOffset` exists on one and `boxShadow` on the other — and a
 * narrower type would claim a correspondence the compiler has not checked. What it does check is
 * that the *values* written in the source are DOM-legal, because they end up in a `style` prop.
 */
export const TYPE_MAP = {
  ViewStyle: "React.CSSProperties",
  TextStyle: "React.CSSProperties",
  ImageStyle: "React.CSSProperties",
  ViewProps: 'React.ComponentPropsWithoutRef<"div">',
  TextProps: 'React.ComponentPropsWithoutRef<"span">',
  PressableProps: 'React.ComponentPropsWithoutRef<"button">',
};
