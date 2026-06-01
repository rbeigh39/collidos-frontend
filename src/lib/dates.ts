/** Frontend date-string helpers. Backend returns tz-correct YYYY-MM-DD strings;
 *  here we only shift and label those calendar strings. */

/** The user's "today" as YYYY-MM-DD in the given IANA timezone. */
export function todayString(timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** Add (or subtract) whole days to a YYYY-MM-DD string. */
export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Whole-day difference b - a (both YYYY-MM-DD). */
export function dayDiff(a: string, b: string): number {
  const toUTC = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/** Relative label ("Today", "Tomorrow", "Yesterday") or weekday name. */
export function relativeLabel(dateStr: string, todayStr: string): string {
  const diff = dayDiff(todayStr, dateStr);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  });
}

/** Secondary label like "Jun 2". */
export function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
