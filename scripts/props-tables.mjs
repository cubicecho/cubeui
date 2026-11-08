/**
 * A component's props table, from the TSDoc on its props type. `build-props-tables.mjs` finds the
 * components the skill asks for and writes the tables; this is the part that reads one, kept apart
 * so a test can hand it a small program instead of the registry.
 *
 * A row is a prop declared in the component's own files; props it takes from another registry
 * type (`Button`'s, on `ConfirmButton`) are named in one line under the table, and the platform's
 * own props (a `Pressable`'s, a `<div>`'s) are left out. The text is the first paragraph of the
 * prop's TSDoc, and a `@deprecated` prop's row opens by saying so, with what its tag says
 * replaces it.
 *
 * A props type that is a union (`LoadState` takes a `count` or a `record`) is one table, not one
 * per member: each prop is one row, its type the union of what the members allow, and a prop only
 * some members allow says which, "(with `record`)". A member that forbids a prop does it with
 * `never`, which says nothing to the reader choosing it, so the text is taken from a member that
 * allows it (#463).
 */

import { relative } from "node:path";
import ts from "typescript";

const oneLine = (text) => text.replace(/\s+/g, " ").trim();
const firstParagraph = (text) => oneLine(text.split(/\n\s*\n/)[0] ?? "");
const cell = (text) => text.replace(/\|/g, "\\|");

/**
 * TSDoc as the table shows it. `{@link SplitWidth}` is a link in an editor and noise in a table,
 * so it is written as the name it points at.
 */
function textOf(parts) {
  return parts
    .filter((part) => part.kind !== "link")
    .map((part) => (part.kind === "linkName" ? `\`${part.text}\`` : part.text))
    .join("");
}

/**
 * A prop's row text. A deprecated prop often has no summary of its own, only the tag, and a row
 * with nothing in it reads as a prop nobody documented rather than one to move off.
 */
function docOf(prop, checker) {
  const doc = firstParagraph(textOf(prop.getDocumentationComment(checker)));
  const tag = prop.getJsDocTags(checker).find((t) => t.name === "deprecated");
  if (tag === undefined) {
    return doc;
  }
  const replacement = oneLine(textOf(tag.text ?? []));
  return ["**Deprecated.**", replacement, doc].filter(Boolean).join(" ");
}

const LITERAL =
  ts.TypeFlags.StringLiteral |
  ts.TypeFlags.NumberLiteral |
  ts.TypeFlags.BooleanLiteral |
  ts.TypeFlags.Null |
  ts.TypeFlags.Undefined;

/** `"sm" | "md"`, and not `SIZES` or a `string`: a type made only of values. */
function literalsOnly(type) {
  return (type.isUnion() ? type.types : [type]).every((member) => member.flags & LITERAL);
}

/**
 * A type alias the reader cannot import: one its file does not export (`IconSize`), or one of
 * TypeScript's own that computes a type (`Exclude<ButtonSize, IconSize>`).
 */
function isUnexportedAlias(node, checker) {
  const symbol = checker.getSymbolAtLocation(node.typeName);
  const decl = symbol?.declarations?.[0];
  if (decl === undefined || ts.isTypeAliasDeclaration(decl) === false) {
    return false;
  }
  const file = decl.getSourceFile();
  if (file.isDeclarationFile) {
    return ["Exclude", "Extract", "NonNullable"].includes(symbol.name);
  }
  const module = checker.getSymbolAtLocation(file);
  return module === undefined || checker.getExportsOfModule(module).includes(symbol) === false;
}

/**
 * Whether a type is written as a name the reader cannot look up, which the checker can spell out.
 * `keyof typeof SIZES` names a constant the reader cannot see, and the checker knows it is
 * `"sm" | "md" | "lg"`. The same for an indexed type (`ButtonProps["variant"]`), a constant's type
 * (`typeof DEFAULT_MAX`), and an alias the file keeps to itself. `typeof View` names a component
 * the reader can import, and stays; so does an exported alias such as `SplitWidth`, which the
 * skill can point at.
 */
