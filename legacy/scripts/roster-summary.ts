import { parseRoster, type Grid } from "../src/features/imports/parseSheet";

/** Only aggregate buckets leave this helper; input values never become arbitrary output keys. */
export function summarizeRoster(grid: Grid, on = new Date()) {
  const result = parseRoster(grid, on);
  const summary = {
    valid: result.valid.length, invalid: result.invalid.length, duplicates: result.duplicates.length,
    warnings: result.warnings, invalidReasons: {} as Record<string, number>,
    students: 0, facultyAndStaff: 0,
    byBatch: {} as Record<string, number>, bySemester: {} as Record<string, number>,
    bySection: {} as Record<string, number>, byRole: {} as Record<string, number>,
  };
  const add = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };
  for (const invalid of result.invalid) add(summary.invalidReasons, invalid.reason);
  for (const row of result.valid) {
    if (row.role === "student") {
      summary.students++;
      add(summary.byBatch, /^\d{4}\s*[-–]\s*\d{2,4}$/.test(row.batch ?? "") ? row.batch!.replace(/\s/g, "") : "Unknown");
      add(summary.bySemester, row.semester ? String(row.semester) : "Unknown");
      add(summary.bySection, /^[A-Z]$/.test(row.section ?? "") ? row.section! : "Other");
    } else {
      summary.facultyAndStaff++;
      add(summary.byRole, row.role);
    }
  }
  return summary;
}
