/**
 * Every text colour clears WCAG AA, 4.5:1, on the surface it is drawn on — in every palette.
 *
 * A palette is a set of tokens someone picked by eye from an editor theme, and the colours that
 * look like the theme are not always the ones that can be read: Monokai's own comment grey is
 * 3.3:1 on its background. So the pairs a component actually draws are measured here, from the
 * sRGB each token becomes on device, rather than trusted.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { dark, light, palettes } from "../tokens/palette.mjs";
import { closestToFixed, fitSeries, SERIES, STATUS_TOKENS } from "../tokens/series.mjs";
import { closestPair, toRgb } from "./oklch.mjs";

/** The two surfaces anything is drawn on: the page, and a card or popover raised off it. */
const SURFACES = ["background", "secondary"];

/** The fills a filled button or badge draws, each with its `-foreground` text. */
const FILLS = ["neutral", "active", "positive", "warning", "info", "negative"];

/** The colours that are also drawn as text: a link, an error, an outline button's label, today. */
const INKS = ["active", "positive", "warning", "info", "negative"];

/**
 * Text on the surface it sits on — the pairs the components draw. A third entry is the opacity
 * the text is drawn at: secondary text is `text-foreground/60`, not a colour of its own.
 *
 * A surface is a token, or a stack of `[token, opacity]` layers from the bottom up, for a fill
 * drawn at an opacity over what is under it: a tint, a chosen row, a fill under the pointer.
 */
const PAIRS = [
  ["foreground", "background"],
  ["foreground", "secondary"],
  ["foreground", "background", 0.6],
  ["foreground", "secondary", 0.6],
  ["foreground", "hover", 0.6],
  ["foreground", "hover"],
  // A link in a row under the pointer.
  ["info", "hover"],
  // `MarkdownCodeEditor`'s syntax on the caret's line, which is `hover`: a link and code are
  // `info` (above), a string `positive`, and markup and comments `/60` (above) (#471).
  ["positive", "hover"],
  ...FILLS.flatMap((fill) => [
    [`${fill}-foreground`, fill],
    // `hover:bg-neutral/90` and the rest: the fill under the pointer, and a focused one.
    ...SURFACES.map((surface) => [
      `${fill}-foreground`,
      [
        [surface, 1],
        [fill, 0.9],
      ],
    ]),
  ]),
  ...INKS.flatMap((ink) => SURFACES.map((surface) => [ink, surface])),
  // An outline button under the pointer, and a highlighted destructive menu row: the colour as
  // text on its own `/10` tint.
  ...["positive", "warning", "info", "negative"].flatMap((ink) =>
    SURFACES.map((surface) => [
      ink,
      [
        [surface, 1],
        [ink, 0.1],
      ],
    ]),
  ),
  // A chosen thing's text — a row, a tab, a pill, a sidebar place, a toggle chip — on its
  // `bg-active/40` tint, and on `bg-active/60` under the pointer or focused. Its secondary text
  // turns `foreground` when chosen, because `/60` does not clear 4.5:1 there.
  ...[0.4, 0.6].flatMap((tint) =>
    SURFACES.map((surface) => [
      "foreground",
      [
        [surface, 1],
        ["active", tint],
      ],
    ]),
  ),
];

/**
 * Pairs below 4.5:1 that are kept, each at the ratio it has now, so this can hold them where they
 * are without letting them slip further.
 */
