import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { PasswordInput as Compiled } from "../compiled/password-input";
import { PasswordInput as Native } from "../registry/ui/password-input";
import { SideBySide } from "./side-by-side";

/**
 * The password box on both halves: masked until the eye is pressed, the eye a button named for
 * what it will do next, and the reveal a change of `type` — `secureTextEntry` on the left, which
 * react-native-web renders as the same `type="password"`. Each half sits in a `<form>`, so a reveal
 * that submitted would show up as a call.
 */
const meta = { title: "Stage 0/PasswordInput" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onSubmit = fn((event: { preventDefault: () => void }) => event.preventDefault());

function NativeHarness() {
  const [value, setValue] = useState("");
  return <Native aria-label="Native token" value={value} onChangeText={setValue} />;
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <NativeHarness />
          <Native aria-label="Native plain" revealable={false} />
          <Native aria-label="Native disabled" defaultValue="hunter2" disabled />
        </form>
      }
      compiled={
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <Compiled aria-label="Compiled token" autoComplete="current-password" />
          <Compiled aria-label="Compiled plain" revealable={false} />
          <Compiled aria-label="Compiled disabled" defaultValue="hunter2" disabled />
        </form>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    onSubmit.mockClear();

    const [nativeForm, compiledForm] = Array.from(canvasElement.querySelectorAll("form"));
    if (!nativeForm || !compiledForm) throw new Error("both halves should render their form");

    for (const [half, form] of [
      ["Native", nativeForm],
      ["Compiled", compiledForm],
    ] as const) {
      const inForm = within(form);

      await step(`${half}: the eye reveals, renames itself and hides again`, async () => {
        const box = inForm.getByLabelText(`${half} token`);
        await userEvent.type(box, "hunter2");
        await expect(box).toHaveAttribute("type", "password");

        const eye = inForm.getAllByRole("button", { name: "Show password" })[0];
        if (!eye || !box.parentElement?.contains(eye)) throw new Error("the eye is in the box");

        await userEvent.click(eye);
        await expect(box).toHaveAttribute("type", "text");
        await expect(box).toHaveValue("hunter2");
        await expect(eye).toHaveAccessibleName("Hide password");

        await userEvent.click(eye);
        await expect(box).toHaveAttribute("type", "password");
        await expect(eye).toHaveAccessibleName("Show password");
      });

      await step(`${half}: off, there is no eye; disabled, the eye is too`, async () => {
        await expect(inForm.getByLabelText(`${half} plain`)).toHaveAttribute("type", "password");
        // The token box's eye and the disabled box's: the plain box adds none.
        const eyes = inForm.getAllByRole("button");
        await expect(eyes).toHaveLength(2);

        const disabled = inForm.getByLabelText(`${half} disabled`);
        const eye = eyes.find((button) => disabled.parentElement?.contains(button));
        if (!eye) throw new Error("a disabled box still shows its eye");
        // A DOM `<button disabled>` on one side, react-native-web's `aria-disabled` on the other.
        await expect(
          eye.hasAttribute("disabled") || eye.getAttribute("aria-disabled") === "true",
        ).toBe(true);
      });
    }

    await step("revealing never submits the form around it", async () => {
      await expect(onSubmit).not.toHaveBeenCalled();
    });
  },
};
