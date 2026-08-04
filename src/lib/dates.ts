// Booking dates are calendar dates ("YYYY-MM-DD") with no meaningful time
// component. Always parse/compare them as UTC midnight so day-boundary
// math doesn't drift by a day in timezones behind UTC.

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dateOnlyUTC(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function dayRangeUTC(dateStr: string) {
  const gte = dateOnlyUTC(dateStr);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

export function addDaysISO(dateStr: string, delta: number) {
  const d = dateOnlyUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function firstOfMonthISO(dateStr: string) {
  const d = dateOnlyUTC(dateStr);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

export function formatDayLabel(dateStr: string) {
  const d = dateOnlyUTC(dateStr);
  const diffDays = Math.round(
    (d.getTime() - dateOnlyUTC(todayISO()).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function currentMonthISO() {
  return todayISO().slice(0, 7);
}

/** "YYYY-MM" -> first/last calendar day of that month, as "YYYY-MM-DD". */
export function monthRange(monthStr: string) {
  const dateFrom = `${monthStr}-01`;
  const d = dateOnlyUTC(dateFrom);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0); // last day of the target month
  const dateTo = d.toISOString().slice(0, 10);
  return { dateFrom, dateTo };
}

export function addMonthsISO(monthStr: string, delta: number) {
  const d = dateOnlyUTC(`${monthStr}-01`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

export function monthLabel(monthStr: string) {
  const d = dateOnlyUTC(`${monthStr}-01`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}
