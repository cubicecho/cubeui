import type { ReactElement, ReactNode } from "react";
import * as React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { ChevronRight, File, Folder } from "@/components/ui/icons";
import { buildTree, type TreeEntry, type TreeNode } from "@/lib/tree";
import { cn, type SlotNode } from "@/lib/utils";

type FileTreeProps<T extends TreeEntry> = {
  /** What the list is, for a screen reader: "Files", "Notes". Read, not drawn. */
  label: string;
  /**
   * The files, and any folders worth listing, flat and in any order. A file's missing parents are
   * added and every level is sorted folders first, then by name — `buildTree` in `@/lib/tree`.
   */
  entries: readonly T[];
  /**
   * Files drawn above the tree, in the order given, never nested or sorted: a folder's README, a
   * skill's own Markdown. Each is called by its whole `path`, and reaches `linkSlot`, `meta` and
   * `actionSlot` as any other file does.
   */
  pinned?: readonly T[] | undefined;
  /** The open file's path. Its row is filled, and its link or button says it is the current one. */
  selected?: string | undefined;
  /**
   * The router's link to a file, as an element with no children — `<Link to="/notes/$" />` — which
   * the row is drawn inside. For an app that keeps the open file in the URL, so the row is a real
   * `<a href>` that a middle click opens. Given this, `onSelect` is not called.
   */
  linkSlot?: ((node: TreeNode<T>) => ReactElement) | undefined;
  /** A file's row was pressed. For an app that holds the open file in state; the row is a button. */
  onSelect?: ((path: string) => void) | undefined;
  /**
   * The small facts after a row's name: a size, a count, a badge. A string is drawn muted and extra
   * small; an element is placed as it is. Inside the pressed area. Called for folders too.
   */
  meta?: ((node: TreeNode<T>) => ReactNode) | undefined;
  /**
   * A row's far end, **outside** the pressed area: rename and delete buttons, or one `Menu`. Where
   * there is a pointer they are drawn on hover and on focus; on a touch screen, always.
   */
  actionSlot?: ((node: TreeNode<T>) => SlotNode) | undefined;
  /**
   * The paths of the open folders, when the caller holds them — to keep them across a reload, or
   * to open the way to a file. Leave it out and the tree holds its own.
   */
  open?: readonly string[] | undefined;
  /** Told the open folders on every toggle, controlled or not. */
  onOpenChange?: ((open: string[]) => void) | undefined;
  /** Which folders an uncontrolled tree starts with open: their paths, or every one. */
  defaultOpen?: readonly string[] | "all" | undefined;
  className?: string | undefined;
};

/** The pressed part of a row: the indent, the icon, the name and the meta. */
const ROW_CLASS = cn(
  "min-h-8 min-w-0 flex-1 flex-row items-center gap-2 rounded-md py-1.5 pr-2",
  Platform.select({
    web: "text-left focus-visible:outline-none",
    default: "active:opacity-70",
  }),
);

/** How far one level sits inside the one above it: the chevron's own width. */
const INDENT = 16;

const NO_PATHS: ReadonlySet<string> = new Set();

/** A string on its own is a crash on device, so a string `meta` gets a `Text` around it. */
function asText(node: ReactNode, className: string) {
  return typeof node === "string" || typeof node === "number" ? (
    <Text className={className}>{node}</Text>
  ) : (
    node
  );
}

function folderPaths<T extends TreeEntry>(nodes: readonly TreeNode<T>[]): string[] {
  return nodes.flatMap((node) =>
    node.type === "dir" ? [node.path, ...folderPaths(node.children)] : [],
  );
}

