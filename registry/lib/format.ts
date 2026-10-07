/**
 * How a number, a size, a span of time and a date are written for a person to read.
 *
 * Every app here kept a `lib/format.ts` of its own, and the copies had drifted: one `formatBytes`
 * stopped at MB and another went on to GB, one `formatCount` took a noun and another did not.
 * These are those helpers once. They are plain functions over `Intl`, with no dependency, so the
 * same file serves a web app and a device.
 */

/** A moment: an ISO string, epoch milliseconds, or a `Date`. */
export type Moment = string | number | Date;

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

/**
 * A size in bytes as `512 B`, `1.5 KB`, `3.0 MB`, `2.1 GB`.
 *
 * A step is 1024, and a size from a kilobyte up carries one decimal place. Sizes past the last
 * unit stay in it — `2048.0 GB` — and do not grow a unit nobody asked for.
 */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[unit]}`;
}

/**
 * A count with its thousands grouped, and its noun when one is given: `1,204`, `1 file`,
 * `3 files`, `2 entries`.
 *
 * @param one - The noun for exactly one. Left out, the number is returned alone.
 * @param many - The noun for any other count, when adding an `s` is not it.
 */
export function formatCount(count: number, one?: string, many = `${one}s`): string {
  const number = count.toLocaleString();
  return one === undefined ? number : `${number} ${count === 1 ? one : many}`;
}

/**
 * The facts under a title as one line: `1 file · 2 chunks · human-only`.
 *
 * A part that is empty, `false`, `null` or `undefined` is left out, so a fact that only sometimes
 * applies is written inline — `joinStats(formatCount(files, "file"), locked && "human-only")` —
 * and no dot is left hanging where it would have been.
 */
export function joinStats(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/**
 * A span of seconds at the grain a reader wants: `42s`, `5m`, `3h 12m`, `2d 4h`.
 *
 * Seconds and minutes stand alone; from an hour up the next unit down rides along, because
 * `3h` could be anything up to an hour out.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** The moment in epoch milliseconds, or nothing when it does not parse. */
function milliseconds(moment: Moment): number | undefined {
  const time = new Date(moment).getTime();
  return Number.isNaN(time) ? undefined : time;
}

/**
 * A medium-length date in the reader's own locale — `Oct 3, 2026` — or an empty string when the
 * moment does not parse, so a missing timestamp draws nothing where `Invalid Date` would show.
 */
export function formatDate(moment: Moment): string {
  const time = milliseconds(moment);
  if (time === undefined) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(time);
}

/**
 * A medium date and a short time in the reader's own locale — `Oct 3, 2026, 2:32 PM` — for the
 * place where two things arrived on the same day and the hour is what tells them apart. Empty for
 * a moment that does not parse, as in {@link formatDate}.
 */
export function formatDateTime(moment: Moment): string {
  const time = milliseconds(moment);
  if (time === undefined) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    time,
  );
}

/**
 * The units `formatAgo` counts in, largest first, each with its length in seconds and the letters
 * the narrow English fallback writes it with.
 */
const AGO_STEPS = [
  ["year", 365 * 24 * 3600, "y"],
  ["month", 30 * 24 * 3600, "mo"],
  ["week", 7 * 24 * 3600, "w"],
  ["day", 24 * 3600, "d"],
  ["hour", 3600, "h"],
  ["minute", 60, "m"],
] as const;

export type FormatAgoOptions = {
  /**
   * `long`, the default, writes `5 minutes ago`. `narrow` writes `5m ago`, for a column where the
   * time is one fact among several.
   */
  style?: "long" | "narrow" | undefined;
};

/**
 * How long ago a moment was, in its largest whole unit: `3 days ago`, `yesterday`, `just now`
 * under a minute. A moment still to come reads `in 2 hours`, and one that does not parse is an
 * empty string, as in {@link formatDate}.
 *
 * @param now - The moment to count from, for a caller that ticks its own clock.
 * @param options.style - `narrow` writes `5m ago`, `3d ago`, `in 2h` for a dense column.
 */
export function formatAgo(
  moment: Moment,
  now: Moment = Date.now(),
  { style = "long" }: FormatAgoOptions = {},
): string {
  const then = milliseconds(moment);
  const from = milliseconds(now);
  if (then === undefined || from === undefined) return "";

  const seconds = Math.round((then - from) / 1000);
  for (const [unit, size, letters] of AGO_STEPS) {
    if (Math.abs(seconds) < size) continue;
    const amount = Math.round(seconds / size);
    // Hermes ships `Intl` without `RelativeTimeFormat` on some devices, and a missing
    // constructor would take the screen down with it. English is the fallback there.
    if (typeof Intl.RelativeTimeFormat !== "function") {
      const count = Math.abs(amount);
      const span = style === "narrow" ? `${count}${letters}` : formatCount(count, unit);
      return amount < 0 ? `${span} ago` : `in ${span}`;
    }
    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style }).format(amount, unit);
  }
  return "just now";
}
