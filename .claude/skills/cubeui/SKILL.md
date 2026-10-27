---
name: cubeui
description: Router to the cubeui component skill, whose text lives in skill/. Read before building a page shell, a page title block, a card, a dialog, a two-pane screen, a section heading, a form, an icon-only button, or a destructive action — on the web or in React Native.
---

# cubeui

**The skill is [skill/SKILL.md](../../../skill/SKILL.md). Read that, and the
topic files its choosing table routes to.** This file is a pointer, so that the text a consumer
copies and the text an agent reads in this repo are the same files rather than two copies that
drift.

- [skill/SKILL.md](../../../skill/SKILL.md) — which platform half you are in,
  and which component owns which shape
- [skill/vocabulary.md](../../../skill/vocabulary.md) — the slot vocabulary: what a `…Slot` prop
  takes and the words every component shares. Read it before writing a slot prop
- [skill/native.md](../../../skill/native.md) — the same choosing table for an Expo app
- [skill/install-paths.md](../../../skill/install-paths.md) — where every item lands and what
  to import from it, generated from the registry
- [skill/layout/](../../../skill/layout/index.md) — the shells, one file per group: pages,
  splits, sidebar, top bar, cards, facts, dialogs, lists, trees and tables
- [skill/forms/](../../../skill/forms/index.md) — `FormField`, `useAppForm` and the
  bound fields, and the native form
- [skill/controls/](../../../skill/controls/index.md) — the controls, one file per group:
  icons, buttons, menus, combobox, dates, code and Markdown, inputs, display, theme

Working *on* this registry rather than with it? [AGENTS.md](../../../AGENTS.md) is the one that
governs that, and [docs/component-conventions.md](../../../docs/component-conventions.md) holds
the authoring rules.
