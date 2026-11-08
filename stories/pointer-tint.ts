/**
 * Whether the stylesheet gives an element a fill under the pointer. `userEvent.hover` dispatches
 * events and cannot put an element in `:hover`, so the rules are read instead: any rule written for
 * `:hover` that sets a background, and that matches the element once `:hover` is taken out of it.
 * Nested rules are followed, with `&` read as the rule around them, whichever form the stylesheet
 * was emitted in. `property` asks after the edge's colour instead: a `border-color` written with a
 * `var()` leaves its longhands empty, so the shorthand is read as well.
 */
export function tintsUnderPointer(
  element: Element,
  property: "backgroundColor" | "borderColor" = "backgroundColor",
) {
  const sets = (style: CSSStyleDeclaration) =>
    property === "backgroundColor"
      ? style.backgroundColor !== ""
      : style.borderTopColor !== "" || style.borderColor !== "";
  const matches = (selector: string) => {
    try {
      return element.matches(selector.replace(/(?<!\\):hover/g, ""));
    } catch {
      return false;
    }
  };
  const visit = (rules: CSSRuleList, around: string | undefined): boolean => {
    for (const rule of Array.from(rules)) {
      let selector = around;
      if (rule instanceof CSSStyleRule) {
        const own = rule.selectorText;
        selector =
          around === undefined
            ? own
            : own.includes("&")
              ? own.replaceAll("&", `:is(${around})`)
              : `:is(${around}) ${own}`;
      }
      const style = "style" in rule ? (rule as CSSStyleRule).style : undefined;
      if (
        selector !== undefined &&
        /(?<!\\):hover/.test(selector) &&
        style !== undefined &&
        sets(style) &&
        matches(selector)
      ) {
        return true;
      }
      if ("cssRules" in rule && visit((rule as CSSGroupingRule).cssRules, selector)) {
        return true;
      }
    }
    return false;
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (visit(rules, undefined)) {
      return true;
    }
  }
  return false;
}
