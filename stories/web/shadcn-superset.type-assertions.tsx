/**
 * The web halves are a superset of shadcn's DOM API — checked, not claimed.
 *
 * Nothing renders this file. It is typechecked by `tsconfig.web.json`, where
 * `@/components/ui/*` resolves to `compiled/` — what a DOM app installs over its own shadcn
 * primitives — so every line below is a call site that app already has, and a line that stops
 * compiling is an app that stops compiling. The `@ts-expect-error` lines are the other direction:
 * they fail if a type is widened to `any` and the positive lines pass for the wrong reason.
 *
 * Covered: alert (every part), empty (every part), input, textarea, checkbox, switch, select (every part), field (every part) and
 * `OptionSelect`'s `<button>` trigger props.
 */

import { useRef } from "react";
import { OptionSelect } from "@/components/option-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { CircleAlert } from "@/components/ui/icons";
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
        onEscape={() => {}}
        onKeyPress={(event: { nativeEvent: { key: string } }) => event.nativeEvent.key}
      />
      {/* The slots sit beside every DOM prop, which still land on the field. */}
      <Input
        id="q"
        aria-invalid
        onChange={(event) => event.target.value}
        leading={<span />}
        trailing={<button type="button" aria-label="Clear" />}
        wrapperClassName="w-64"
      />
      {/* A DOM `onKeyPress` still gets the React keyboard event. */}
      <Input onKeyPress={(event) => event.key === "a" && event.currentTarget.select()} />
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

export function AlertAssertions() {
  return (
    <>
      <Alert>
        <CircleAlert />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app using the cli.</AlertDescription>
      </Alert>
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle className="line-clamp-1">Unable to process your payment.</AlertTitle>
        <AlertDescription>
          <p>Please verify your billing information and try again.</p>
        </AlertDescription>
      </Alert>
      {/* @ts-expect-error — shadcn's alert has no `success` variant, and neither does this one. */}
      <Alert variant="success" />
    </>
  );
}

export function EmptyAssertions() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <>
      <Empty ref={root} className="border border-dashed py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Make one, or <a href="/docs">read the docs</a>.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">New project</button>
        </EmptyContent>
      </Empty>
      <Empty id="none" aria-live="polite">
        <EmptyMedia variant="default" className="size-12">
          <img src="/a.png" alt="" />
        </EmptyMedia>
        <EmptyMedia variant={null} />
        <EmptyTitle className="text-lg">Nothing</EmptyTitle>
      </Empty>
      {/* @ts-expect-error — shadcn's EmptyMedia has `default` and `icon`, and so does this one. */}
      <EmptyMedia variant="avatar" />
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
