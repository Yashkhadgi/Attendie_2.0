/** Date helpers. All dates shown to users are DD-MM-YYYY. */

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDateDMY(input?: string | Date | null): string {
  if (!input) return "";
  if (input instanceof Date) {
    return isNaN(input.getTime())
      ? ""
      : `${pad(input.getDate())}-${pad(input.getMonth() + 1)}-${input.getFullYear()}`;
  }
  const s = String(input).trim();
  if (!s) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : formatDateDMY(d);
}

/** Today as YYYY-MM-DD in local time (for <input type="date"> and DB). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Inclusive number of days between two YYYY-MM-DD dates. */
export function daysInclusive(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}
