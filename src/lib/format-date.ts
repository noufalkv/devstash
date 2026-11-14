export type DateStyle = "short" | "medium" | "long";

// UTC so server and client render the same text (no hydration mismatch)
const FORMATTERS: Record<DateStyle, Intl.DateTimeFormat> = {
  short: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
  medium: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
  long: new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
};

/** Formats a date in UTC: "Oct 31" (short), "Oct 31, 2026" (medium) or "October 31, 2026" (long). */
export function formatDate(date: Date | string, style: DateStyle): string {
  return FORMATTERS[style].format(typeof date === "string" ? new Date(date) : date);
}
