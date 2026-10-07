import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { defaultUrlTransform } from "react-markdown";
import { expect, within } from "storybook/test";
import { Markdown, type MarkdownProps } from "@/components/markdown";

const meta = {
  title: "Controls/Markdown",
  component: Markdown,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const root = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>("[data-slot=markdown]");

/** One of everything the map draws, with its headings in order so axe has a real outline to read. */
const EVERYTHING = `# Release notes

A paragraph with **strong text**, *emphasis*, ~~a struck line~~, a \`code span\`
and [a link to the docs](https://example.com/docs). A bare address is a link
too: https://example.com/changelog

## Install

1. Add the registry
2. Install the item

- A bullet
- Another
  - Nested under it

> A quotation, which is quieter than the text around it.

\`\`\`sh
npm install
  npm run build
\`\`\`

### What changed

| Package | Status | Size |
| :------ | :----: | ---: |
| core    | Stable |  12k |
| forms   | Beta   |   8k |

---

#### Still to do

- [x] Write the renderer
- [ ] Port the apps

##### A fifth level

###### A sixth level
`;

/**
 * Every element, each drawn by the primitive the rest of an app already uses: the fenced block is
 * a `CodeBlock`, the table is the `Table`, the rule a `Separator`, the task boxes `Checkbox`es.
 */
export const EveryElement: Story = {
  args: { content: EVERYTHING },
  decorators: [(Story) => <div className="w-[640px]">{Story()}</div>],
  play: async ({ canvas, canvasElement }) => {
    // The outline: six levels, in order, each a real heading.
    const names = [
      "Release notes",
      "Install",
      "What changed",
      "Still to do",
      "A fifth level",
      "A sixth level",
    ];
    for (const [index, name] of names.entries()) {
      await expect(canvas.getByRole("heading", { name, level: index + 1 })).toBeVisible();
    }
    // No heading has an id unless the caller asks for them.
    await expect(canvas.getByRole("heading", { name: "Install" })).not.toHaveAttribute("id");

    // Links have their text as their name, and look like links without relying on colour.
    const link = canvas.getByRole("link", { name: "a link to the docs" });
    await expect(link).toHaveAttribute("href", "https://example.com/docs");
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await expect(canvas.getByRole("link", { name: "https://example.com/changelog" })).toBeVisible();

    // Inline text keeps the browser's own elements.
    await expect(canvasElement.querySelector("strong")).toHaveTextContent("strong text");
    await expect(canvasElement.querySelector("em")).toHaveTextContent("emphasis");
    await expect(canvasElement.querySelector("del")).toHaveTextContent("a struck line");

    // Three lists that say what they are: ordered, bulleted, and nested.
    const lists = canvas.getAllByRole("list");
    await expect(lists.filter((list) => list.tagName === "OL")).toHaveLength(1);
    await expect(getComputedStyle(canvasElement.querySelector("ol") as Element).listStyleType).toBe(
      "decimal",
    );
    await expect(canvasElement.querySelector("ul ul")).toHaveTextContent("Nested under it");

    await expect(canvasElement.querySelector("blockquote")).toHaveTextContent(
      "A quotation, which is quieter than the text around it.",
    );

    // The fenced block is a `CodeBlock`, with its indentation kept and the fence's newline gone;
    // the code span is not one.
    const blocks = canvasElement.querySelectorAll("[data-slot=code-block]");
    await expect(blocks).toHaveLength(1);
    await expect(blocks[0]?.querySelector("pre")?.textContent).toBe("npm install\n  npm run build");
    await expect(canvas.getByText("code span").closest("[data-slot=code-block]")).toBeNull();

    // The table is the registry's, so its headers are scoped, and the alignment Markdown wrote is kept.
    const table = canvas.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    await expect(headers.map((header) => header.textContent)).toEqual([
      "Package",
      "Status",
      "Size",
    ]);
    for (const header of headers) {
      await expect(header).toHaveAttribute("scope", "col");
    }
    await expect(getComputedStyle(headers[2] as Element).textAlign).toBe("right");
    await expect(
      getComputedStyle(within(table).getByRole("cell", { name: "Stable" })).textAlign,
    ).toBe("center");
    await expect(table.closest("[data-slot=table-container]")).not.toBeNull();

    await expect(canvas.getByRole("separator")).toBeVisible();

    // Task items: read, not filled in, and each box named by the item it is in.
    const done = canvas.getByRole("checkbox", { name: "Write the renderer" });
    const todo = canvas.getByRole("checkbox", { name: "Port the apps" });
    await expect(done).toBeChecked();
    await expect(todo).not.toBeChecked();
    await expect(done).toBeDisabled();
    await expect(todo).toBeDisabled();
    // The boxes are the markers, so the list draws none of its own and keeps no indent for them.
    // The quotation is flush too: neither leans on the page's stylesheet to have zeroed a margin.
    const edge = root(canvasElement)?.getBoundingClientRect().left;
    await expect(done.getBoundingClientRect().left).toBe(edge);
    await expect(canvasElement.querySelector("blockquote")?.getBoundingClientRect().left).toBe(
      edge,
    );
    await expect(getComputedStyle(done.closest("ul") as Element).listStyleType).toBe("none");
  },
};

/**
 * Content from somewhere else: a file in a repository, text a model wrote.
 *
 * Raw HTML is shown as the text it is and never becomes an element, and a URL that is not a web,
 * mail or relative address is blanked. Neither is a prop the caller has to remember to set.
 */
export const UntrustedContent: Story = {
  args: {
    content: `Some HTML: <script>window.__markdown_ran = true</script> and
<img src="x" onerror="window.__markdown_ran = true"> in a paragraph.

<div onclick="window.__markdown_ran = true">A block of HTML</div>

[A script link](javascript:window.__markdown_ran=true) and
![a script image](javascript:window.__markdown_ran=true), beside
[a safe one](/docs/setup) and [a mail one](mailto:someone@example.com).
`,
  },
  decorators: [(Story) => <div className="w-[640px]">{Story()}</div>],
  play: async ({ canvas, canvasElement }) => {
    const document = root(canvasElement);
    await expect(document).not.toBeNull();
    if (!document) {
      return;
    }

    // Nothing the HTML asked for exists, and nothing ran.
    await expect(document.querySelector("script")).toBeNull();
    await expect(document.querySelector("[onerror]")).toBeNull();
    await expect(document.querySelector("[onclick]")).toBeNull();
    await expect((window as { __markdown_ran?: boolean }).__markdown_ran).toBeUndefined();
    // It is on the page as text instead.
    await expect(document).toHaveTextContent("<script>window.__markdown_ran = true</script>");
    await expect(document).toHaveTextContent('<div onclick="window.__markdown_ran = true">');

    // The script URLs are gone; the image is the one Markdown image, not the HTML one.
    await expect(canvas.getByText("A script link")).toHaveAttribute("href", "");
    const images = document.querySelectorAll("img");
    await expect(images).toHaveLength(1);
    // Blanked, which React writes as no `src` at all.
    await expect(images[0]?.getAttribute("src") ?? "").toBe("");
    // A relative address and a mail address are left alone.
    await expect(canvas.getByRole("link", { name: "a safe one" })).toHaveAttribute(
      "href",
      "/docs/setup",
    );
    await expect(canvas.getByRole("link", { name: "a mail one" })).toHaveAttribute(
      "href",
      "mailto:someone@example.com",
    );
  },
};

/**
 * A blank document draws `emptySlot`, and with no `emptySlot` draws nothing at all — not an empty
 * box.
 */
export const Empty: Story = {
  args: { content: "" },
  render: () => (
    <div className="flex w-[480px] flex-col gap-4">
      <div data-testid="with">
        <Markdown
          content={"  \n"}
          emptySlot={<p className="text-foreground/60">This file is empty.</p>}
        />
      </div>
      <div data-testid="without">
        <Markdown content="" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("with")).toHaveTextContent("This file is empty.");
    await expect(canvas.getByTestId("without")).toBeEmptyDOMElement();
  },
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * `headingId` gives each heading an id from its text — all of its text, a code span included — so
 * a table of contents beside the document can link to one.
 */
export const HeadingIds: Story = {
  args: {
    content: "# Getting started\n\nFirst.\n\n## The `content` prop\n\nSecond.\n",
    headingId: slug,
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Getting started" })).toHaveAttribute(
      "id",
      "getting-started",
    );
    await expect(canvas.getByRole("heading", { name: "The content prop" })).toHaveAttribute(
      "id",
      "the-content-prop",
    );
  },
};

