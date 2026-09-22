/**
 * The web halves are a superset of shadcn's DOM API — checked, not claimed.
 *
 * Nothing renders this file. It is typechecked by `tsconfig.web.json`, where
 * `@/components/ui/*` resolves to `compiled/` — what a DOM app installs over its own shadcn
 * primitives — so every line below is a call site that app already has, and a line that stops
 * compiling is an app that stops compiling. The `@ts-expect-error` lines are the other direction:
 * they fail if a type is widened to `any` and the positive lines pass for the wrong reason.
 *
 * Covered: input, textarea, checkbox, switch, select (every part), field (every part) and
 * `OptionSelect`'s `<button>` trigger props.
 */

import { useRef } from "react";
import { OptionSelect } from "@/components/option-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input, type InputHandle } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function InputAssertions() {
  const dom = useRef<HTMLInputElement>(null);
  const handle = useRef<InputHandle>(null);
  return (
    <>
      <Input
        ref={dom}
        type="email"
        name="email"
        id="email"
        defaultValue="a@b.c"
        autoComplete="email"
        required
        aria-invalid
        aria-describedby="email-error"
        data-testid="email"
        onChange={(event) => event.target.value.toUpperCase()}
        onKeyDown={(event) => event.key === "Escape"}
        onFocus={(event) => event.currentTarget.select()}
      />
      <Input type="file" accept="image/*" multiple />
      <Input type="checkbox" />
      {/* The cross-platform spelling still works beside it. */}
      <Input
        ref={handle}
        value="x"
        onChangeText={(text: string) => text}
        onSubmitEditing={() => {}}
      />
      {/* @ts-expect-error — `onChange` hands over an event, not the text. */}
      <Input onChange={(text: string) => text} />
    </>
  );
}

export function TextareaAssertions() {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <Textarea
        ref={ref}
        name="bio"
        defaultValue="hi"
        rows={4}
        onChange={(event) => event.target.value}
        onKeyDown={(event) => event.metaKey}
        aria-invalid
      />
      <Textarea value="x" onChangeText={(text: string) => text} />
    </>
  );
}

export function CheckboxAssertions() {
  return (
    <>
      <Checkbox defaultChecked />
      <Checkbox id="terms" name="terms" value="yes" required aria-invalid />
      <Checkbox checked="indeterminate" onCheckedChange={(checked) => checked === true} />
      <Switch defaultChecked name="alerts" size="sm" />
      <Switch checked onCheckedChange={(checked: boolean) => checked} />
      {/* @ts-expect-error — shadcn's switch has two sizes. */}
      <Switch size="lg" />
    </>
  );
}

export function SelectAssertions() {
  return (
    <Select defaultValue="apple" name="fruit" required>
      <SelectTrigger size="sm" id="fruit" aria-invalid className="w-45">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start">
        <SelectScrollUpButton />
        <SelectGroup>
          <SelectLabel>Fruit</SelectLabel>
          <SelectItem value="apple" textValue="Apple">
            Apple
          </SelectItem>
          <SelectItem value="kiwi" disabled>
            Kiwi
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectScrollDownButton />
      </SelectContent>
    </Select>
  );
}

export function FieldAssertions() {
  return (
    <FieldSet id="profile" aria-describedby="profile-help">
      <FieldLegend variant="label">Profile</FieldLegend>
      <FieldDescription>Shown on your page.</FieldDescription>
      <FieldGroup>
        <Field orientation="responsive" data-invalid>
          <FieldContent>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldDescription id="name-help">Your full name.</FieldDescription>
          </FieldContent>
          <Input id="name" />
          <FieldError errors={[{ message: "Required" }, undefined, { message: "Required" }]} />
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldTitle>Plan</FieldTitle>
          <FieldError>Pick one.</FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export function OptionSelectAssertions() {
  return (
    <OptionSelect
      options={[{ label: "One", value: "1" }]}
      value="1"
      onValueChange={() => {}}
      id="count"
      name="count"
      aria-describedby="count-help"
      onFocus={(event) => event.currentTarget.blur()}
      data-testid="count"
    />
  );
}
