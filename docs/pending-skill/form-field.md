# Pending: the `FormField` section of SKILL.md

Fold this into `.claude/skills/cubeui/SKILL.md` after the form branches merge. Written in that
file's voice, and in the order it should land there.

---

## 1. Add to the "Choosing" table

| The shape you are building | Use |
| --- | --- |
| A label, a control, a hint under it, and an error | `FormField` |

## 2. Add to "The slot vocabulary"

Four words the form components add, and one boolean:

- **`control`** — the field's body: one `<Input>`, `<Textarea>`, `<Checkbox>`, `<Switch>`. The
  only body in the set that is not `content`, because it is the only one the shell *wires* rather
  than places. Either a single element that forwards its props to a form control, or a function
  taking those props for the cases where they belong on something nested — see below.
- **`label`** — what the control is called. Rendered as a real `<Label htmlFor>`.
- **`error`** — what is wrong with the value, as a string or a node. Falsy draws nothing.
- **`orientation`** — `vertical` (default) or `horizontal`.
- **`required`** — draws the asterisk and sets `aria-required`.

`description`, `action` and `loading` keep the meanings they have everywhere else: one line on
what the thing is for, the far end of the header row, and "the data has not arrived".

## 3. The section itself

### Fields

```tsx
<FormField
  label="Email"
  required
  description="We only use it to send the sign-in link."
  error={errors.email?.message}
  control={<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
/>
```

`FormField` does the **wiring**, not only the spacing. It mints an id, points the label at the
control, and gives the control an `aria-describedby` that reaches whichever of the description
and the error are on screen. Do not write any of that at the call site:

- Do not pass `id` or `htmlFor` unless you need the id yourself — the shell generates one, which
  is what makes a field safe to render twice on a page.
- Do not set `aria-invalid`, `aria-describedby` or `aria-required` on the control. The shell sets
  all three, and it only fills a gap: a value you set yourself wins.
- Do not put the error in a `<p>` beside the field. Pass it as `error`, and it is announced,
  linked, and drawn in the one voice the set uses.
- Do not use a placeholder as a label. A placeholder leaves at the first keystroke, and a field
  wearing one is announced as "edit text".

`error` takes whatever you already hold. **The shell itself binds to no form library** — but the
projects using it all run TanStack Form, so in practice `FormField` is what a
`field.InputField`-style wrapper renders, and that wrapper is where `useFieldContext()`, "has
this been touched yet" and the error message live. Hand `FormField` a string; keep the form
library one layer up.

Falsy `error` draws nothing, so write `error={errors.email?.message}` plainly. Never
`{errors.email && <p …>}`.

### Checkboxes and switches

```tsx
<FormField
  orientation="horizontal"
  label="Email me about releases"
  description="About one a month."
  control={<Checkbox checked={subscribed} onCheckedChange={setSubscribed} />}
/>
```

`horizontal` puts the control first and the label beside it — the arrangement whose label is part
of the control's hit target. Stacked, a 16px box sits on a line of its own above its own caption.

A **settings row** — a title and a paragraph on the left, a switch pushed to the far right — is
not this. That is a row, not a field; build it with `CardLayout` or by hand until the set has a
component for it.

### Loading

```tsx
<FormField label="Bio" loading={isPending} control={<Textarea rows={4} />} loadingClassName="h-16" />
```

`loading` swaps the control for a skeleton **and keeps the label and the description**, drawn for
real: they are literals the form already knows, not data it is waiting for, so a field that hides
them makes its label rail appear out of nowhere when the values land.

Do not build a second, parallel copy of a form for its loading state. Pass the query's pending
flag to the fields you already have.

`loading` outranks `error` — a value that has not arrived is not one that came back wrong — the
same ordering `CardLayout` makes between `loading` and `empty`.

The default skeleton is input-height, which is right for `Input`, a select trigger and a date
picker. Anything taller needs `loadingClassName` to say so, or the page jumps when the data lands.

### When the props belong on something nested

`Select` is the case. Its root renders no DOM, so a control the shell clones swallows the `id`,
the `aria-describedby` and the `aria-invalid` and the field ends up wired to nothing — with no
warning and nothing visibly wrong. Pass a **function** and put the props where they go:

```tsx
<FormField
  label="Plan"
  error={errors.plan?.message}
  control={(props) => (
    <Select value={plan} onValueChange={setPlan}>
      <SelectTrigger {...props} className="w-full">
        <SelectValue placeholder="Choose one" />
      </SelectTrigger>
      <SelectContent>…</SelectContent>
    </Select>
  )}
/>
```

Everything whose root *is* the control — `Input`, `Textarea`, `Checkbox`, `Switch` — passes the
element itself and needs none of this.

`htmlFor` is **not** the answer here, even though it looks like it: it points the label at the
trigger and leaves the description and the error describing nothing. Use `htmlFor` only when you
own the id for a separate reason — something else on the page references the control.

### Grouping fields

`FormField` has no width and no margin of its own, so it fits whatever you put it in: a
`grid gap-5` column, a `md:grid-cols-12` rail with `className="md:col-span-6"` on each field.
There is no cubeui component for the group yet — use a plain wrapper.
