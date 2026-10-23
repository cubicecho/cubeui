import { BookOpen, CalendarDays, Inbox, LayoutDashboard, ListTodo, LogOut } from "lucide-react";
import { type ReactElement, useState } from "react";
import {
  BarNavItem,
  Sidebar,
  SidebarCollapseButton,
  SidebarNavItem,
  SidebarSection,
  useSidebar,
} from "@/components/sidebar";
import { SidebarLayout } from "@/components/split-layout";
import { Button } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/color-dot";
import { Plus, Settings } from "@/components/ui/icons";
import { initials, PROJECTS } from "./fixtures";

/**
 * The app every web example sits in: a sidebar on a wide screen, a bar with the same places on a
 * narrow one. It is the example app's own component, not a registry item — what an app writes
 * once in its root layout, so each example page only has to say which place it is.
 */

/** The places the app has, in the order the sidebar and the bar show them. */
export type Place = "dashboard" | "tasks" | "inbox" | "docs" | "schedule" | "settings";

const PLACES: readonly {
  id: Exclude<Place, "settings">;
  label: string;
  icon: ReactElement;
  count?: number;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { id: "tasks", label: "Tasks", icon: <ListTodo />, count: 24 },
  { id: "inbox", label: "Inbox", icon: <Inbox />, count: 3 },
  { id: "docs", label: "Docs", icon: <BookOpen /> },
  { id: "schedule", label: "Schedule", icon: <CalendarDays /> },
];

/** The mark folds with the sidebar: the name beside it goes when the rail is icons only. */
function Brand() {
  const { collapsed } = useSidebar();
  return (
    <a href="#dashboard" className="flex items-center gap-2 px-2 py-1 text-foreground no-underline">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-active font-bold text-active-foreground text-sm"
      >
        A
      </span>
      {collapsed ? (
        <span className="sr-only">Acme Studio</span>
      ) : (
        <span className="font-semibold text-sm">Acme Studio</span>
      )}
    </a>
  );
}

/** The same brand for the narrow bar, where there is no sidebar to fold. */
function BarBrand() {
  return (
    <a href="#dashboard" className="flex items-center gap-2 text-foreground no-underline">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-md bg-active font-bold text-active-foreground text-sm"
      >
        A
      </span>
      <span className="font-semibold text-sm">Acme Studio</span>
    </a>
  );
}

export function AppShell({ current, page }: { current: Place; page: ReactElement }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarLayout
      className="h-svh bg-background"
      sidebarPosition="start"
      sidebarWidth="auto"
      divider="none"
      sidebarHideBelow="md"
      sidebarSlot={
        <Sidebar
          label="Main"
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          headerSlot={<Brand />}
          contentSlot={
            <>
              <SidebarSection
                as="nav"
                title="Workspace"
                contentSlot={PLACES.map((place) => (
                  <SidebarNavItem
                    key={place.id}
                    href={`#${place.id}`}
                    label={place.label}
                    iconSlot={place.icon}
                    active={place.id === current}
                    {...(place.count === undefined ? {} : { count: place.count })}
                  />
                ))}
              />
              <SidebarSection
                title="Projects"
                actionSlot={
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label="New project"
                    iconSlot={<Plus />}
                  />
                }
                contentSlot={PROJECTS.map((project) => (
                  <SidebarNavItem
                    key={project.id}
                    href={`#projects/${project.id}`}
                    label={project.name}
                    iconSlot={<ColorDot color={project.color} />}
                    count={project.open}
                    {...(project.status ? { status: { label: project.status } } : {})}
                  />
                ))}
              />
            </>
          }
          footerSlot={
            <>
              <SidebarNavItem
                href="#settings"
                label="Settings"
                iconSlot={<Settings />}
                active={current === "settings"}
              />
              <SidebarNavItem label="Sign out" iconSlot={<LogOut />} onClick={() => {}} />
              <SidebarCollapseButton />
            </>
          }
        />
      }
      brandSlot={<BarBrand />}
      navLabel="Main"
      navSlot={PLACES.map((place) => (
        <BarNavItem
          key={place.id}
          href={`#${place.id}`}
          label={place.label}
          iconSlot={place.icon}
          active={place.id === current}
          {...(place.count === undefined ? {} : { count: place.count })}
        />
      ))}
      actionSlot={
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Settings"
          linkSlot={<a href="#settings" aria-label="Settings" />}
          iconSlot={<Settings />}
        />
      }
      // The page fills what is left and scrolls on its own; a split whose panes stack on a phone
      // is taller than the screen, and this is what scrolls it there.
      contentSlot={<div className="flex min-h-0 flex-1 flex-col overflow-auto">{page}</div>}
    />
  );
}

/** A person's initials in a circle — the example app's avatar, since the registry has none. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={
        size === "sm"
          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-medium text-[10px] text-foreground"
          : "flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-medium text-foreground text-xs"
      }
    >
      {initials(name)}
    </span>
  );
}