/**
 * A nested list of files and folders, as they sit on disk: folders first, each one a button that
 * folds what is under it, each file a link or a button. One source for both platforms.
 *
 * It is here because mcp-skills-manager drew a skill's files this way by hand — its own indent,
 * selected and hover colours, icon, monospace name and hover row actions on raw `<li>` and
 * `<button>` — and mcp-ragdown then copied it for its notes. Neither could fold a folder, because
 * that was not worth building for one app.
 *
 * What it settles, since the two copies disagreed or left it out:
 *
 * - **A folder folds.** Its row is one button with `aria-expanded` and a turning chevron, and what
 *   is under it is not mounted while it is shut. Every folder starts open, which is what both
 *   copies drew; `defaultOpen` starts it otherwise and `open`/`onOpenChange` hand it to the caller.
 * - **A file's row is a link or a button, never both.** `linkSlot` for an app whose open file is in
 *   the URL, `onSelect` for one that holds it in state. With neither, the row is only a row.
 * - **Row actions are siblings of the pressed part**, as `ListItem`'s are: a button in a button is
 *   invalid, and its click would also open the file. They are hidden until the row is hovered or
 *   holds focus only where there *is* a hover, so a touch screen is not left with buttons nobody
 *   can reach.
 * - **It is a list of lists, not a `role="tree"`.** Every row is reached with Tab and pressed with
 *   Enter or Space, which is what a list of links already does, and a tree role would promise
 *   arrow keys and typeahead on both platforms.
 *
 * The nesting is `buildTree`'s, which ships beside it in `@/lib/tree` for a caller that wants the
 * nodes without the look. A view with no folders to nest under — "recently changed" — is not a
 * tree: draw that one as a list of `ListItem`s.
 */
