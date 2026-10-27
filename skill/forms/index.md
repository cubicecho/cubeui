# cubeui forms

Read [SKILL.md](../SKILL.md) first for the "no children" rule, and
[vocabulary.md](../vocabulary.md) for the slot vocabulary. Neither is repeated here.

**Web first.** `FormField` and the `@cubeui/app-form` fields are DOM components with no React
Native half. `RadioGroupField` is one source compiled for both, with the same props on each. An
Expo project has its own `useAppForm` with the same shape — see [On React Native](native.md#on-react-native)
in `native.md`.

**Every project using these runs TanStack Form.** Do not introduce a second form library, and do
not write a form with `useState` and hand-rolled validation beside one written with these.

**The forms files.** Each holds one group; [SKILL.md](../SKILL.md)'s choosing table links straight to the section you need.

| File | What is in it |
| --- | --- |
| [app-form.md](app-form.md) | `useAppForm` and the bound fields, `FieldRow`, forms in dialogs, a field of your own |
| [form-field.md](form-field.md) | `FormField`, schema descriptions, checkboxes and switches, grouped controls |
| [native.md](native.md) | `@cubeui/form`: `Form`, `useAppForm` and `field.*` |
