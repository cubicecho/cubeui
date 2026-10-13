import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CardLayout as CompiledCardLayout } from "../compiled/card-layout";
import { Form as CompiledForm, createAppForm as compiledCreateAppForm } from "../compiled/form";
import { Info as CompiledInfo } from "../compiled/icons";
import { Section as CompiledSection } from "../compiled/section";
import { SettingRow as CompiledSettingRow } from "../compiled/setting-row";
import { Switch as CompiledSwitch } from "../compiled/switch";
import { CardLayout as NativeCardLayout } from "../registry/layout/card-layout";
import { Section as NativeSection } from "../registry/layout/section";
import { SettingRow as NativeSettingRow } from "../registry/layout/setting-row";
import { Form as NativeForm, createAppForm as nativeCreateAppForm } from "../registry/ui/form";
import { Info as NativeInfo } from "../registry/ui/icons";
import { Switch as NativeSwitch } from "../registry/ui/switch";
import { SideBySide } from "./side-by-side";

/**
 * `descriptionPlacement="popover"` on the four shells that draw a description: a bound field,
 * `CardLayout`, `Section` and `SettingRow` — issue #319. The sentence goes behind a button beside
 * the title, named "About <title>", on both halves: react-native-web on the left, the compiled
 * DOM on the right.
 *
 * Each story asserts the three things a hand-written wrapper gets wrong: the button is beside the
 * title and not inside it, it is named from the title, and on the web the text is still on the
 * page for a screen reader — and for `aria-describedby` — with the pane shut.
 */
const meta = { title: "RN Parity/DescriptionPlacement" } satisfies Meta;
export default meta;
type Story = StoryObj;

const HELP = "The canonical, human-readable name. Shown in every list and in the page title.";

const body = () => within(document.body);

function halves(canvasElement: HTMLElement) {
  const sections = Array.from(canvasElement.querySelectorAll("section"));
  const [native, compiled] = sections;
  // `Section` compiles to a `<section>` of its own, so the frame's two are the first two.
  if (!native || !compiled) {
    throw new Error("both halves should render");
  }
  return [native, compiled] as const;
}

/**
 * What every story here checks. Both halves have one button named `name`; the sentence is on the
 * page once per half and clipped, not drawn; pressing the button shows it, and the pane shuts.
 */
async function foldsTheDescription(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);
  const triggers = canvas.getAllByRole("button", { name });
  await expect(triggers).toHaveLength(2);
  const [nativeTrigger, compiledTrigger] = triggers;
  if (!nativeTrigger || !compiledTrigger) {
    throw new Error("both halves should draw the button");
  }

  const copies = canvas.getAllByText(HELP);
  await expect(copies).toHaveLength(2);
  for (const copy of copies) {
    // `sr-only`: a one-pixel clipped box, which is read and not seen.
    await expect(getComputedStyle(copy).position).toBe("absolute");
    await expect(getComputedStyle(copy).width).toBe("1px");
  }

  // The pane is radix's on both halves: Vite resolves `popover.web.tsx` for the native source
  // too, which is what an app built for the browser gets. A dialog carrying the button's name.
  for (const trigger of [nativeTrigger, compiledTrigger]) {
    await userEvent.click(trigger);
    const pane = await body().findByRole("dialog", { name });
    await waitFor(() => expect(pane).toBeVisible());
    await expect(pane).toHaveTextContent(HELP);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog", { name })).toBeNull());
  }
}

const native = nativeCreateAppForm({});
const compiled = compiledCreateAppForm({});

type Kit = { useAppForm: typeof native.useAppForm; Form: typeof NativeForm; icon: ReactElement };

function ProfileForm({ kit }: { kit: Kit }) {
  const { useAppForm, Form } = kit;
  const form = useAppForm({
    defaultValues: { name: "", slug: "", live: false },
    onSubmit: () => {},
  });
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <form.AppField name="name">
          {(field) => (
            <field.InputField
              label="Display name"
              description={HELP}
              descriptionPlacement="popover"
              required
            />
          )}
        </form.AppField>
        <form.AppField name="slug">
          {(field) => (
            // A label that is not a string cannot be read into the name, so the name is generic.
            <field.InputField
              label={<Text className="text-foreground">Slug</Text>}
              description="Lower case, no spaces."
              descriptionPlacement="popover"
              descriptionIconSlot={kit.icon}
            />
          )}
        </form.AppField>
        <form.AppField name="live">
          {(field) => (
            <field.SwitchField
              label="Live"
              description="Visible to everyone with the link."
              descriptionPlacement="popover"
            />
          )}
        </form.AppField>
      </Form>
    </form.AppForm>
  );
}

const NATIVE: Kit = { useAppForm: native.useAppForm, Form: NativeForm, icon: <NativeInfo /> };

// The compiled module is the same source through the compiler; its refs are DOM elements.
const COMPILED = {
  useAppForm: compiled.useAppForm,
  Form: CompiledForm,
  icon: <CompiledInfo />,
} as unknown as Kit;

/**
 * A bound field. `descriptionPlacement` is on `BoundFieldProps`, so every field on `field.*` takes
 * it — a text box and a horizontal switch here. The control is still described by the sentence:
 * it is `aria-describedby` that reads it, and that needs the text on the page.
 */