/** A stand-in for an app's router link: its own element, and something only the app knows. */
function AppLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  const external = href?.startsWith("http");
  return (
    <a href={href} data-app-link {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children}
    </a>
  );
}

// A one-pixel GIF. Base64, because a Markdown URL ends at the first space.
const DOT = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * What an app lays over the map: its own link, and a URL policy that lets one more scheme through.
 *
 * The replaced link still looks like the document's links, because that look is worn from the
 * root — the app's component carries no class. The image is a `data:` URL, which the default
 * policy blanks; the transform here admits images only and hands the rest back to the default.
 */
export const CallerOverrides: Story = {
  args: {
    content: `Read [the guide](https://example.com/guide) or [the next page](/next).\n\n![A grey square](${DOT})\n\n[Not an image](data:text/html,hello)\n`,
    components: { a: AppLink },
    urlTransform: (url) => (url.startsWith("data:image/") ? url : defaultUrlTransform(url)),
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas }) => {
    const external = canvas.getByRole("link", { name: "the guide" });
    await expect(external).toHaveAttribute("data-app-link");
    await expect(external).toHaveAttribute("target", "_blank");
    await expect(getComputedStyle(external).textDecorationLine).toBe("underline");
    await expect(canvas.getByRole("link", { name: "the next page" })).not.toHaveAttribute("target");

    const image = canvas.getByRole("img", { name: "A grey square" });
    await expect(image).toHaveAttribute("src", DOT);
    // Everything the transform did not name still goes through the default.
    await expect(canvas.getByText("Not an image")).toHaveAttribute("href", "");
  },
};