function namesAConstant(node, checker) {
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword) {
    return true;
  }
  if (ts.isIndexedAccessTypeNode(node)) {
    return true;
  }
  if (ts.isTypeQueryNode(node) && /^[A-Z][A-Z0-9_]*$/.test(node.exprName.getText())) {
    return true;
  }
  if (ts.isTypeReferenceNode(node) && isUnexportedAlias(node, checker)) {
    return literalsOnly(checker.getTypeFromTypeNode(node));
  }
  return false;
}

/** `text` cut at each `separator` outside brackets and quotes. */
function splitTop(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (char === "\\") {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (depth === 0 && text.startsWith(separator, i)) {
      parts.push(text.slice(start, i).trim());
      start = i + separator.length;
      i = start - 1;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if ("([{<".includes(char)) {
      depth += 1;
    } else if (")]}".includes(char) || (char === ">" && text[i - 1] !== "=")) {
      depth -= 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

/** `((a) => b)` → `(a) => b`: parentheses that hold the whole of a type, taken off. */
function unwrap(text) {
  if (text.startsWith("(") === false || text.endsWith(")") === false) {
    return text;
  }
  let depth = 0;
  for (let i = 0; i < text.length - 1; i += 1) {
    depth += text[i] === "(" ? 1 : text[i] === ")" ? -1 : 0;
    if (depth === 0) {
      return text;
    }
  }
  return unwrap(text.slice(1, -1).trim());
}

/**
 * One member of a union, spelled one way however it was written, so two members' copies of a type
 * are one. A function type is parenthesised, as TypeScript prints it, so `(a: string) => void`
 * beside another member cannot be read as returning it.
 */
function memberText(text) {
  const bare = unwrap(oneLine(text));
  return splitTop(bare, "=>").length > 1 ? `(${bare})` : bare;
}

const printed = (checker, type) =>
  oneLine(checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation));

/**
 * What a constant's name stands for. `keyof typeof SIZES` is its keys in the order they are
 * written, which is the order the source explains them in; anything else is what the checker
 * prints. `null` goes too: it is how cva says a variant may be left out, which `undefined`
 * already says.
 */
function expanded(node, checker) {
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword) {
    const keys = checker.getPropertiesOfType(checker.getTypeFromTypeNode(node.type));
    if (keys.length > 0) {
      return keys.map((key) => (/^\d+$/.test(key.name) ? key.name : JSON.stringify(key.name)));
    }
  }
  const type = checker.getTypeFromTypeNode(node);
  // A union of values is listed value by value: printed whole, `ButtonProps["size"]` comes back
  // as `"sm" | IconSize`, an alias again.
  const members =
    type.isUnion() && literalsOnly(type)
      ? type.types.map((member) => printed(checker, member))
      : splitTop(printed(checker, type), "|");
  return members.filter((member) => member !== "null");
}

/** The members of a type node's union, as written, with each constant's name expanded. */
function membersOfNode(node, checker) {
  if (ts.isUnionTypeNode(node)) {
    return node.types.flatMap((member) => membersOfNode(member, checker));
  }
  return namesAConstant(node, checker) ? expanded(node, checker) : [node.getText()];
}

/** What one declaration of a prop allows: the union's members, less `undefined` and `never`. */
function allowedBy(decl, prop, checker) {
  const members = decl.type
    ? membersOfNode(decl.type, checker)
    : splitTop(printed(checker, checker.getTypeOfSymbolAtLocation(prop, decl)), "|");
  return members.map(memberText).filter((m) => m !== "undefined" && m !== "never");
}

/** The union of what several declarations allow, in the order first written. */
function unionOf(allowed) {
  let members = [...new Set(allowed.flat())];
  if (members.includes("true") && members.includes("false")) {
    const at = members.findIndex((m) => m === "true" || m === "false");
    members = members.filter((m) => m !== "true" && m !== "false");
    members.splice(at, 0, "boolean");
  }
  return members.length > 0 ? members.join(" | ") : "never";
}

/**
 * `{ level = 3, label = DEFAULT_LABEL }`: the defaults written in the component's own parameter.
 * A default that names a constant is shown as its value when the constant is a literal, for the
 * same reason a type is.
 */
function defaultsOf(declaration, checker) {
  const fn = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
  const defaults = new Map();
  const shown = (initializer) => {
    const named = ts.isIdentifier(initializer) || ts.isPropertyAccessExpression(initializer);
    const type = named ? checker.getTypeAtLocation(initializer) : undefined;
    return type && type.flags & LITERAL ? printed(checker, type) : initializer.getText();
  };
  const visit = (node) => {
    if (ts.isFunctionLike(node) && node.parameters?.length > 0) {
      const [first] = node.parameters;
      if (ts.isObjectBindingPattern(first.name)) {
        for (const element of first.name.elements) {
          const prop = element.propertyName ?? element.name;
          if (element.initializer && ts.isIdentifier(prop)) {
            defaults.set(prop.text, shown(element.initializer));
          }
        }
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  if (fn) {
    visit(fn);
  }
  return defaults;
}

/**
 * Of the members a prop appears in, the one whose declaration a row is read from: one that allows
 * it and says what it is, then one that allows it, then any. `SidebarLayout`'s first member
 * forbids `brandSlot` with `never`, and its second is where the prop is written.
 */
function bestOf(entries) {
  const rank = (e) => (e.allowed.length > 0 ? 2 : 0) + (e.doc ? 1 : 0);
  return entries.reduce((best, e) => (rank(e) > rank(best) ? e : best));
}

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const covers = (a, b) => [...b].every((x) => a.has(x));

/**
 * When a prop is allowed by only some members, the other prop that says which: "(with `record`)"
 * on `notFoundLabel`, "(instead of `count`)" on `record`, "(without `compact`)" on `description`.
 *
 * A prop picks a member when every member it can be given in requires it: `record`, `count`,
 * `sidebarHideBelow`, and `compact`, which is `true` in one member and only `false` in the rest.
 * "With" names the narrowest one whose members cover this prop's. Two that pick the same members
 * (`record` and `notFoundLabel`) are peers, and only the later one names the earlier. Failing
 * that, "instead of" or "without" names a prop given in exactly the other members: "without" when
 * that prop picks them and this one is optional, since "optional instead of required" does not
 * read. A prop that picks is not said to be instead of one that does not: `sidebarHideBelow` is
 * the choice, and `stackBelow` is what it turns off.
 */
function conditionOf(name, props, memberCount) {
  const me = props.get(name);
  if (me.allowedIn.size === memberCount || me.allowedIn.size === 0) {
    return "";
  }
  const order = [...props.keys()];
  const picks = (p) =>
    p.givenIn.size > 0 && p.givenIn.size < memberCount && covers(p.requiredIn, p.givenIn);
  const peerAfter = (other, p) =>
    sameSet(p.givenIn, me.allowedIn) && picks(me) && order.indexOf(name) < order.indexOf(other);
  const others = [...props].filter(([other]) => other !== name);

  const [withOther, withProp] =
    others
      .filter(
        ([other, p]) =>
          picks(p) && covers(p.givenIn, me.allowedIn) && peerAfter(other, p) === false,
      )
      .sort(([, a], [, b]) => a.givenIn.size - b.givenIn.size)[0] ?? [];
  if (withOther) {
    const required = covers(me.requiredIn, withProp.givenIn);
    return `${required ? "required " : ""}with \`${withOther}\``;
  }

  const rest = new Set([...Array(memberCount).keys()].filter((m) => me.allowedIn.has(m) === false));
  const [insteadOther, insteadProp] =
    others
      .filter(([, p]) => sameSet(p.givenIn, rest) && (picks(p) || picks(me) === false))
      .sort(([, a], [, b]) => Number(picks(b)) - Number(picks(a)))[0] ?? [];
  if (insteadOther) {
    const word = picks(insteadProp) && picks(me) === false ? "without" : "instead of";
    return `${word} \`${insteadOther}\``;
  }
  return "";
}

/**
 * The rows of `name`'s table: the component exported from `path`, resolved by `program`. `root`
 * is the repository; a prop counts as the registry's when it is declared under `root/registry/`.
 */
export function propsRows(program, path, name, root) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(path);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exported = checker.getExportsOfModule(moduleSymbol).find((s) => s.name === name);
  if (exported === undefined) {
    throw new Error(`${relative(root, path)} does not export ${name}.`);
  }
  const symbol =
    exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  const declaration = symbol.valueDeclaration ?? symbol.declarations[0];
  const signature = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures()[0];
  if (signature === undefined || signature.parameters.length === 0) {
    throw new Error(`${name} in ${relative(root, path)} takes no props.`);
  }
  const propsType = checker.getTypeOfSymbolAtLocation(signature.parameters[0], declaration);
  const members = propsType.isUnion() ? propsType.types : [propsType];

  // The item's own files: `badge.tsx` and the `badge-base.ts` its props type is written in.
  const stem = path.replace(/\.tsx?$/, "");
  const ownFiles = new Set([path, `${stem}-base.ts`]);

  // A prop the platform declares is the platform's, even where a registry type names it again.
  const props = new Map();
  members.forEach((member, index) => {
    for (const prop of checker.getPropertiesOfType(member)) {
      const decl = prop.declarations?.find((d) => d.getSourceFile().fileName.startsWith(root));
      const file = decl?.getSourceFile().fileName ?? "";
      const p = props.get(prop.name) ?? { entries: [], platform: false };
      if (decl === undefined || relative(root, file).startsWith("registry/") === false) {
        p.platform = true;
      } else {
        const allowed = allowedBy(decl, prop, checker);
        const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
        p.entries.push({ index, prop, decl, allowed, optional, doc: docOf(prop, checker) });
      }
      props.set(prop.name, p);
    }
  });
  for (const [propName, p] of props) {
    if (p.platform) {
      props.delete(propName);
      continue;
    }
    const allowing = p.entries.filter((e) => e.allowed.length > 0);
    p.allowedIn = new Set(allowing.map((e) => e.index));
    p.requiredIn = new Set(allowing.filter((e) => e.optional === false).map((e) => e.index));
    // Where it can be given a value that does something: `compact` only where it may be `true`.
    p.givenIn = new Set(
      allowing.filter((e) => e.allowed.some((t) => t !== "false")).map((e) => e.index),
    );
    p.best = bestOf(p.entries);
  }

  const own = [];
  const borrowed = new Map();
  const defaults = defaultsOf(declaration, checker);
  for (const [propName, p] of props) {
    const { decl, prop } = p.best;
    const file = decl.getSourceFile().fileName;
    if (ownFiles.has(file) === false) {
      const where = `\`${relative(root, file)}\``;
      borrowed.set(where, [...(borrowed.get(where) ?? []), propName]);
      continue;
    }
    // In the order the first member writes them, which is how the source reads.
    const first = p.entries[0].decl;
    own.push({
      pos: first.pos + (first.getSourceFile().fileName === path ? Number.MAX_SAFE_INTEGER / 2 : 0),
      name: propName,
      type: unionOf(p.entries.map((e) => e.allowed)),
      required: p.requiredIn.size === members.length,
      condition: conditionOf(propName, props, members.length),
      fallback: defaults.get(propName) ?? "",
      doc: docOf(prop, checker),
    });
  }
  own.sort((a, b) => a.pos - b.pos);
  return { own, borrowed };
}

/** The rows a reader would be misled by: a prop typed `never`, or a constant's name for a type. */
export function misleadingRows(rows) {
  return rows.filter((row) => row.type === "never" || /\bkeyof typeof\b/.test(row.type));
}

/** The table as the skill shows it. */
export function renderTable(name, path, root, { own, borrowed }) {
  const lines = [
    `\`${name}\`'s props, from the TSDoc in \`${relative(root, path)}\`:`,
    "",
    "| Prop | Type | Default | What it is |",
    "| --- | --- | --- | --- |",
    ...own.map((p) => {
      const notes = [p.required ? "required" : "", p.condition].filter(Boolean).join(", ");
      return `| \`${p.name}\`${notes ? ` (${notes})` : ""} | \`${cell(p.type)}\` | ${
        p.fallback ? `\`${cell(p.fallback)}\`` : ""
      } | ${cell(p.doc)} |`;
    }),
  ];
  for (const [where, names] of borrowed) {
    lines.push(
      "",
      `It also takes the props declared in ${where}: ${names
        .slice()
        .sort()
        .map((n) => `\`${n}\``)
        .join(", ")}.`,
    );
  }
  return lines.join("\n");
}
