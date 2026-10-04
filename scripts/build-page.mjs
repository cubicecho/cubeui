/**
 * `public/index.html`, the one page at this host a person is meant to read.
 *
 * `https://cubicecho.github.io/cubeui/` is both the registry's host and its human URL — the only
 * repo in the org where those are the same string. Pages serves `public/`, and `public/` was
 * `r/` and nothing else, so arriving at the bare URL from cubicecho.com or from the end of a
 * `components.json` line got a 404. Someone who has the registry URL already has the one fact
 * this page exists to supply and no way to read it.
 *
 * **Generated, not written.** The list of items is the thing a person comes here for, and a
 * hand-written copy of it is wrong the first time an item is added — silently, because nothing
 * checks prose. So it is built from the two `registry.json` files that are already the source of
 * truth, and `--check` fails the build if the committed page has drifted from them, the same
 * guard `dist/` and `compiled/` are held to.
 *
 * Deliberately one file with no build step of its own: no Tailwind, no framework, no fonts off a
 * CDN. It is a page about a component registry, not a demonstration of one, and the palette is
 * cubesite's `brand/tokens.css` values inlined so a tab open on this looks like the rest of the
 * org without this repo taking a dependency on that one.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

const OUT = new URL("public/index.html", root);
const HOST = "https://cubicecho.github.io/cubeui";

/**
 * The two gallery stories, opened on their own rather than inside Storybook's sidebar and
 * toolbar: `iframe.html` is the canvas Storybook itself embeds, and it is a page.
 *
 * The ids are the story titles in `stories/web/gallery.stories.tsx` and
 * `stories/gallery/mobile.stories.tsx`, kebab-cased by Storybook. Both workflows check the built
 * `index.json` holds them, so a rename there fails the build rather than leaving these links dead.
 */
const canvas = (id) => `storybook/iframe.html?id=${id}&amp;viewMode=story`;
const GALLERY_WEB = `${HOST}/${canvas("gallery-web--everything")}`;

/**
 * The mobile gallery gets a page of its own, `public/mobile/index.html`, holding the canvas in a
 * frame the size of a phone. Linking to the canvas directly would open it at the width of the
 * reader's window, and a breakpoint class reads the window: every shell would draw its desktop
 * arrangement, which is the one thing a page called "mobile" must not show. Inside Storybook the
 * story sets the same viewport itself.
 */
const MOBILE_OUT = new URL("public/mobile/index.html", root);
const GALLERY_MOBILE = `${HOST}/mobile/`;

const web = read("registry.web.json");
const native = read("registry.json");

/**
 * The three item classes, decided by which registries hold the name.
 *
 * This is the fact the published JSON could not carry until recently and still carries only as a
 * sentence in a description — an item is universal, native-only or web-only, and for a team
 * choosing what to build on that is the deciding one. Here it is a column, because a table is
 * where someone is actually looking when the question comes up.
 */
/**
 * A `-stories` item is a component's companion rather than an item of its own, so it is kept out
 * of the table and listed once, under Storybook.
 */
const isStoryItem = (item) => item.name.endsWith("-stories");

/** The component names that ship a `-stories` item, for the Storybook section. */
function storyItems() {
  return web.items
    .filter(isStoryItem)
    .map((i) => i.name.slice(0, -"-stories".length))
    .sort();
}

function classify() {
  const webNames = new Set(web.items.filter((i) => !isStoryItem(i)).map((i) => i.name));
  const nativeNames = new Set(native.items.map((i) => i.name));
  const rows = [];
  for (const name of [...new Set([...webNames, ...nativeNames])].sort()) {
    const item =
      web.items.find((i) => i.name === name) ?? native.items.find((i) => i.name === name);
    const both = webNames.has(name) && nativeNames.has(name);
    rows.push({
      name,
      title: item.title ?? name,
      // The web half's description carries "Web-only: no React Native half."; on this page the
      // column says that, so the sentence would be said twice.
      description: (item.description ?? "").replace(/\s*Web-only: no React Native half\.$/, ""),
      platforms: both ? "both" : webNames.has(name) ? "web" : "native",
    });
  }
  return rows;
}