/** The documents the stories below link between, by path. */
const DOCUMENTS = ["guide/intro.md", "guide/install.md", "api.md"];

/** A stand-in for the app's router link, which only the app can draw. */
const routerLink = (path: string) => (label: ReactNode) => (
  <a href={`/docs/${path}`} data-router-link>
    {label}
  </a>
);

/** A stand-in for the app's resolver: a name is a file's name without its extension. */
const resolveDocument: NonNullable<MarkdownProps["resolveLink"]> = (target, { kind }) => {
  if (kind === "image" || kind === "embed") {
    return target.endsWith("dot.gif") ? { href: DOT } : { broken: true, reason: "No such file." };
  }
  const [name = ""] = target.split("#");
  const path = DOCUMENTS.find((doc) => doc === name || doc.endsWith(`/${name}.md`));
  return path
    ? { render: routerLink(path) }
    : { broken: true, reason: `No document named “${name}”.` };
};

const LINKED = `Start with [[intro]], then [[install|install it]] and read [[intro#Setup]].
The [API reference](../api.md) is one directory up, and [the site](https://example.com) is not ours.

![A grey square](dot.gif) and ![[dot.gif]]
`;

/**
 * Links between an app's documents, resolved. `wikilinks` reads the bracket forms, `basePath`
 * turns `../api.md` into the path it names, and `resolveLink` — the app's — answers each with its
 * router link. A web address never reaches the resolver.
 */