export function FileTree<T extends TreeEntry>({
  label,
  entries,
  pinned,
  selected,
  linkSlot,
  onSelect,
  meta,
  actionSlot,
  open: openProp,
  onOpenChange,
  defaultOpen = "all",
  className,
}: FileTreeProps<T>) {
  const tree = React.useMemo(() => buildTree(entries), [entries]);
  const folders = React.useMemo(() => folderPaths(tree), [tree]);
  // What has been pressed, rather than what is open: a folder that arrives later still starts as
  // `defaultOpen` says, which a list of the open ones taken at mount would get wrong.
  const [toggled, setToggled] = React.useState(NO_PATHS);

  const isOpen = (path: string) =>
    openProp
      ? openProp.includes(path)
      : (defaultOpen === "all" || defaultOpen.includes(path)) !== toggled.has(path);

  const toggle = (path: string) => {
    const next = !isOpen(path);
    if (openProp === undefined) {
      setToggled((before) => {
        const after = new Set(before);
        if (!after.delete(path)) after.add(path);
        return after;
      });
    }
    onOpenChange?.(folders.filter((folder) => (folder === path ? next : isOpen(folder))));
  };

  // A file has no chevron, so where the tree has folders it keeps the chevron's place and its icon
  // lines up with a folder's beside it.
  const hasFolders = folders.length > 0;

  const renderRow = (node: TreeNode<T>, depth: number, isFile: boolean) => {
    const isSelected = isFile && selected === node.path;
    const ink = isSelected ? "text-active-foreground" : "text-foreground";
    const muted = isSelected ? "text-active-foreground" : "text-foreground/60";
    const indent = { paddingLeft: depth * INDENT + 8 };
    const pressable = !isFile || linkSlot !== undefined || onSelect !== undefined;
    const facts = meta?.(node);
    const actions = actionSlot?.(node);

    const inside = (
      <>
        {isFile ? (
          <>
            {hasFolders ? <View className="size-4 shrink-0" /> : null}
            <File aria-hidden className={cn("size-4 shrink-0", muted)} />
          </>
        ) : (
          <>
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0",
                muted,
                Platform.select({ web: "transition-transform", default: undefined }),
                isOpen(node.path) && "rotate-90",
              )}
            />
            <Folder aria-hidden className={cn("size-4 shrink-0", muted)} />
          </>
        )}
        <Text
          testID="file-tree-name"
          className={cn(
            "min-w-0 shrink font-mono text-sm",
            // `truncate` is the ellipsis on the web; on device it is `numberOfLines`, which is
            // what `line-clamp-1` becomes and what `truncate` does not.
            Platform.select({ web: "truncate", default: "line-clamp-1" }),
            ink,
          )}
        >
          {node.name}
        </Text>
        {facts ? (
          <View testID="file-tree-meta" className="shrink-0 flex-row items-center gap-1">
            {asText(facts, cn("text-xs tabular-nums", muted))}
          </View>
        ) : null}
      </>
    );

    let row: ReactElement;
    if (!isFile) {
      const expanded = isOpen(node.path);
      row = (
        <Pressable
          testID="file-tree-folder"
          role="button"
          aria-expanded={expanded}
          accessibilityState={{ expanded }}
          onPress={() => toggle(node.path)}
          className={ROW_CLASS}
          style={indent}
        >
          {inside}
        </Pressable>
      );
    } else if (linkSlot) {
      row = fileLink(linkSlot(node), isSelected, indent, inside);
    } else if (onSelect) {
      row = (
        <Pressable
          testID="file-tree-file"
          role="button"
          aria-current={isSelected ? true : undefined}
          onPress={() => onSelect(node.path)}
          className={ROW_CLASS}
          style={indent}
        >
          {inside}
        </Pressable>
      );
    } else {
      row = (
        <View testID="file-tree-file" className={ROW_CLASS} style={indent}>
          {inside}
        </View>
      );
    }

    return (
      <View
        testID="file-tree-row"
        className={cn(
          "min-w-0 flex-row items-center gap-1 rounded-md",
          Platform.select({ web: "group", default: undefined }),
          isSelected
            ? cn(
                "bg-active",
                Platform.select({ web: "has-[:focus-visible]:bg-active/90", default: undefined }),
              )
            : pressable &&
                Platform.select({
                  web: "transition-colors hover:bg-hover has-[:focus-visible]:bg-hover",
                  default: undefined,
                }),
        )}
      >
        {row}
        {actions ? (
          <View
            testID="file-tree-action"
            className={cn(
              "shrink-0 flex-row items-center gap-0.5 pr-1",
              // Hidden only where a pointer can bring them back. An open menu keeps its trigger on
              // screen after the pointer has left the row for the menu.
              Platform.select({
                web: "transition-opacity focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0",
                default: undefined,
              }),
            )}
          >
            {actions}
          </View>
        ) : null}
      </View>
    );
  };

  const renderItems = (nodes: readonly TreeNode<T>[], depth: number): ReactNode =>
    nodes.map((node) => (
      <View key={node.path} role="listitem" testID="file-tree-item" className="min-w-0 gap-0.5">
        {renderRow(node, depth, node.type === "file")}
        {node.type === "dir" && node.children.length > 0 && isOpen(node.path) ? (
          <View role="list" testID="file-tree-children" className="min-w-0 gap-0.5">
            {renderItems(node.children, depth + 1)}
          </View>
        ) : null}
      </View>
    ));

  if (tree.length === 0 && !pinned?.length) return null;

  return (
    <View
      role="list"
      testID="file-tree"
      aria-label={label}
      className={cn("min-w-0 gap-0.5", className)}
    >
      {pinned?.map((entry) => (
        <View key={entry.path} role="listitem" testID="file-tree-item" className="min-w-0">
          {renderRow(
            { name: entry.path, path: entry.path, type: entry.type, entry, children: [] },
            0,
            true,
          )}
        </View>
      ))}
      {renderItems(tree, 0)}
    </View>
  );
}

/**
 * A file's row as the router's link. On the web the caller's element *is* the row — it is cloned
 * with the row's classes and what is inside it, so it stays the router's own `<a>`. On device a
 * link is expo-router's, which takes the row the other way round: it is given `asChild` and wraps
 * the `Pressable`.
 */
function fileLink(
  link: ReactElement,
  isSelected: boolean,
  indent: { paddingLeft: number },
  inside: ReactNode,
) {
  if (Platform.OS !== "web") {
    return React.cloneElement(
      link as ReactElement<{ asChild?: boolean }>,
      { asChild: true },
      <Pressable
        testID="file-tree-file"
        role="link"
        accessibilityState={{ selected: isSelected }}
        className={ROW_CLASS}
        style={indent}
      >
        {inside}
      </Pressable>,
    );
  }

  const element = link as ReactElement<Record<string, unknown>>;
  return React.cloneElement(
    element,
    {
      "data-slot": "file-tree-file",
      className: cn("flex", ROW_CLASS, element.props.className as string | undefined),
      style: indent,
      "aria-current": isSelected ? "page" : undefined,
    },
    inside,
  );
}

export type { FileTreeProps };
