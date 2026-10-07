import { describe, expect, it, vi } from "vitest";
import {
  formatAgo,
  formatBytes,
  formatCount,
  formatDate,
  formatDateTime,
  formatDuration,
  joinStats,
} from "./format";

describe("formatBytes", () => {
  it("counts whole bytes below a kilobyte", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("gives one decimal place from a kilobyte up", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 ** 2)).toBe("1.0 MB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
  });

  it("stays in gigabytes past the last unit", () => {
    expect(formatBytes(2048 * 1024 ** 3)).toBe("2048.0 GB");
  });
});

describe("formatCount", () => {
  it("groups thousands, and returns the number alone without a noun", () => {
    expect(formatCount(12)).toBe("12");
    expect(formatCount(1204)).toBe((1204).toLocaleString());
  });

  it("uses the singular for exactly one", () => {
    expect(formatCount(1, "file")).toBe("1 file");
    expect(formatCount(0, "file")).toBe("0 files");
    expect(formatCount(3, "file")).toBe("3 files");
  });

  it("takes a plural that is not the noun with an s", () => {
    expect(formatCount(1, "entry", "entries")).toBe("1 entry");
    expect(formatCount(2, "entry", "entries")).toBe("2 entries");
  });
});

describe("joinStats", () => {
  it("joins the parts with a middle dot", () => {
    expect(joinStats("1 file", "2 chunks", "human-only")).toBe("1 file · 2 chunks · human-only");
  });

  it("leaves out a part that is empty or not there", () => {
    expect(joinStats("1 file", "", false, null, undefined, "human-only")).toBe(
      "1 file · human-only",
    );
  });

  it("is one part alone, or nothing, without a dot", () => {
    expect(joinStats("1 file")).toBe("1 file");
    expect(joinStats()).toBe("");
    expect(joinStats(false, "")).toBe("");
  });
});

describe("formatDuration", () => {
  it("gives seconds alone under a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(59.9)).toBe("59s");
  });

  it("gives minutes alone under an hour", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(3599)).toBe("59m");
  });

  it("gives the two largest units from an hour up", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3 * 3600 + 12 * 60)).toBe("3h 12m");
    expect(formatDuration(2 * 86_400 + 4 * 3600 + 59 * 60)).toBe("2d 4h");
  });
});

describe("formatDate", () => {
  const moment = new Date(2026, 9, 3, 12);
  const medium = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(moment);

  it("takes a string, a number or a Date", () => {
    expect(formatDate(moment)).toBe(medium);
    expect(formatDate(moment.getTime())).toBe(medium);
    expect(formatDate(moment.toISOString())).toBe(medium);
  });

  it("is empty for a moment that does not parse", () => {
    expect(formatDate("not a date")).toBe("");
    expect(formatDate(Number.NaN)).toBe("");
  });
});

describe("formatDateTime", () => {
  const moment = new Date(2026, 9, 3, 14, 32);
  const expected = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(moment);

  it("carries the time of day beside the date", () => {
    expect(formatDateTime(moment)).toBe(expected);
    expect(formatDateTime(moment.toISOString())).toBe(expected);
    expect(formatDateTime(moment)).not.toBe(formatDate(moment));
    expect(formatDateTime(moment)).toContain("32");
  });

  it("is empty for a moment that does not parse", () => {
    expect(formatDateTime("not a date")).toBe("");
  });
});

describe("formatAgo", () => {
  const now = new Date(2026, 9, 3, 12).getTime();
  const ago = (seconds: number) => formatAgo(now - seconds * 1000, now);
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  it("is just now under a minute", () => {
    expect(ago(0)).toBe("just now");
    expect(ago(59)).toBe("just now");
  });

  it("counts in the largest whole unit", () => {
    expect(ago(60)).toBe(relative.format(-1, "minute"));
    expect(ago(3 * 3600)).toBe(relative.format(-3, "hour"));
    expect(ago(3 * 86_400)).toBe(relative.format(-3, "day"));
    expect(ago(14 * 86_400)).toBe(relative.format(-2, "week"));
  });

  it("reads forwards for a moment still to come", () => {
    expect(formatAgo(now + 2 * 3600 * 1000, now)).toBe(relative.format(2, "hour"));
  });

  it("is empty for a moment that does not parse", () => {
    expect(formatAgo("not a date", now)).toBe("");
  });

  it("writes the narrow form when asked, and the long one otherwise", () => {
    const narrow = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "narrow" });
    const short = (seconds: number) => formatAgo(now - seconds * 1000, now, { style: "narrow" });
    expect(short(5 * 60)).toBe(narrow.format(-5, "minute"));
    expect(short(3 * 86_400)).toBe(narrow.format(-3, "day"));
    expect(short(59)).toBe("just now");
    expect(formatAgo(now - 5 * 60 * 1000, now, { style: "long" })).toBe(ago(5 * 60));
    expect(formatAgo(now - 5 * 60 * 1000, now, {})).toBe(ago(5 * 60));
  });

  it("falls back to English where the runtime has no RelativeTimeFormat", () => {
    vi.stubGlobal("Intl", {});
    try {
      expect(ago(3 * 86_400)).toBe("3 days ago");
      expect(ago(3600)).toBe("1 hour ago");
      expect(formatAgo(now + 2 * 3600 * 1000, now)).toBe("in 2 hours");
      expect(formatAgo(now - 5 * 60 * 1000, now, { style: "narrow" })).toBe("5m ago");
      expect(formatAgo(now - 90 * 86_400 * 1000, now, { style: "narrow" })).toBe("3mo ago");
      expect(formatAgo(now + 2 * 3600 * 1000, now, { style: "narrow" })).toBe("in 2h");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
