/**
 * The half of `EmptyState compact` a rendered story cannot check: the line takes no `level` and
 * no `description`, and only the default block requires an icon — on both halves.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { Search as CompiledSearch } from "../compiled/icons";
import { EmptyState as Compiled } from "../compiled/page";
import { EmptyState as Native } from "../registry/layout/page";
import { Search as NativeSearch } from "../registry/ui/icons";

export function EmptyStateTypeAssertions() {
  return (
    <>
      <Native icon={NativeSearch} title="Project not found" level={1} />
      <Native compact={false} icon={NativeSearch} title="Nothing here" description="Yet." />
      <Native compact title="No labels yet." />
      <Native compact icon={NativeSearch} title="No labels yet." />
      {/* @ts-expect-error the default block draws its icon in a bubble, so it needs one */}
      <Native title="Nothing here" />
      {/* @ts-expect-error a line inside a region that has its heading is never a heading */}
      <Native compact title="No labels yet." level={2} />
      {/* @ts-expect-error the line is one line: the whole sentence goes in `title` */}
      <Native compact title="No labels yet." description="Add one." />

      <Compiled icon={CompiledSearch} title="Project not found" level={1} />
      <Compiled compact title="No labels yet." />
      {/* @ts-expect-error a line inside a region that has its heading is never a heading */}
      <Compiled compact title="No labels yet." level={2} />
      {/* @ts-expect-error the line is one line: the whole sentence goes in `title` */}
      <Compiled compact title="No labels yet." description="Add one." />
    </>
  );
}
