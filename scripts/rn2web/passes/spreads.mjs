import { Node, SyntaxKind } from "ts-morph";

/** `{...({ 'aria-pressed': x } as const)}` is three attributes wearing a disguise. Undress it. */
export function inlineSpreads(sourceFile) {
  let changed = false;

  for (const spread of sourceFile.getDescendantsOfKind(SyntaxKind.JsxSpreadAttribute)) {
    if (spread.wasForgotten()) {
      continue;
    }

    let expr = spread.getExpression();
    while (Node.isParenthesizedExpression(expr) || Node.isAsExpression(expr)) {
      expr = Node.isAsExpression(expr) ? expr.getExpression() : expr.getExpression();
    }
    if (Node.isObjectLiteralExpression(expr) === false) {
      continue;
    }

    const parts = [];
    let literal = true;
    for (const prop of expr.getProperties()) {
      // `{ href }` is `href={href}`, the same attribute written the short way.
      if (Node.isShorthandPropertyAssignment(prop)) {
        parts.push(`${prop.getName()}={${prop.getName()}}`);
        continue;
      }
      if (Node.isPropertyAssignment(prop) === false) {
        literal = false;
        break;
      }
      const nameNode = prop.getNameNode();
      const name = Node.isStringLiteral(nameNode) ? nameNode.getLiteralValue() : nameNode.getText();
      // `{}` from a collapsed guard, and anything computed, are the two cases to leave alone.
      if (/^[A-Za-z_][\w-]*$/.test(name) === false) {
        literal = false;
        break;
      }
      const value = prop.getInitializer();
      parts.push(
        Node.isStringLiteral(value) ? `${name}=${value.getText()}` : `${name}={${value.getText()}}`,
      );
    }
    if (!literal) {
      continue;
    }

    spread.replaceWithText(parts.join(" ") || "");
    changed = true;
  }

  // `{...{}}` collapses to the empty string above, which leaves a stray attribute slot.
  return changed;
}
