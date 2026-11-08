/**
 * Compiled from `registry/layout/dialog-layout.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A dialog with its slots placed — written once here and compiled for the web by `scripts/rn2web`,
 * on the `dialog` both platforms already share (radix on the web, a `Modal` on device). Its parts
 * are a `CardLayout` drawn on the dialog's panel, so a dialog has the card's icon, header action,
 * `loading` and `emptySlot`, laid out as a card lays them.
 *
 * What differs, each behind a `Platform` test the compiler folds:
 *
 * - the height cap: `100dvh` and `calc()` on the web, the screen the `Modal` already fills on
 *   device;
 * - `hideTitle`: an `sr-only` clip on the web, a one-pixel box on device;
 * - where the discard question is mounted — see the comment on it.
 *
 * The discard question is `ConfirmDialog`, a `Dialog` with `role="alertdialog"` rather than the
 * web-only `alert-dialog`, so both halves share it, and the same question `UnsavedChangesDialog`
 * asks, at the same width. It keeps what that primitive gave: the role, focus landing on "Keep
 * editing", and a click on the overlay that does not answer the question.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { cn, hasSlot, type SlotNode } from "@/lib/utils";
import {
  type ActionPlacement,
  CardLayout,
  type FloatingSurface,
  FloatingSurfaceContext,
} from "./card-layout";
import { ConfirmDialog, DISCARD_QUESTION } from "./confirm-dialog";
import type { DescriptionPlacement } from "./description-hint";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { HeaderContentFooter } from "./header-content-footer";

/** How wide the dialog wants to be, past the phone width every size shares. */
const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  // 16px clear of each edge at every width, the gap every size has on a phone, and on device.
  full: "sm:max-w-[calc(100%-2rem)]",
} as const;

/**
 * What turns `DialogContent` into a column that can be divided: `flex` replaces the web
 * primitive's `grid` so the body can be handed the leftover height, and `overflow-hidden` takes
 * the scroll off the dialog so the chassis can put it on the body. The cap is the web primitive's
 * own, restated for the styles that ship without one; on device the `Modal` is the screen.
 */
const COLUMN = "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden";

/** Off the screen and still read. `sr-only` is a clip, which the device does not have. */
const SR_ONLY = "sr-only";

/**
 * The chassis on the panel. `flex-1` on the web, where it sizes from content in a box of no set
 * height; Yoga's `flex: 1` starts from nothing, so on device it starts from its content and
 * shrinks under the panel's cap instead.
 */
const CHASSIS = "min-h-0 flex-1 gap-4";

/**
 * What `wrapperSlot`'s element takes on the panel, so it stands where the chassis stood: the same
 * share of the panel's height, passed on to the chassis inside it. Without it the wrapper is a box
 * of its content's height and the body stops scrolling.
 */
const WRAPPER = "flex min-h-0 flex-1 flex-col";

/**
 * The dialog's parts, handed to the `CardLayout` on its panel: the title names the dialog, the
 * description describes it, the body is the one part that scrolls, and the footer stacks below
 * `sm`. They live here rather than in the card so that a card installed alone carries no dialog.
 */
const DIALOG_SURFACE: FloatingSurface = {
  drawTitle: (title, className) => <DialogTitle className={className}>{title}</DialogTitle>,
  drawDescription: (description) => <DialogDescription>{description}</DialogDescription>,
  // Still the dialog's own description on the web, so radix points the dialog's
  // `aria-describedby` at it. A device has no `aria-describedby`, and hidden text there is text
  // VoiceOver stops on.
  drawFoldedDescription: (description) => (
    <DialogDescription className="sr-only">{description}</DialogDescription>
  ),
  drawParts: ({
    headerSlot,
    contentSlot,
    contentClassName,
    footerSlot,
    footerClassName,
    wrapperSlot,
  }) => {
    const chassis = (
      <HeaderContentFooter
        scroll
        className={CHASSIS}
        headerSlot={headerSlot}
        // Four pixels of room either side, given back as padding: a focus ring is drawn outside
        // the element that owns it, and a scroll container clips at its edge.
        contentClassName={cn("-mx-1 min-w-0 px-1", contentClassName)}
        contentSlot={contentSlot}
        footerSlot={
          hasSlot(footerSlot) ? (
            <DialogFooter className={footerClassName}>{footerSlot}</DialogFooter>
          ) : null
        }
      />
    );
    return wrapperSlot ? wrapperSlot(chassis, { className: WRAPPER }) : chassis;
  },
};

