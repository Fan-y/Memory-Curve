import { describe, expect, it } from "vitest";

import {
  addDays,
  endOfDay,
  formatMinutes,
  formatMonthLabel,
  startOfDay,
  toDateKey,
} from "@/lib/dates";

describe("dates utilities", () => {
  it("formats date keys consistently", () => {
    const date = new Date("2026-06-03T12:30:15.000Z");
    expect(toDateKey(date)).toBe("2026-06-03");
  });

  it("normalizes start and end of day", () => {
    const start = startOfDay("2026-06-03T15:12:33.100Z");
    const end = endOfDay("2026-06-03T15:12:33.100Z");

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });

  it("supports date arithmetic and formatting", () => {
    const base = new Date("2026-06-03T00:00:00.000Z");
    const shifted = addDays(base, 5);

    expect(toDateKey(shifted)).toBe("2026-06-08");
    expect(formatMonthLabel(new Date("2026-11-01T00:00:00.000Z"))).toBe("2026-11");
    expect(formatMinutes(90000)).toBe("1.5 分钟");
  });
});
