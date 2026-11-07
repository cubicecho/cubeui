# cubeui layout: Centered pages

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Centered pages

The sign-in page, the token gate, the "check your email" screen: one card in the middle of a page
of its own. `CenteredCardLayout` is that page — full height, centred both ways, `p-4` off the edges —
around a `max-w-sm` `CardLayout`, and it takes every slot the card takes, under the same names.
The card is the page here, so its title is the page's: an `h1` at `text-xl`, as `PageHeader`'s
level 1, not a card title. `level` and `titleClassName` still override it.

```tsx
<CenteredCardLayout
  iconSlot={<KeyRound />}
  title="Authentication required"
  description="Enter the router token from settings.json."
  contentSlot={
    <form id="token" onSubmit={submit}>
      <FormField label="Token" controlSlot={<Input type="password" value={token} onChangeText={setToken} />} />
    </form>
  }
  footerActionsSlot={
    <Button type="submit" form="token" disabled={!token.trim()} content="Unlock" />
  }
/>
```

<!-- props:CenteredCardLayout -->
`CenteredCardLayout`'s props, from the TSDoc in `registry/layout/centered-card-layout.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `className` | `string` |  | The root — the full-height box the card is centred in. A background, or a different padding. On device it styles the scroll view's content container, which is the box that fills the screen and does the centring. |
| `cardClassName` | `string` |  | The card. It is `w-full max-w-sm`; pass `max-w-md` here for a wider one, which replaces the cap rather than competing with it. |

It also takes the props declared in `registry/layout/card-layout.tsx`: `actionPlacement`, `actionSlot`, `contentClassName`, `contentSlot`, `description`, `descriptionIconSlot`, `descriptionPlacement`, `emptySlot`, `footerActionsSlot`, `footerClassName`, `footerSlot`, `headerClassName`, `iconSlot`, `level`, `loading`, `title`, `titleClassName`, `wrapperSlot`.
<!-- /props -->

**It was `CenteredLayout`.** `CenteredLayout`, and the `@cubeui/centered-layout` item that
re-exports it, stay for one release as deprecated aliases; import `CenteredCardLayout` from
`@/components/centered-card-layout` in new code.

`CenteredCardLayout` hands `wrapperSlot` to its card as it does every other slot, so a sign-in of
two fields — an email and a password — puts its `<form>` there and its submit in
`footerActionsSlot`, as [a card does](cards.md#cards). The `form="token"` above is the other way,
for a form that is already written: the button names the form it submits.

Render it *instead of* the app shell, not inside it: on the web its root is the page's `<main>`,
and `min-h-svh` tall. `className` is that page — a `bg-background`, a different padding.
`cardClassName` is the card: `cardClassName="max-w-md"` for a wider one, which replaces the cap.

On device the root is a `ScrollView` filling the screen, so a form in the card stays reachable
when the keyboard comes up, and a tap on the submit button is not spent dismissing the keyboard.
Do not wrap it in a `KeyboardAvoidingView` or a `ScrollView` of your own.

A sign-in with no card — a heading and a form on the bare background — is not this shape; lay
that out with `PageLayout` or by hand rather than stripping the card with `cardClassName`.
