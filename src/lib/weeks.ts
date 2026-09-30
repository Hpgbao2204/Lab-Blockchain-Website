/** Date helpers for the weekly task board. Dates are plain `YYYY-MM-DD` strings (no time zone). */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(d: string, n: number): string {
  const x = toDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return toISODate(x);
}

/** Monday of the week containing `d`. */
export function weekStart(d: string): string {
  const day = toDate(d).getUTCDay(); // 0 = Sunday
  return addDays(d, -((day + 6) % 7));
}

export type WeekBucket = "overdue" | "this-week" | "next-week" | "later" | "done";

export function bucketFor(task: { dueDate: string; status: string }, today: string): WeekBucket {
  if (task.status === "done") return "done";
  if (task.dueDate < today) return "overdue";
  const start = weekStart(today);
  if (task.dueDate < addDays(start, 7)) return "this-week";
  if (task.dueDate < addDays(start, 14)) return "next-week";
  return "later";
}

export const BUCKET_LABEL: Record<WeekBucket, string> = {
  overdue: "Overdue",
  "this-week": "This week",
  "next-week": "Next week",
  later: "Later",
  done: "Done",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `Mon 5 Oct` (hand-rolled, see `formatStamp`). */
export function formatDay(d: string): string {
  const x = toDate(d);
  return `${DAYS[x.getUTCDay()]} ${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
}

/** Today in the lab's time zone (Asia/Ho_Chi_Minh), as YYYY-MM-DD. */
export function labToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}


/** `30 Sep 2026, 19:40` in Vietnam time (UTC+7, no DST). Hand-rolled so server and browser render identical text. */
export function formatStamp(iso: string | Date): string {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
