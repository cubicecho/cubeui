import type { ReactElement } from "react";
import { Text, View } from "react-native";
import {
  BarNavItem,
  Sidebar,
  SidebarNavItem,
  SidebarSection,
} from "../../../registry/layout/sidebar";
import { SidebarLayout } from "../../../registry/layout/split-layout";
import { Calendar, CircleCheck, Folder, Settings } from "../../../registry/ui/icons";

/**
 * The phone app every mobile example sits in: the places along the bottom, where a thumb is, and
 * a sidebar instead on a tablet. It is the example app's own root layout, written once, so each
 * screen only says which place it is.
 *
 * The sources are the React Native ones under `registry/`, drawn by react-native-web.
 */

export type MobilePlace = "today" | "projects" | "schedule" | "settings";

const PLACES: readonly { id: MobilePlace; label: string; icon: ReactElement; count?: number }[] = [
  { id: "today", label: "Today", icon: <CircleCheck />, count: 4 },
  { id: "projects", label: "Projects", icon: <Folder /> },
  { id: "schedule", label: "Schedule", icon: <Calendar /> },
  { id: "settings", label: "Settings", icon: <Settings /> },
];

export function MobileShell({ current, screen }: { current: MobilePlace; screen: ReactElement }) {
  return (
    <View className="h-svh bg-background">
      <SidebarLayout
        className="flex-1"
        sidebarPosition="start"
        sidebarWidth="auto"
        divider="none"
        sidebarHideBelow="md"
        barPosition="bottom"
        sidebarSlot={
          <Sidebar
            label="Main"
            headerSlot={<Text className="px-2 font-semibold text-foreground">Acme Tasks</Text>}
            contentSlot={
              <SidebarSection
                as="nav"
                title="Places"
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
            }
          />
        }
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
        contentSlot={screen}
      />
    </View>
  );
}

/** A person's initials in a circle: the example app's avatar. */
export function Initials({ name }: { name: string }) {
  return (
    <View aria-hidden className="size-8 items-center justify-center rounded-full bg-foreground/10">
      <Text className="font-medium text-foreground text-xs">
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </Text>
    </View>
  );
}

/** "Today" in every mobile example, fixed so a screenshot taken next month says the same. */
export const TODAY = new Date(2026, 9, 23);

export const dayFrom = (offset: number) =>
  new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);

/** The phone viewport the mobile gallery uses, so breakpoint classes read a phone's width. */
export const PHONE = { viewport: { value: "mobile2", isRotated: false } } as const;
