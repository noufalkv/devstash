import { describe, expect, it } from "vitest";

import { formatDate } from "@/lib/format-date";

const date = new Date("2026-10-31T12:00:00Z");

describe("formatDate", () => {
  it("formats the short style without a year", () => {
    expect(formatDate(date, "short")).toBe("Oct 31");
  });

  it("formats the medium style with an abbreviated month and year", () => {
    expect(formatDate(date, "medium")).toBe("Oct 31, 2026");
  });

  it("formats the long style with the full month name", () => {
    expect(formatDate(date, "long")).toBe("October 31, 2026");
  });

  it("accepts an ISO string", () => {
    expect(formatDate("2026-10-31T12:00:00Z", "long")).toBe("October 31, 2026");
  });

  it("uses UTC rather than the local time zone", () => {
    expect(formatDate("2026-10-31T23:30:00Z", "short")).toBe("Oct 31");
    expect(formatDate("2026-11-01T00:30:00Z", "short")).toBe("Nov 1");
  });
});
