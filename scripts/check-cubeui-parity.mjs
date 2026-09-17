/**
 * Proves the web emitter still reproduces cubeui's committed token blocks exactly.
 *
 * Read-only in both directions: it never writes into cubeui, and cubeui never
 * learns this exists. It is a transition-period guard — when cubeui is archived
 * this script is deleted, not rewritten.
 *
 * Skips (exit 0) rather than fails when cubeui is not on disk, so the repo still
 * builds on a machine that has only cubeui-rn checked out.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cubeui = resolve(process.env.CUBEUI_PATH ?? join(root, "..", "cubeui"), "preview/index.css");

if (!existsSync(cubeui)) {
  console.log(`  skip    cubeui not found at ${cubeui} — parity check skipped`);
  process.exit(0);
}

const mine = join(root, "dist/tokens.web.css");
if (!existsSync(mine)) {
  console.error("  dist/tokens.web.css missing. Run: npm run tokens:build");
  process.exit(1);
}

/** Pull one brace-delimited top-level block out of a stylesheet. */
const block = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return null;
  const end = css.indexOf("\n}", start);
  return end === -1 ? null : css.slice(start, end + 2);
};

const theirs = readFileSync(cubeui, "utf8");
const ours = readFileSync(mine, "utf8");

let bad = 0;
for (const selector of [":root", ".dark", "@theme inline"]) {
  const a = block(theirs, selector);
  const b = block(ours, selector);
  if (a === null) {
    console.error(`  missing ${selector} in cubeui`);
    bad++;
  } else if (a !== b) {
    console.error(`  DIFFERS ${selector}`);
    bad++;
  } else {
    console.log(`  ok      ${selector} identical to cubeui`);
  }
}

if (bad) {
  console.error(
    `\n${bad} block(s) diverged from cubeui.\n` +
      "Either tokens/palette.mjs changed and cubeui has not caught up, or cubeui\n" +
      "was edited directly. Decide which is the intended source and reconcile.",
  );
  process.exit(1);
}