export type DialogLayoutProps = {
  /** The body. It is the only part that scrolls. */
  contentSlot: SlotNode;
  /**
   * Required, because a dialog without a title is one no screen reader can announce. A dialog
   * whose design has no room for a heading passes `hideTitle` and keeps this.
   */
  title: ReactNode;
  /** Read to the same people the title is. Absent, the dialog is described by its body. */
  description?: ReactNode | undefined;
  /**
   * Where the description is drawn. `inline` (the default) puts it under the title; `popover`
   * puts it behind a small button after the title, named "About <title>", and on the web the
   * dialog is still described by it. It stays inline on a dialog with no body and no footer,
   * where the description is all the dialog says. `CardLayout`'s prop, passed to the card on the
   * panel.
   */
  descriptionPlacement?: DescriptionPlacement | undefined;
  /** The `popover` button's glyph. A question mark by default. */
  descriptionIconSlot?: SlotNode | undefined;
  /** Keeps the title for assistive technology and takes it off the screen. */
  hideTitle?: boolean | undefined;
  /**
   * Sits before the title. On the web it is sized to the text — pass a bare `<Plus />`. On device
   * an icon cannot be sized from outside it, so pass it at the size you want.
   */
  iconSlot?: SlotNode | undefined;
  /** The header's far end, clear of the close button: a menu, a status badge, a switch. */
  actionSlot?: SlotNode | undefined;
  /**
   * Where the action goes when the title and the action do not both fit on one line. `wrap` (the
   * default) moves the action under the title; `inline` keeps it beside the title and cuts the
   * title short with an ellipsis instead. `CardLayout`'s prop, passed to the card on the panel.
   */
  actionPlacement?: ActionPlacement | undefined;
  /**
   * Shown instead of `contentSlot` when there is nothing in it: no element, or a `List` with no
   * rows — `CardLayout`'s rule.
   */
  emptySlot?: SlotNode | undefined;
  /**
   * Whether the body is still being fetched. On, a skeleton stands in for it and `emptySlot` is
   * not consulted. The title and the footer stay.
   */
  loading?: boolean | undefined;
  /**
   * What opens it, wrapped in `DialogTrigger asChild` — pass a `<Button>`, not a bare string.
   * With a trigger and no `open`, the dialog owns its own state and the caller holds none.
   */
  triggerSlot?: SlotNode | undefined;
  /** Controlled open state. Omit both this and `onOpenChange` to let the trigger drive it. */
  open?: boolean | undefined;
  /**
   * Called with `true` when the trigger opens it and `false` when it closes. A close that
   * `hasUnsavedChanges` asks about is reported only once the answer is Discard. With `open`, this
   * is where the caller sets it.
   */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * How wide the dialog is from the `sm` breakpoint up: `sm` 24rem, `md` 32rem, `lg` 42rem, `xl`
   * 56rem, and `full` the window less 16px a side. Narrower than that, every size is as wide as the
   * screen less the same 16px a side.
   */
  size?: keyof typeof SIZES | undefined;
  /**
   * The footer's start. A destructive action, or a word on why the confirm is refusing. Several
   * elements sit together in one row with a small gap; `footerActionsSlot` stays at the far end.
   */
  footerSlot?: SlotNode | undefined;
  /**
   * The footer's end. Cancel and confirm, as a fragment: below `sm` they stack full width, the
   * last on top. Given alone, the footer is simply right-aligned.
   *
   * Pass a **function** to get the dialog's own close, guarded the same way Escape and the
   * overlay are. A Cancel wired to the caller's `setOpen(false)` goes around the shell entirely,
   * and `hasUnsavedChanges` then covers three of the four ways out — the fourth being the one
   * people click. Taking `close` from here is the same close the other three doors use, so
   * unsaved work asks on the way through it too.
   *
   * ```tsx
   * footerActionsSlot={(close) => (
   *   <>
   *     <Button variant="outline" onClick={close} content="Cancel" />
   *     <Button onClick={save} content="Save" />
   *   </>
   * )}
   * ```
   *
   * Only this slot takes the function. `footerSlot` is the other end — a destructive action, or a
   * word on why the confirm is refusing — and nothing there closes the dialog on the way out.
   */
  footerActionsSlot?: SlotNode | ((close: () => void) => SlotNode) | undefined;
  /**
   * Wraps the header, the body and the footer together, inside the dialog. Its use is a form:
   * with the fields and the submit button under one `<form>`, Enter in a field submits it and the
   * footer's submit button is a real one. A `<form>` around the body alone leaves the button
   * outside it, where the browser does not count it, and Enter in a form of two fields does
   * nothing.
   *
   * A function of the parts, called rather than mounted, so the fields inside it keep their
   * state from one render to the next — a component written inline here would be a new type
   * every render, and React would rebuild everything under it. The element it returns takes
   * `className`, which keeps the body scrolling under a header and above a footer that do not.
   *
   * ```tsx
   * wrapperSlot={(parts, { className }) => (
   *   <form.AppForm>
   *     <FormElement onSubmit={() => form.handleSubmit()} className={className}>
   *       {parts}
   *     </FormElement>
   *   </form.AppForm>
   * )}
   * ```
   */
  wrapperSlot?: ((parts: SlotNode, wrapper: { className: string }) => SlotNode) | undefined;
  /**
   * Whether Escape and a click on the overlay close it. Off refuses to leave; prefer
   * `hasUnsavedChanges`, which asks on the way out instead.
   */
  dismissible?: boolean | undefined;
  /**
   * There is work in the body that closing would throw away. Escape, a click on the overlay, the
   * close button and a `footerActionsSlot` Cancel then ask first, and the dialog stays open if the
   * answer is no.
   *
   * Asked for, never computed — only the caller knows what its fields are.
   *
   * **Pass a function when the answer is not something you render.** The question is asked once,
   * at a click: nothing here draws the answer, there is no dirty dot and no Save reading off it.
   * A boolean makes the caller maintain, in render, a value only a handler consumes — which for
   * a TanStack form means `useStore(form.store, …)` and a re-render on the transition to keep a
   * boolean this looks at once, and for work that is *not* a form field means lifting a knowable
   * fact into state as a second source of truth. The thunk runs at the click, so neither is
   * needed:
   *
   * ```tsx
   * hasUnsavedChanges={() => !form.state.isDefaultValue || picker.hasEdits()}
   * ```
   *
   * `isDefaultValue` and not `isDirty`, when it is a form. `isDirty` stays true for a field
   * typed into and then typed back out of, so the dialog asks whether to throw away changes to a
   * form identical to how it opened.
   */
  hasUnsavedChanges?: boolean | (() => boolean) | undefined;
  /**
   * The question that asks: "Discard your changes?". Defaulted, because this one really is the
   * same everywhere.
   */
  discardTitle?: ReactNode | undefined;
  /** The line under it: "What you have typed here will not be saved." */
  discardDescription?: ReactNode | undefined;
  /** The verb that throws the work away: "Discard". */
  discardLabel?: ReactNode | undefined;
  /** The verb that goes back to it: "Keep editing". Also what Escape answers. */
  keepLabel?: ReactNode | undefined;
  /**
   * Whether the ✕ is drawn in the corner. It closes the way Escape does, so `hasUnsavedChanges`
   * still asks first. Turn it off only when the footer has a way out of its own, such as a Cancel.
   */
  showCloseButton?: boolean | undefined;
  /** On the dialog's panel. Its width comes from `size`, so reach for this for anything else. */
  className?: string | undefined;
  /** On the header: the title, the description, and the room the ✕ takes. */
  headerClassName?: string | undefined;
  /** On the body, the part that scrolls between the header and the footer. */
  contentClassName?: string | undefined;
  /** On the footer, which holds `footerSlot` and the actions. */
  footerClassName?: string | undefined;
};