export const BoundField: Story = {
  render: () => (
    <SideBySide native={<ProfileForm kit={NATIVE} />} compiled={<ProfileForm kit={COMPILED} />} />
  ),
  play: async ({ canvasElement }) => {
    await foldsTheDescription(canvasElement, "About Display name");

    for (const half of halves(canvasElement)) {
      const canvas = within(half);
      // Named by the label alone: the button is beside the label, not inside it.
      const box = canvas.getByRole("textbox", { name: "Display name" });
      await expect(box).toHaveAccessibleDescription(HELP);

      await expect(canvas.getByRole("button", { name: "About this field" })).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Slug" })).toHaveAccessibleDescription(
        "Lower case, no spaces.",
      );

      const toggle = canvas.getByRole("switch", { name: "Live" });
      await expect(toggle).toHaveAccessibleDescription("Visible to everyone with the link.");
      await expect(canvas.getByRole("button", { name: "About Live" })).toBeVisible();
    }
  },
};

/** The same field with nothing passed: the description is under the control, and no button. */
export const InlineIsTheDefault: Story = {
  render: () => {
    function Inline({ kit }: { kit: Kit }) {
      const form = kit.useAppForm({ defaultValues: { name: "" }, onSubmit: () => {} });
      return (
        <form.AppForm>
          <kit.Form>
            <form.AppField name="name">
              {(field) => <field.InputField label="Display name" description={HELP} />}
            </form.AppField>
          </kit.Form>
        </form.AppForm>
      );
    }
    return <SideBySide native={<Inline kit={NATIVE} />} compiled={<Inline kit={COMPILED} />} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: /^About/ })).toBeNull();
    const copies = canvas.getAllByText(HELP);
    await expect(copies).toHaveLength(2);
    for (const copy of copies) {
      await expect(copy).toBeVisible();
      await expect(getComputedStyle(copy).position).not.toBe("absolute");
    }
  },
};

const cardBody = <Text className="text-foreground text-sm">Ada Lovelace</Text>;

/** `CardLayout`: the button comes after the title, and the title is still the heading's whole name. */
export const Card: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeCardLayout
          title="Profile"
          description={HELP}
          descriptionPlacement="popover"
          contentSlot={cardBody}
        />
      }
      compiled={
        <CompiledCardLayout
          title="Profile"
          description={HELP}
          descriptionPlacement="popover"
          contentSlot={cardBody}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await foldsTheDescription(canvasElement, "About Profile");
    await expect(
      within(canvasElement).getAllByRole("heading", { level: 3, name: "Profile" }),
    ).toHaveLength(2);
  },
};

/**
 * A card with no body and no footer is its title and description and nothing else. Folded, it
 * would be a heading on an empty card, so the description stays where it was.
 */
export const CardThatIsOnlyItsDescription: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeCardLayout title="Profile" description={HELP} descriptionPlacement="popover" />
      }
      compiled={
        <CompiledCardLayout title="Profile" description={HELP} descriptionPlacement="popover" />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "About Profile" })).toBeNull();
    for (const copy of canvas.getAllByText(HELP)) {
      await expect(copy).toBeVisible();
      await expect(getComputedStyle(copy).position).not.toBe("absolute");
    }
  },
};

const sectionBody = <Text className="text-foreground text-sm">Work 25 minutes, rest 5.</Text>;

/** `Section`: the heading keeps its rank and name, and on the web the region is described. */
export const SectionHeading: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeSection
          title="Naming"
          description={HELP}
          descriptionPlacement="popover"
          contentSlot={sectionBody}
        />
      }
      compiled={
        <CompiledSection
          title="Naming"
          description={HELP}
          descriptionPlacement="popover"
          contentSlot={sectionBody}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await foldsTheDescription(canvasElement, "About Naming");
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 2, name: "Naming" })).toHaveLength(2);
    const region = canvas.getByRole("region", { name: "Naming" });
    await expect(region.tagName).toBe("SECTION");
    await expect(region).toHaveAccessibleDescription(HELP);
  },
};

/**
 * `SettingRow`: `descriptionId` is handed to `actionSlot` whichever placement is chosen, and on
 * the web it still resolves, so the switch is described with the pane shut.
 */
export const Setting: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeSettingRow
          title="Public profile"
          description={HELP}
          descriptionPlacement="popover"
          actionSlot={({ titleId }) => (
            <NativeSwitch aria-labelledby={titleId} checked={false} onCheckedChange={() => {}} />
          )}
        />
      }
      compiled={
        <CompiledSettingRow
          title="Public profile"
          description={HELP}
          descriptionPlacement="popover"
          actionSlot={({ titleId, descriptionId }) => (
            <CompiledSwitch
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              checked={false}
              onCheckedChange={() => {}}
            />
          )}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await foldsTheDescription(canvasElement, "About Public profile");
    const [, compiledHalf] = halves(canvasElement);
    const toggle = within(compiledHalf).getByRole("switch", { name: "Public profile" });
    await expect(toggle).toHaveAccessibleDescription(HELP);
  },
};