const KNOWN = {};

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (rgb) => {
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** `top` at `alpha` over the sRGB `under`, blended as a compositor does. */
const blend = (under, top, alpha) => toRgb(top).map((c, i) => c * alpha + under[i] * (1 - alpha));

/** A surface's sRGB: a token, or a stack of `[token, opacity]` layers from the bottom up. */
const surfaceRgb = (map, surface) =>
  typeof surface === "string"
    ? toRgb(map[surface])
    : surface.reduce((under, [token, alpha]) => blend(under, map[token], alpha), [0, 0, 0]);

/** The name a surface goes by in a failure message and a `KNOWN` key. */
const surfaceName = (surface) =>
  typeof surface === "string"
    ? surface
    : surface.map(([token, alpha]) => (alpha === 1 ? token : `${token}@${alpha}`)).join("+");

/** The contrast of `text` at `alpha` over the sRGB `under`. */
const ratio = (text, under, alpha = 1) => {
  const over = blend(under, text, alpha);
  const [hi, lo] = [luminance(over), luminance(under)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const sets = [
  ["default light", light],
  ["default dark", dark],
  ...Object.entries(palettes).flatMap(([name, modes]) =>
    Object.entries(modes).map(([mode, map]) => [`${name} ${mode}`, map]),
  ),
];

/**
 * A control's edge — `border-foreground/50` on an input, a checkbox, a radio, a select, and the
 * unchecked switch's track — is what says a control is there, so it needs 3:1 against the surface
 * it sits on (WCAG 1.4.11).
 */
const EDGE_ALPHA = 0.5;
const EDGE_SURFACES = ["background", "secondary", "hover"];

for (const [set, map] of sets) {
  test(`${set}: a control's edge is 3:1 or better`, () => {
    const short = EDGE_SURFACES.flatMap((surface) => {
      const r = Math.round(ratio(map.foreground, toRgb(map[surface]), EDGE_ALPHA) * 100) / 100;
      return r < 3 ? [`edge on ${surface}: ${r.toFixed(2)}:1, needs 3`] : [];
    });
    assert.deepEqual(short, []);
  });
}

for (const [set, map] of sets) {
  test(`${set}: every text pair is 4.5:1 or better`, () => {
    const short = PAIRS.flatMap(([text, surface, alpha]) => {
      const name = surfaceName(surface);
      const key = `${set} ${text}${alpha ? `@${alpha}` : ""}/${name}`;
      const r = Math.round(ratio(map[text], surfaceRgb(map, surface), alpha) * 100) / 100;
      const floor = KNOWN[key] ?? 4.5;
      return r < floor ? [`${text} on ${name}: ${r.toFixed(2)}:1, needs ${floor}`] : [];
    });
    assert.deepEqual(short, []);
  });
}

test("the known exceptions are still exceptions", () => {
  // One that has been fixed should leave the list, or it would excuse a later regression.
  for (const [key, floor] of Object.entries(KNOWN)) {
    const [name, mode, pair] = key.split(" ");
    const [text, surface] = pair.split("/");
    const map = name === "default" ? { light, dark }[mode] : palettes[name][mode];
    assert.ok(ratio(map[text], toRgb(map[surface])) < 4.5, `${key} passes now; drop it from KNOWN`);
    assert.ok(floor < 4.5);
  }
});

/**
 * A chosen thing (`bg-active/40`), a chosen thing under the pointer or focused (`bg-active/60`) and
 * an unchosen thing under the pointer or focused (`bg-hover`) are three states, and none should
 * read as another. Not a contrast floor WCAG sets, so the bar is the one the default palette was
 * tuned to: each pair of fills 1.3:1 apart on the surfaces a chosen thing sits on. The first pair is
 * chosen against hovered, the third the pointer's step against the rest.
 */
const STATE_APART = 1.3;
for (const [set, map] of sets) {
  test(`${set}: a chosen thing, hovered or not, is apart from a hovered one`, () => {
    const close = SURFACES.flatMap((surface) => {
      const tint = (alpha) =>
        surfaceRgb(map, [
          [surface, 1],
          ["active", alpha],
        ]);
      const states = {
        chosen: tint(0.4),
        "chosen and hovered": tint(0.6),
        hovered: toRgb(map.hover),
      };
      const pairs = [
        ["chosen", "hovered"],
        ["chosen and hovered", "hovered"],
        ["chosen", "chosen and hovered"],
      ];
      return pairs.flatMap(([a, b]) => {
        const [hi, lo] = [luminance(states[a]), luminance(states[b])].sort((x, y) => y - x);
        const r = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
        return r < STATE_APART
          ? [`${a} and ${b} on ${surface}: ${r.toFixed(2)}:1, needs ${STATE_APART}`]
          : [];
      });
    });
    assert.deepEqual(close, []);
  });
}

/**
 * A chosen control is tinted, so what says it is checked, on or picked is its mark: a checkbox's
 * check, a switch's thumb, a radio's dot. The mark is `foreground`, as the text on a chosen thing
 * is, and it has to be 3:1 (WCAG 1.4.11) against the tint at rest, against the `/60` step under
 * the pointer or focused, and against the surface around the control. The tint itself is not 3:1
 * from the surface, so the box, the track and the circle are edged in `active`, which has to be
 * 3:1 from the surface too.
 */
const MARK = "foreground";
const MARK_APART = 3;
for (const [set, map] of sets) {
  test(`${set}: a chosen control's mark and edge are 3:1 or more`, () => {
    const short = SURFACES.flatMap((surface) => {
      const under = {
        [surface]: toRgb(map[surface]),
        [`active@0.4 on ${surface}`]: surfaceRgb(map, [
          [surface, 1],
          ["active", 0.4],
        ]),
        [`active@0.6 on ${surface}`]: surfaceRgb(map, [
          [surface, 1],
          ["active", 0.6],
        ]),
      };
      const marks = Object.entries(under).map(([name, rgb]) => [`mark on ${name}`, map[MARK], rgb]);
      const edge = [`edge (active) on ${surface}`, map.active, toRgb(map[surface])];
      return [...marks, edge].flatMap(([name, top, rgb]) => {
        const r = Math.round(ratio(top, rgb) * 100) / 100;
        return r < MARK_APART ? [`${name}: ${r.toFixed(2)}:1, needs ${MARK_APART}`] : [];
      });
    });
    assert.deepEqual(short, []);
  });
}

/**
 * Nothing draws a focus ring: a focused thing looks hovered. An unchosen thing and a filled button
 * take `bg-hover` with `text-foreground`, so for each solid fill a control rests on, the hover fill
 * has to differ from it by 3:1 (WCAG 2.4.13's change of contrast) on the surfaces it sits on, and
 * the focused label — `foreground` on `hover` — is held at 4.5:1 by the text pairs above. `active`
 * is not one of them: nothing chosen is filled solid. A chosen thing is the `/40` tint, and focused
 * it takes the `/60` step it has under the pointer, which the state test above holds apart.
 */
const FOCUS_FILLS = FILLS.filter((fill) => fill !== "active");
const FOCUS_APART = 3;
for (const [set, map] of sets) {
  test(`${set}: a focused fill is 3:1 or more from its rest`, () => {
    const close = FOCUS_FILLS.flatMap((fill) =>
      SURFACES.flatMap((surface) => {
        const rest = surfaceRgb(map, [
          [surface, 1],
          [fill, 1],
        ]);
        const focused = toRgb(map.hover);
        const [hi, lo] = [luminance(rest), luminance(focused)].sort((x, y) => y - x);
        const r = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
        return r < FOCUS_APART ? [`${fill} on ${surface}: ${r.toFixed(2)}:1, needs 3`] : [];
      }),
    );
    assert.deepEqual(close, []);
  });
}

/**
 * An outline button has no solid fill for focus to replace, and its fill alone, `bg-hover` or a
 * colour's `/10` tint, changed 1.1-1.5:1 when it was tabbed to: every Cancel and every
 * `ConfirmButton` trigger. So its edge darkens as well, as `secondary`'s does: `outline` from
 * `foreground/50` to `/60` over `hover`, and a coloured outline from its `/50` rest to the full
 * colour over its tint. Measured on the edge, where the change is, from rest to focused.
 *
 * Neither reaches 2.4.13's 3:1, as the chosen `/60` step does not, so each family is held at the
 * change it has now rather than at a bar it cannot clear, and against the change the fill alone
 * made, which the darker edge has to beat. The focused edge itself is 3:1 from the surface.
 */
const OUTLINE_FOCUS_FLOOR = { outline: 1.4, coloured: 2.2 };
const OUTLINE_INKS = ["negative", "positive", "info"];
const contrastOf = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
for (const [set, map] of sets) {
  test(`${set}: an outline button's edge changes when focused`, () => {
    const short = SURFACES.flatMap((surface) => {
      const outline = {
        name: `outline on ${surface}`,
        floor: OUTLINE_FOCUS_FLOOR.outline,
        rest: [
          [surface, 1],
          ["background", 1],
          ["foreground", 0.5],
        ],
        focused: [
          [surface, 1],
          ["hover", 1],
          ["foreground", 0.6],
        ],
        fillOnly: [
          [surface, 1],
          ["hover", 1],
          ["foreground", 0.5],
        ],
      };
      const coloured = OUTLINE_INKS.map((ink) => ({
        name: `${ink}-outline on ${surface}`,
        floor: OUTLINE_FOCUS_FLOOR.coloured,
        rest: [
          [surface, 1],
          [ink, 0.5],
        ],
        focused: [
          [surface, 1],
          [ink, 0.1],
          [ink, 1],
        ],
        fillOnly: [
          [surface, 1],
          [ink, 0.1],
          [ink, 0.5],
        ],
      }));
      return [outline, ...coloured].flatMap(({ name, floor, rest, focused, fillOnly }) => {
        const [restRgb, focusedRgb] = [rest, focused].map((layers) => surfaceRgb(map, layers));
        const change = Math.round(contrastOf(restRgb, focusedRgb) * 100) / 100;
        const alone = Math.round(contrastOf(restRgb, surfaceRgb(map, fillOnly)) * 100) / 100;
        const edge = Math.round(contrastOf(focusedRgb, toRgb(map[surface])) * 100) / 100;
        return [
          ...(change < floor ? [`${name}: ${change.toFixed(2)}:1 from rest, needs ${floor}`] : []),
          ...(change <= alone ? [`${name}: ${change.toFixed(2)}:1, no more than the fill's`] : []),
          ...(edge < MARK_APART ? [`${name}: focused edge ${edge.toFixed(2)}:1, needs 3`] : []),
        ];
      });
    });
    assert.deepEqual(short, []);
  });
}

/**
 * The status colours have to stay apart for a reader with a colour-vision deficiency, which hue
 * alone does not do: at one lightness red and green, or red and amber, are one colour to many of
 * them. So each pair is held apart in OKLab, as each of the three deficiencies sees it as well as
 * normal vision, at the bar the chart colours are held to (`tokens/series.mjs`). 0.02 is about the
 * smallest step anyone notices.
 */
const STATUSES = STATUS_TOKENS;
const STATUS_APART = SERIES.apart;
for (const [set, map] of sets) {
  test(`${set}: the status colours are apart under every colour vision`, () => {
    const close = [];
    for (let i = 0; i < STATUSES.length; i++) {
      for (let j = i + 1; j < STATUSES.length; j++) {
        const pair = [STATUSES[i], STATUSES[j]];
        const { distance, vision } = closestPair(pair.map((name) => toRgb(map[name])));
        if (distance < STATUS_APART) {
          close.push(
            `${pair.join(" and ")}: ${distance.toFixed(3)} (${vision}), needs ${STATUS_APART}`,
          );
        }
      }
    }
    assert.deepEqual(close, []);
  });
}

/**
 * A chart's colours say nothing, so none of them may be taken for a status colour: the search in
 * `tokens/series.mjs` holds the status colours fixed and keeps away from them.
 */
for (const [set, map] of sets) {
  test(`${set}: no chart colour is close to a status colour`, () => {
    const statuses = STATUSES.map((name) => map[name]);
    const series = fitSeries(map.background, map.secondary, set.endsWith("dark"), statuses);
    const close = series.flatMap((colour, i) =>
      STATUSES.flatMap((name) => {
        const distance = closestToFixed([toRgb(colour)], [toRgb(map[name])]);
        return distance < SERIES.apartFromStatus
          ? [`series-${i + 1} and ${name}: ${distance.toFixed(3)}, needs ${SERIES.apartFromStatus}`]
          : [];
      }),
    );
    assert.deepEqual(close, []);
  });
}

/**
 * The surfaces keep the same hierarchy in every palette: a card or popover the same step off the
 * page, a highlighted row the same step further on from the card, and a chosen thing's tint the
 * same weight on what it is drawn on. Not a floor WCAG sets, so each is a band, and the light theme
 * sets its width: its page is white and a control's edge has to stay 3:1 on `hover`, which leaves
 * about 1.3:1 from the page to `hover` to share between the two steps.
 */
const STEPS = {
  "raised from the page": [1.08, 1.15],
  "hover from raised": [1.15, 1.3],
  "chosen tint from its surface": [1.7, 2.1],
};
const between = (label, r) => {
  const [lo, hi] = STEPS[label];
  const rounded = Math.round(r * 100) / 100;
  return rounded < lo || rounded > hi
    ? [`${label}: ${rounded.toFixed(2)}:1, needs ${lo}–${hi}`]
    : [];
};
for (const [set, map] of sets) {
  test(`${set}: the surfaces step as every palette's do`, () => {
    const [page, raised, hover] = ["background", "secondary", "hover"].map((t) => toRgb(map[t]));
    const contrast = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    // `hover` goes on past `secondary`, away from the page, or a highlighted row would sink into it.
    const away = Math.sign(luminance(raised) - luminance(page));
    const beyond =
      Math.sign(luminance(hover) - luminance(raised)) === away
        ? []
        : ["hover is not further from the page than raised"];
    const tints = SURFACES.flatMap((surface) =>
      between(
        "chosen tint from its surface",
        contrast(
          surfaceRgb(map, [
            [surface, 1],
            ["active", 0.4],
          ]),
          toRgb(map[surface]),
        ),
      ),
    );
    assert.deepEqual(
      [
        ...between("raised from the page", contrast(raised, page)),
        ...between("hover from raised", contrast(hover, raised)),
        ...beyond,
        ...tints,
      ],
      [],
    );
  });
}