/**
 * A dialog with its slots already placed, and a body that scrolls under a header and above a
 * footer that do not. The parts are a {@link CardLayout} on the dialog's panel: the panel draws
 * the border, fill, shadow and inset, and the card draws no surface of its own.
 *
 * `hasUnsavedChanges` is a prop and not a hook, because a hook is a thing a caller can forget to
 * wire into closing. Padding stays with `DialogContent`, which differs between shadcn styles, so
 * this overrides only `display` and `overflow`.
 */
export function DialogLayout({
  contentSlot,
  title,
  description,
  descriptionPlacement = "inline",
  descriptionIconSlot,
  hideTitle = false,
  iconSlot,
  actionSlot,
  actionPlacement = "wrap",
  emptySlot,
  loading = false,
  triggerSlot,
  open,
  onOpenChange,
  size = "md",
  footerSlot,
  footerActionsSlot,
  wrapperSlot,
  dismissible = true,
  hasUnsavedChanges = false,
  discardTitle = DISCARD_QUESTION.title,
  discardDescription = DISCARD_QUESTION.description,
  discardLabel = DISCARD_QUESTION.discardLabel,
  keepLabel = DISCARD_QUESTION.keepLabel,
  showCloseButton = true,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: DialogLayoutProps) {
  const stop = dismissible ? undefined : (event: Event) => event.preventDefault();

  // Radix is handed an `open` either way, so one `requestClose` covers Escape, the overlay and
  // the close button alike. Uncontrolled, the state simply lives here instead of in the
  // primitive; a caller who passes `open` still owns it, and still hears every change.
  const [selfOpen, setSelfOpen] = useState(false);
  const isOpen = open ?? selfOpen;

  const setOpenState = (next: boolean) => {
    if (open === undefined) {
      setSelfOpen(next);
    }
    onOpenChange?.(next);
  };

  const [askingToDiscard, setAskingToDiscard] = useState(false);

  const requestOpenChange = (next: boolean) => {
    // Evaluated here and nowhere else, which is the whole of what the function form buys: it runs
    // on the paths that can close and never during a render, so a caller can read a store or ask
    // a child without subscribing to either.
    const unsaved =
      typeof hasUnsavedChanges === "function" ? hasUnsavedChanges() : hasUnsavedChanges;
    if (next === false && unsaved) {
      setAskingToDiscard(true);
      return;
    }
    setOpenState(next);
  };

  const closeFromFooter = () => requestOpenChange(false);

  const discard = () => {
    setAskingToDiscard(false);
    setOpenState(false);
  };

  // The same close Escape, the overlay and the close button go through, handed to the footer so
  // a Cancel there is guarded by the thing that guards them.
  const actions =
    typeof footerActionsSlot === "function"
      ? footerActionsSlot(closeFromFooter)
      : footerActionsSlot;

  // The card draws on the panel: `DialogContent` is the surface, and the card's parts sit at its
  // inset. A function `footerActionsSlot` that returns nothing leaves the card with no footer.
  const card = (
    <FloatingSurfaceContext.Provider value={DIALOG_SURFACE}>
      <CardLayout
        title={title}
        description={description}
        descriptionPlacement={descriptionPlacement}
        descriptionIconSlot={descriptionIconSlot}
        iconSlot={iconSlot}
        actionSlot={actionSlot}
        actionPlacement={actionPlacement}
        contentSlot={contentSlot}
        emptySlot={emptySlot}
        loading={loading}
        footerSlot={footerSlot}
        footerActionsSlot={actions}
        wrapperSlot={wrapperSlot}
        // The close button is positioned against the dialog, not the header, so a long title or
        // a header action runs under it without this.
        headerClassName={cn(showCloseButton && "pr-6", headerClassName)}
        titleClassName={cn(hideTitle && SR_ONLY)}
        contentClassName={contentClassName}
        footerClassName={footerClassName}
      />
    </FloatingSurfaceContext.Provider>
  );

  // ConfirmDialog holds the overlay click (it does not answer "discard?") and puts the safe
  // answer first, where focus lands. The labels are passed: its own defaults are Confirm/Cancel.
  const discardQuestion = (
    <ConfirmDialog
      open={askingToDiscard}
      onOpenChange={setAskingToDiscard}
      title={discardTitle}
      description={discardDescription}
      confirmLabel={discardLabel}
      cancelLabel={keepLabel}
      onConfirm={discard}
    />
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={requestOpenChange}>
        {triggerSlot ? <DialogTrigger asChild>{triggerSlot}</DialogTrigger> : null}

        <DialogContent
          showCloseButton={showCloseButton}
          onEscapeKeyDown={stop}
          onInteractOutside={stop}
          // Radix warns when nothing describes the content. Without a description that is the
          // intent, and an explicit `undefined` is how it is said — spread only in that case,
          // because the prop is applied after the primitive's own and would unlink a real one.
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(COLUMN, SIZES[size], className)}
        >
          {/* Inside `DialogContent`, so a wrapper is in the dialog's focus trap and under its
              role, and the close button stays outside it. */}
          {card}

          {/* On device the question is a `Modal` presented over this one, and iOS presents a
              second modal only from inside the first. */}
          {null}
        </DialogContent>
      </Dialog>

      {/* On the web, a sibling of the dialog rather than a child of it: two modals nested in the
          DOM fight over the focus trap, and the question has to be able to take focus from the
          form it is about. */}
      {discardQuestion}
    </>
  );
}