export const ResolvedLinks: Story = {
  args: {
    content: LINKED,
    wikilinks: true,
    basePath: "guide/intro.md",
    resolveLink: resolveDocument,
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas }) => {
    const named = canvas.getByRole("link", { name: "intro" });
    await expect(named).toHaveAttribute("href", "/docs/guide/intro.md");
    await expect(named).toHaveAttribute("data-router-link");
    // The router's link carries no class and still looks like the document's.
    await expect(getComputedStyle(named).textDecorationLine).toBe("underline");
    await expect(canvas.getByRole("link", { name: "install it" })).toHaveAttribute(
      "href",
      "/docs/guide/install.md",
    );
    await expect(canvas.getByRole("link", { name: "intro › Setup" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "API reference" })).toHaveAttribute(
      "href",
      "/docs/api.md",
    );
    await expect(canvas.getByRole("link", { name: "the site" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    for (const image of canvas.getAllByRole("img")) {
      await expect(image).toHaveAttribute("src", DOT);
    }
    await expect(canvas.getAllByRole("img")).toHaveLength(2);
  },
};

/**
 * Still being looked up: the link's text without its link, and a chip where the image will be.
 * Here the resolver answers `{ pending: true }`, as one reading a query that has not loaded does.
 */
export const PendingLinks: Story = {
  args: {
    content: LINKED,
    wikilinks: true,
    basePath: "guide/intro.md",
    resolveLink: () => ({ pending: true }),
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas, canvasElement }) => {
    // Only the web address is a link yet.
    await expect(canvas.getAllByRole("link")).toHaveLength(1);
    await expect(canvas.getByText("install it")).toHaveAttribute("aria-busy", "true");
    await expect(canvasElement.querySelectorAll("[data-slot=markdown-pending-image]")).toHaveLength(
      2,
    );
  },
};

/** An async resolver: every link is pending until its promise settles, then drawn as answered. */
const resolveLater: NonNullable<MarkdownProps["resolveLink"]> = async (target, context) => {
  await new Promise((done) => setTimeout(done, 50));
  return resolveDocument(target, context);
};

export const ResolvesLater: Story = {
  args: {
    content: "Read [[intro]] and [[nowhere]].\n",
    wikilinks: true,
    resolveLink: resolveLater,
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas }) => {
    await expect(canvas.getByText("intro")).toHaveAttribute("aria-busy", "true");
    await expect(await canvas.findByRole("link", { name: "intro" })).toHaveAttribute(
      "href",
      "/docs/guide/intro.md",
    );
    await expect(await canvas.findByTitle("No document named “nowhere”.")).toBeVisible();
  },
};

/**
 * Pointing at nothing. A broken link keeps a dashed underline and says why on hover; a screen
 * reader hears "(broken link)". A relative link that climbs out of the root is broken before the
 * resolver is asked, and a wikilink with no resolver at all is broken too.
 */
export const BrokenLinks: Story = {
  args: {
    content:
      "See [[missing]] and [the plan](../../plan.md), or [a typo](instal.md).\n\n![The diagram](diagram.png) and ![[chart.png]]\n",
    wikilinks: true,
    basePath: "guide/intro.md",
    resolveLink: resolveDocument,
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
    const missing = canvas.getByTitle("No document named “missing”.");
    await expect(missing).toHaveTextContent("missing (broken link)");
    await expect(getComputedStyle(missing).textDecorationStyle).toBe("dashed");
    await expect(canvas.getByTitle("This points outside the documents.")).toHaveTextContent(
      "the plan",
    );
    await expect(canvas.getByText("Missing image: The diagram")).toBeVisible();
    await expect(canvasElement.querySelectorAll("[data-slot=markdown-missing-image]")).toHaveLength(
      2,
    );
  },
};

/**
 * A document in a column too narrow for it. The long address breaks, the table and the code block
 * scroll inside themselves, and the document stays the width it was given.
 */
export const StaysInsideItsColumn: Story = {
  args: {
    content: `See https://example.com/a/very/long/path/that/does/not/have/a/single/place/to/break/in/it/anywhere.

| Name | Transport | Tools | Status | Last connected |
| ---- | --------- | ----- | ------ | -------------- |
| filesystem | stdio | 11 | Connected | 2026-09-30T12:00:00Z |

\`\`\`
const one = "a line of code that is a good deal longer than the column it has been put in";
\`\`\`
`,
  },
  decorators: [(Story) => <div className="w-[280px]">{Story()}</div>],
  play: async ({ canvasElement }) => {
    const document = root(canvasElement);
    await expect(document).not.toBeNull();
    if (!document) {
      return;
    }
    await expect(document.getBoundingClientRect().width).toBeCloseTo(280, 0);
    await expect(document.scrollWidth).toBeLessThanOrEqual(document.clientWidth);

    // The two wide things scroll, and a keyboard can reach both to do it.
    const block = document.querySelector<HTMLElement>("[data-slot=code-block-content]");
    await expect(block?.scrollWidth).toBeGreaterThan(block?.clientWidth ?? 0);
    await expect(block).toHaveAttribute("tabindex", "0");
  },
};