const html = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PLATFORM = {
  both: { label: "both", title: "React Native and the DOM" },
  web: { label: "web", title: "No React Native half — DOM only" },
  native: { label: "native", title: "No web half — React Native only" },
};

function rowsHtml(rows) {
  return rows
    .map((row) => {
      const platform = PLATFORM[row.platforms];
      return `        <tr>
          <th scope="row"><code>@cubeui/${html(row.name)}</code></th>
          <td><span class="tag tag-${row.platforms}" title="${html(platform.title)}">${platform.label}</span></td>
          <td>${html(row.description)}</td>
        </tr>`;
    })
    .join("\n");
}

function page() {
  const rows = classify();
  const counts = {
    all: rows.length,
    both: rows.filter((r) => r.platforms === "both").length,
    web: rows.filter((r) => r.platforms === "web").length,
    native: rows.filter((r) => r.platforms === "native").length,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cubeui — components for React Native and the DOM</title>
<meta name="description" content="A shadcn registry of ${counts.all} items, authored in React Native and compiled to plain DOM components. One token source, one component vocabulary, two platforms.">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>
  /* cubesite's brand/tokens.css, inlined. Values, not an import: this page is served from a
     different host than cubicecho.com and should not fetch a stylesheet to render. */
  :root {
    --bg: #fafaf9; --fg: #1a1a1a; --muted: #6b6b6b; --line: #e5e5e3;
    --card: #ffffff; --accent: #2563eb; --accent-fg: #ffffff; --radius: 10px;
    --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-mono: ui-monospace, "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111113; --fg: #ececec; --muted: #9a9a9a; --line: #26262a;
      --card: #1a1a1d; --accent: #7aa6ff; --accent-fg: #0c0c0e;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: var(--font-sans); line-height: 1.6;
  }
  .page { max-width: 62rem; margin: 0 auto; padding: 3rem 1.25rem 5rem; }
  header { display: flex; align-items: center; gap: 0.75rem; }
  header svg { width: 2.5rem; height: 2.5rem; flex: none; }
  h1 { font-family: var(--font-mono); font-size: 2rem; margin: 0; letter-spacing: -0.01em; }
  .tagline { color: var(--muted); margin: 0.5rem 0 0; font-size: 1.05rem; }
  h2 { font-size: 1.25rem; margin: 3rem 0 0.75rem; }
  p { margin: 0.75rem 0; }
  a { color: var(--accent); }
  code {
    font-family: var(--font-mono); font-size: 0.9em;
    background: var(--card); border: 1px solid var(--line); border-radius: 4px; padding: 0.1em 0.35em;
  }
  pre {
    background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
    padding: 1rem; overflow-x: auto; font-size: 0.875rem;
  }
  pre code { background: none; border: 0; padding: 0; font-size: inherit; }
  .note {
    border-left: 3px solid var(--accent); padding: 0.1rem 0 0.1rem 1rem;
    margin: 1.25rem 0; color: var(--muted);
  }
  .note strong { color: var(--fg); }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.55rem 0.75rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  thead th { color: var(--muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody th { font-weight: 400; white-space: nowrap; }
  .tag {
    display: inline-block; font-family: var(--font-mono); font-size: 0.75rem;
    border: 1px solid var(--line); border-radius: 999px; padding: 0.05rem 0.5rem; color: var(--muted);
  }
  .tag-both { border-color: var(--accent); color: var(--accent); }
  .galleries {
    list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
  .galleries li { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; }
  .galleries a { display: block; font-weight: 600; }
  .galleries span { color: var(--muted); font-size: 0.9rem; }
  .counts { color: var(--muted); font-size: 0.9rem; }
  footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.9rem; }
  @media (max-width: 40rem) {
    td:last-child, th:last-child { display: none; }
  }
</style>
</head>
<body>
<div class="page">

<header>
  <!-- cubesite's mark: strokes only, currentColor, so it follows the text in either theme. -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
    <path d="M40 12 L50 17 L40 22 L30 17 Z M30 17 L30 27 L40 32 L50 27 L50 17 M40 22 L40 32" />
    <ellipse cx="40" cy="50" rx="5" ry="1.4" />
    <ellipse cx="40" cy="50" rx="14" ry="3.5" opacity="0.55" />
    <ellipse cx="40" cy="50" rx="24" ry="5.5" opacity="0.28" />
  </svg>
  <h1>cubeui</h1>
</header>

<p class="tagline">
  A shadcn registry of ${counts.all} items, authored in React Native and compiled to plain DOM
  components. One palette, one component vocabulary, two platforms — and no react-native-web in
  the web half.
</p>

<h2>See it</h2>

<p>
  Every item, drawn on one page per platform: scroll it instead of opening a story at a time.
</p>

<ul class="galleries">
  <li>
    <a href="${GALLERY_WEB}">Everything on the web</a>
    <span>the compiled DOM components and the web-only tier, at page width</span>
  </li>
  <li>
    <a href="${GALLERY_MOBILE}">Everything on mobile</a>
    <span>the React Native sources, in a frame the width of a phone, drawn by react-native-web</span>
  </li>
</ul>

<p>
  Both are stories in <a href="${HOST}/storybook/">the Storybook</a>, under <code>Gallery</code>,
  where each item also has stories of its own with its props and its tests.
</p>

<h2>Install</h2>

<p>
  Add one line to your <code>components.json</code>. The item names are the same on both sides —
  <code>card</code> is <code>card</code> — and the URL is what decides which half you get.
</p>

<pre><code>// a DOM app
"registries": { "@cubeui": "${HOST}/r/{name}.json" }

// an Expo app
"registries": { "@cubeui": "${HOST}/r/native/{name}.json" }</code></pre>

<pre><code>npx shadcn@latest add @cubeui/tokens @cubeui/button</code></pre>

<p>
  <code>@cubeui/tokens</code> is the one every consumer installs: it is the palette, emitted from
  a single source as <code>oklch()</code> for the DOM and as hex for React Native, whose style
  engine cannot parse <code>oklch()</code> at runtime.
</p>

<div class="note">
  <strong>On a Vite app, put <code>compilerOptions.paths</code> in the root
  <code>tsconfig.json</code> too.</strong> <code>npm create vite</code> writes them into
  <code>tsconfig.app.json</code>; the shadcn CLI reads only the root file, finds no
  <code>@/</code> alias, and resolves it as a relative path — so the install writes a literal
  <code>@/</code> directory at your project root and reports success.
</div>

<div class="note">
  <strong>Upgrading from the web-only cubeui?</strong> <code>@cubeui/form</code> is now the
  <code>Form</code> component, installed at <code>components/ui/form.tsx</code>; the old bundle of
  form items is <code>@cubeui/form-set</code>. The primitives now install over shadcn's own. The
  <a href="https://github.com/cubicecho/cubeui#upgrading-from-the-pre-native-cubeui">migration
  notes</a> list every change.
</div>

<h2>Items</h2>

<p class="counts">
  ${counts.both} on both platforms · ${counts.web} web-only · ${counts.native} native-only.
  Anything not marked <span class="tag tag-both">both</span> has no half on the other platform.
</p>

<table>
  <thead>
    <tr><th scope="col">Item</th><th scope="col">Platforms</th><th scope="col">What it is</th></tr>
  </thead>
  <tbody>
${rowsHtml(rows)}
  </tbody>
</table>

<h2>Storybook</h2>

<p>
  Every item with a story is at <a href="${HOST}/storybook/">${HOST.replace(/^https:\/\//, "")}/storybook/</a>,
  rendered in a real browser — the same stories the test run drives, with the a11y addon set to
  fail rather than warn.
</p>

<p>
  A consuming app can put them in its own sidebar with one entry, so someone reading
  <code>Domain/UploadPanel</code> can click through to the <code>Button</code> it is built from:
</p>

<pre><code>// .storybook/main.ts
refs: { cubeui: { title: "cubeui", url: "${HOST}/storybook" } }</code></pre>

<div class="note">
  <strong>Composed stories render here, under these tokens.</strong> That makes them
  documentation, not a test of your theme — the question "does <code>Button</code> still pass
  contrast after our <code>index.css</code> override" is only answered by a story compiled in
  your app — which is what the <code>-stories</code> items are.
</div>

<p>
  Installing <code>@cubeui/&lt;name&gt;-stories</code> puts that component's stories beside it in
  your tree, importing it as <code>@/components/ui/&lt;name&gt;</code>, so they render under your
  stylesheet and run as tests under your addon-vitest. They need Storybook 9 or later on
  <code>@storybook/react-vite</code> and declare no npm dependencies. Available for:
  ${storyItems()
    .map((name) => `<code>${html(name)}</code>`)
    .join(", ")}.
</p>

<pre><code>npx shadcn add @cubeui/button-stories</code></pre>

<footer>
  <a href="https://github.com/cubicecho/cubeui">github.com/cubicecho/cubeui</a> ·
  <a href="${HOST}/storybook/">the Storybook</a> ·
  <a href="${GALLERY_WEB}">everything on the web</a> ·
  <a href="${GALLERY_MOBILE}">everything on mobile</a> ·
  <a href="${HOST}/r/registry.json">the DOM registry index</a> ·
  <a href="${HOST}/r/native/registry.json">the Expo one</a> ·
  part of <a href="https://cubicecho.com">cubicecho</a>
</footer>

</div>
</body>
</html>
`;
}

/** `public/mobile/index.html`: the mobile gallery's canvas, in a frame the size of a phone. */
function mobilePage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cubeui — everything on mobile</title>
<meta name="description" content="Every React Native item in the cubeui registry, on one page at the width of a phone.">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<style>
  /* The same palette as the landing page, for the same reason: values, not an import. */
  :root {
    --bg: #fafaf9; --fg: #1a1a1a; --muted: #6b6b6b; --line: #e5e5e3; --accent: #2563eb;
    --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #111113; --fg: #ececec; --muted: #9a9a9a; --line: #26262a; --accent: #7aa6ff; }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font-sans);
    line-height: 1.5; display: flex; flex-direction: column; align-items: center;
  }
  header { width: 100%; max-width: 414px; padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--muted); }
  h1 { font-size: 1rem; margin: 0; color: var(--fg); }
  p { margin: 0.25rem 0 0; }
  a { color: var(--accent); }
  /* 414 wide is the phone viewport the story sets for itself inside Storybook. On a real phone
     the frame is simply the screen. */
  iframe {
    flex: 1; width: 100%; max-width: 414px; min-height: 0; background: #fff;
    border: 1px solid var(--line); border-bottom: 0; border-radius: 1.25rem 1.25rem 0 0;
  }
  @media (max-width: 414px) { iframe { border: 0; border-top: 1px solid var(--line); border-radius: 0; } }
</style>
</head>
<body>
<header>
  <h1>cubeui — everything on mobile</h1>
  <p>
    The React Native sources, drawn by react-native-web at a phone's width.
    <a href="../">Back to cubeui</a> ·
    <a href="../${canvas("gallery-web--everything")}">everything on the web</a> ·
    <a href="../storybook/?path=/story/gallery-mobile--everything">in the Storybook</a>
  </p>
</header>
<iframe title="The mobile gallery" src="../${canvas("gallery-mobile--everything")}"></iframe>
</body>
</html>
`;
}

const outputs = [
  { url: OUT, name: "public/index.html", content: page() },
  { url: MOBILE_OUT, name: "public/mobile/index.html", content: mobilePage() },
];
const checking = process.argv.includes("--check");

if (checking) {
  for (const { url, name, content } of outputs) {
    const committed = existsSync(url) ? readFileSync(url, "utf8") : "";
    if (committed !== content) {
      console.error(
        `${fileURLToPath(url)} is not what the registries generate.\n` +
          "An item was added, renamed or re-described without rebuilding the page.\n" +
          "Run `npm run page:build`.",
      );
      process.exit(1);
    }
    console.log(`${name} matches what this script generates.`);
  }
} else {
  for (const { url, content } of outputs) {
    mkdirSync(new URL(".", url), { recursive: true });
    writeFileSync(url, content);
  }
  console.log(`public/index.html: ${classify().length} items listed. public/mobile/index.html.`);
}
