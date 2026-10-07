import type { ReactNode } from "react";

/**
 * The frame the two gallery stories render in: every registry item on one page, a heading per
 * item, so someone choosing what to build on can scroll the whole registry instead of opening
 * eighty stories one at a time.
 *
 * Plain DOM on purpose, for the reason `SideBySide` is: a React Native wrapper would put
 * react-native-web's stylesheet around the compiled half, and the web gallery exists to show the
 * compiled output without it.
 */

/** One heading on the page, and the registry items drawn under it. */
export type GallerySection = {
  title: string;
  /** The registry item names this section shows, as `registry.json` spells them. */
  items: readonly string[];
  /** One line under the heading, for what is not obvious from looking. */
  description?: string;
  content: ReactNode;
};

/** The part of a `registry.json` item the coverage check reads. */
export type RegistryItem = { name: string; type: string };

const anchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * The item names a gallery neither shows nor accounts for.
 *
 * A gallery that is hand-kept is wrong the first time an item is added, silently, so each gallery
 * story asserts this is empty: an item is under a section, or it is in `notShown` with the reason
 * it cannot be drawn (a palette, a `cn` helper). A name left in `notShown` after it gained a
 * section is reported too, prefixed, so the list only holds what is true.
 */
export function unaccountedItems(
  registry: readonly RegistryItem[],
  sections: readonly GallerySection[],
  notShown: Readonly<Record<string, string>>,
): string[] {
  const shown = new Set(sections.flatMap((section) => section.items));
  const names = new Set(registry.map((item) => item.name));
  return [
    ...registry
      .filter((item) => shown.has(item.name) === false && item.name in notShown === false)
      .map((item) => item.name),
    ...Object.keys(notShown)
      .filter((name) => shown.has(name) || names.has(name) === false)
      .map((name) => `stale notShown: ${name}`),
    ...[...shown]
      .filter((name) => names.has(name) === false)
      .map((name) => `not in the registry: ${name}`),
  ];
}

export function Gallery({
  title,
  description,
  sections,
  layout,
}: {
  title: string;
  description: string;
  sections: readonly GallerySection[];
  /**
   * `page` stacks full-width sections under a page-width cap, the way a DOM app lays a screen
   * out. `phone` fills the viewport edge to edge and leaves the width to it: the story sets a
   * phone's viewport, because a breakpoint class reads the window and a narrow column in a wide
   * one would draw every shell at its desktop arrangement.
   */
  layout: "page" | "phone";
}) {
  return (
    <div
      className={
        layout === "phone"
          ? "min-h-screen bg-background p-4 text-foreground"
          : "min-h-screen bg-background p-6 text-foreground"
      }
    >
      <header className="mx-auto flex max-w-6xl flex-col gap-2 pb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-3 gap-y-1 pt-2 text-sm">
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#${anchor(section.title)}`}
              className="text-foreground underline underline-offset-2"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>
      <div
        className={
          layout === "phone" ? "flex flex-col gap-10" : "mx-auto flex max-w-6xl flex-col gap-10"
        }
      >
        {sections.map((section) => {
          const id = anchor(section.title);
          return (
            <section
              key={section.title}
              id={id}
              aria-labelledby={`${id}-heading`}
              data-gallery-items={section.items.join(" ")}
              className="flex min-w-0 flex-col gap-3"
            >
              <div className="flex flex-col gap-1 border-b border-border pb-2">
                <h2 id={`${id}-heading`} className="text-lg font-semibold">
                  {section.title}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {section.items.map((item) => `@cubeui/${item}`).join(" · ")}
                </p>
                {section.description ? (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                ) : null}
              </div>
              {section.content}
            </section>
          );
        })}
      </div>
    </div>
  );
}
