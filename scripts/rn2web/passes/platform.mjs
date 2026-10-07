import { Node, SyntaxKind } from "ts-morph";
import { FOLDED_IMPORTS } from "../tables.mjs";

/**
 * `Platform.OS` is `"web"` in a file that only ever runs on the web, so the compiler substitutes
 * it and lets the branches collapse.
 *
 * This is what turns the source's platform-guarded a11y props — written that way because React
 * Native has no `aria-pressed` — into plain attributes in the output. The guard is a native-side
 * concern, and the compiled file is the side where it is answered.
 */
export function foldPlatform(sourceFile) {
  let changed = false;

  for (const access of sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
    if (access.wasForgotten()) {
      continue;
    }
    if (access.getExpression().getText() !== "Platform") {
      continue;
    }

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
      if (Node.isCallExpression(call) === false) {
        continue;
      }
      const arg = call.getArguments()[0];
      if (Node.isObjectLiteralExpression(arg) === false) {
        continue;
      }
      const pick =
        arg.getProperty("web") ?? arg.getProperty("default") ?? arg.getProperty("native");
      if (!pick || Node.isPropertyAssignment(pick) === false) {
        continue;
      }
      call.replaceWithText(pick.getInitializer().getText());
      changed = true;
    }
  }

  // `true ? a : b` is `a`. Runs after the substitution above, in the same loop the driver repeats.
  for (const cond of sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression)) {
    if (cond.wasForgotten()) {
      continue;
    }
    const test = cond.getCondition().getText();
    if (test !== "true" && test !== "false") {
      continue;
    }
    cond.replaceWithText((test === "true" ? cond.getWhenTrue() : cond.getWhenFalse()).getText());
    changed = true;
  }

  // `true && a` is `a` and `false && a` is `false`; `||` the mirror. The class-list idiom
  // `cn(Platform.OS === "web" && "animate-pulse")` is what leaves these behind.
  for (const bin of sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
    if (bin.wasForgotten()) {
      continue;
    }
    const op = bin.getOperatorToken().getText();
    const left = bin.getLeft().getText();
    if ((op !== "&&" && op !== "||") || (left !== "true" && left !== "false")) {
      continue;
    }
    const keepsRight = (op === "&&") === (left === "true");
    bin.replaceWithText(keepsRight ? bin.getRight().getText() : left);
    changed = true;
  }

  // `if (true) { … } else { … }` is its first arm, `if (false)` its second or nothing. This is the
  // statement form of the ternary above, and it is how a source writes a branch whose two arms are
  // different *elements* — a `ScrollView` on device, a scrolling `<div>` here — without naming
  // either outside a JSX tag. An arm that returns makes whatever follows it in the block dead, and
  // the dead half is dropped with it, so the native element never reaches the element pass.
  for (const stmt of sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement)) {
    if (stmt.wasForgotten()) {
      continue;
    }
    const test = stmt.getExpression().getText();
    if (test !== "true" && test !== "false") {
      continue;
    }
    const container = stmt.getParent();
    if (Node.isBlock(container) === false && Node.isSourceFile(container) === false) {
      continue;
    }

    const arm = test === "true" ? stmt.getThenStatement() : stmt.getElseStatement();
    const body = arm === undefined ? [] : Node.isBlock(arm) ? arm.getStatements() : [arm];
    const texts = body.map((s) => s.getText());
    const last = body.at(-1);
    const exits =
      last !== undefined && (Node.isReturnStatement(last) || Node.isThrowStatement(last));

    // With the comments: a comment on a line of its own is a statement to ts-morph, and it is
    // that list `insertStatements` counts in. Counted without them, the arm lands one statement
    // early for every comment above the `if` — a `return` ahead of the hook that came before it.
    const statements = container.getStatementsWithComments();
    const index = statements.findIndex((s) => s.compilerNode === stmt.compilerNode);
    if (exits) {
      for (const dead of statements.slice(index + 1).reverse()) {
        dead.remove();
      }
    }
    stmt.remove();
    if (texts.length) {
      container.insertStatements(index, texts);
    }
    changed = true;
  }

  // The `Platform` import itself, once nothing references it.
  for (const decl of sourceFile.getImportDeclarations()) {
    if (decl.getModuleSpecifierValue() !== "react-native") {
      continue;
    }
    for (const named of decl.getNamedImports()) {
      if (FOLDED_IMPORTS.has(named.getName()) === false) {
        continue;
      }
      named.remove();
      changed = true;
    }
  }

  return changed;
}
