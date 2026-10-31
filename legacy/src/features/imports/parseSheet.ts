import * as XLSX from "xlsx";

/* =====================================================================
   Low level: read any xlsx / xls / csv into a grid of strings
   ===================================================================== */

export type Grid = string[][];

/** PRNs are long numbers; Excel may hand them over as numbers. Always return clean text. */
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(0) : String(v);
  return String(v).trim();
}

export function readGridFromBuffer(buf: ArrayBuffer): Grid {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true });
  return raw
    .map((r) => r.map(cellToString))
    .filter((r) => r.some((c) => c !== ""));
}

export async function readGrid(file: File): Promise<Grid> {
  return readGridFromBuffer(await file.arrayBuffer());
}

/* =====================================================================
   Header detection (works even if the sheet has a title above the table)
   ===================================================================== */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ALIASES = {
  prn: ["prn", "prnno", "prnnumber", "rollno", "enrollmentno", "enrollment", "registrationno", "regno"],
  name: ["name", "studentname", "nameofstudent", "fullname", "facultyname", "nameoffaculty", "employeename"],
  semester: ["semester", "sem", "sems"],
  section: ["section", "sec", "div", "division"],
  email: ["email", "emailid", "mailid", "mail", "collegeemail", "officialemail"],
  loginId: ["loginid", "staffid", "employeeid", "empid", "facultyid", "empcode", "employeecode"],
  department: ["department", "dept", "branch", "program", "programme"],
  batch: ["batch", "year", "academicyear"],
  role: ["role", "type", "participation", "participantrole"],
} as const;
type Field = keyof typeof ALIASES;

function matchColumn(headers: string[], field: Field): number {
  const h = headers.map(norm);
  const exact = h.findIndex((x) => (ALIASES[field] as readonly string[]).includes(x));
  if (exact !== -1) return exact;
  // loose: header contains an alias (e.g. "Student Name (as per college)")
  return h.findIndex((x) => (ALIASES[field] as readonly string[]).some((a) => a.length >= 4 && x.includes(a)));
}

export type ColumnMap = Partial<Record<Field, number>>;

/** Looks at the first 20 rows for the one that looks most like a header row. */
export function detectHeader(grid: Grid, wanted: Field[]): { headerRow: number; cols: ColumnMap } | null {
  let best: { headerRow: number; cols: ColumnMap; hits: number } | null = null;
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const cols: ColumnMap = {};
    let hits = 0;
    for (const f of wanted) {
      const idx = matchColumn(grid[i], f);
      if (idx !== -1) { cols[f] = idx; hits++; }
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { headerRow: i, cols, hits };
  }
  return best ? { headerRow: best.headerRow, cols: best.cols } : null;
}

/* =====================================================================
   PRN helpers
   ===================================================================== */

export function normalizePrn(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, "").replace(/\.0+$/, "");
}

/** PRN looks like a long number (8 to 14 digits). Adjust once you confirm the real format. */
export const PRN_REGEX = /^\d{8,14}$/;
export const looksLikePrn = (v: string) => PRN_REGEX.test(normalizePrn(v));

function parseSemester(v: string): number | null {
  const m = v.match(/\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 1 && n <= 8 ? n : null;
}

function parseSection(v: string): string {
  return v.trim().toUpperCase().replace(/^(SECTION|SEC|DIV|DIVISION)[\s\-:]*/i, "");
}

/* =====================================================================
   1. EVENT SHEET  (the Case 1 core)
      Input: any sheet that has a PRN column. Everything else is optional.
   ===================================================================== */

export interface EventSheetRow {
  rowNumber: number;
  prn: string;
  nameInSheet?: string;
  role?: "participant" | "organiser" | "volunteer";
}

export interface EventSheetParse {
  rows: EventSheetRow[];
  duplicatesInSheet: EventSheetRow[]; // same PRN repeated
  invalid: { rowNumber: number; value: string; reason: string }[];
  mode: "header" | "autodetect";
  warnings: string[];
}

function parseRole(v?: string): EventSheetRow["role"] {
  const s = norm(v ?? "");
  if (!s) return undefined;
  if (s.includes("organi")) return "organiser";
  if (s.includes("volunt")) return "volunteer";
  return "participant";
}

export function parseEventSheet(grid: Grid): EventSheetParse {
  const warnings: string[] = [];
  const out: EventSheetParse = { rows: [], duplicatesInSheet: [], invalid: [], mode: "header", warnings };
  if (grid.length === 0) { warnings.push("The file is empty."); return out; }

  let prnCol = -1, nameCol = -1, roleCol = -1, start = 0;

  const found = detectHeader(grid, ["prn", "name", "role"]);
  if (found && found.cols.prn !== undefined) {
    prnCol = found.cols.prn;
    nameCol = found.cols.name ?? -1;
    roleCol = found.cols.role ?? -1;
    start = found.headerRow + 1;
  } else {
    // No header: find the column where most cells look like PRNs
    out.mode = "autodetect";
    const width = Math.max(...grid.map((r) => r.length));
    let bestCol = -1, bestScore = 0;
    for (let c = 0; c < width; c++) {
      const score = grid.filter((r) => looksLikePrn(r[c] ?? "")).length;
      if (score > bestScore) { bestScore = score; bestCol = c; }
    }
    if (bestCol === -1) { warnings.push("No PRN column found. Add a column named PRN."); return out; }
    prnCol = bestCol;
    warnings.push("No header row found. Used the column that looks like PRNs.");
  }

  const seen = new Set<string>();
  for (let i = start; i < grid.length; i++) {
    const r = grid[i];
    const rawPrn = r[prnCol] ?? "";
    if (!rawPrn) continue;
    const prn = normalizePrn(rawPrn);
    const rowNumber = i + 1;
    if (!looksLikePrn(prn)) {
      out.invalid.push({ rowNumber, value: rawPrn, reason: "Does not look like a PRN" });
      continue;
    }
    const row: EventSheetRow = {
      rowNumber,
      prn,
      nameInSheet: nameCol !== -1 ? r[nameCol] || undefined : undefined,
      role: roleCol !== -1 ? parseRole(r[roleCol]) : undefined,
    };
    if (seen.has(prn)) { out.duplicatesInSheet.push(row); continue; }
    seen.add(prn);
    out.rows.push(row);
  }
  return out;
}

/** Pasted text: one PRN per line / space / comma separated. */
export function parsePastedPrns(text: string): EventSheetParse {
  const tokens = text.split(/[\s,;|]+/).filter(Boolean);
  const grid: Grid = [["PRN"], ...tokens.map((t) => [t])];
  return parseEventSheet(grid);
}

/* ---------- matching against the student master ---------- */

export interface MasterStudentLite {
  prn: string; name: string; semester: number; section: string;
}

export interface MatchResult {
  matched: Array<EventSheetRow & { student: MasterStudentLite; nameMismatch: boolean }>;
  unmatched: EventSheetRow[]; // PRN not in master -> coordinator must fix or add manually
}

/**
 * Pure function so the SAME logic can run on the server (authoritative) and in
 * the browser preview. nameMismatch is a soft warning: the PRN always wins.
 */
export function matchToMaster(rows: EventSheetRow[], master: Map<string, MasterStudentLite>): MatchResult {
  const res: MatchResult = { matched: [], unmatched: [] };
  for (const r of rows) {
    const s = master.get(r.prn);
    if (!s) { res.unmatched.push(r); continue; }
    const a = norm(r.nameInSheet ?? "");
    const b = norm(s.name);
    const nameMismatch = !!a && a !== b && !a.includes(b) && !b.includes(a);
    res.matched.push({ ...r, student: s, nameMismatch });
  }
  return res;
}

/* =====================================================================
   2. STUDENT MASTER import (admin, once per semester)
   ===================================================================== */

export interface StudentImportRow {
  prn: string; name: string; email?: string; department?: string; batch?: string;
  semester: number; section: string;
}

export interface MasterImportParse<T> {
  valid: T[];
  invalid: { rowNumber: number; reason: string; raw: string[] }[];
  duplicates: { rowNumber: number; key: string }[];
  warnings: string[];
}

export function parseStudentMaster(
  grid: Grid,
  defaults?: { semester?: number; section?: string }
): MasterImportParse<StudentImportRow> {
  const out: MasterImportParse<StudentImportRow> = { valid: [], invalid: [], duplicates: [], warnings: [] };
  const h = detectHeader(grid, ["prn", "name", "semester", "section", "email", "department", "batch"]);
  if (!h || h.cols.prn === undefined || h.cols.name === undefined) {
    out.warnings.push("Header row with PRN and Name columns is required.");
    return out;
  }
  const c = h.cols;
  const prnC = h.cols.prn, nameC = h.cols.name;
  if (c.semester === undefined && !defaults?.semester) out.warnings.push("No Semester column. Pass a default semester.");
  if (c.section === undefined && !defaults?.section) out.warnings.push("No Section column. Pass a default section.");

  const seen = new Set<string>();
  for (let i = h.headerRow + 1; i < grid.length; i++) {
    const r = grid[i];
    const rowNumber = i + 1;
    const prn = normalizePrn(r[prnC] ?? "");
    const name = (r[nameC] ?? "").trim();
    if (!prn && !name) continue;
    if (!looksLikePrn(prn)) { out.invalid.push({ rowNumber, reason: "Invalid or missing PRN", raw: r }); continue; }
    if (!name) { out.invalid.push({ rowNumber, reason: "Missing name", raw: r }); continue; }
    const semester = c.semester !== undefined ? parseSemester(r[c.semester] ?? "") : defaults?.semester ?? null;
    if (!semester) { out.invalid.push({ rowNumber, reason: "Semester must be 1 to 8", raw: r }); continue; }
    const section = c.section !== undefined ? parseSection(r[c.section] ?? "") : defaults?.section ?? "";
    if (!section) { out.invalid.push({ rowNumber, reason: "Missing section", raw: r }); continue; }
    if (seen.has(prn)) { out.duplicates.push({ rowNumber, key: prn }); continue; }
    seen.add(prn);
    out.valid.push({
      prn, name, semester, section,
      email: c.email !== undefined ? (r[c.email] ?? "").trim().toLowerCase() || undefined : undefined,
      department: c.department !== undefined ? r[c.department] || undefined : undefined,
      batch: c.batch !== undefined ? r[c.batch] || undefined : undefined,
    });
  }
  return out;
}

/* =====================================================================
   3. FACULTY MASTER import
      login_id must equal the EkLink login_id (staff ID) so first sign-in can link.
   ===================================================================== */

export interface FacultyImportRow {
  login_id: string; name: string; email: string; department?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseFacultyMaster(grid: Grid): MasterImportParse<FacultyImportRow> {
  const out: MasterImportParse<FacultyImportRow> = { valid: [], invalid: [], duplicates: [], warnings: [] };
  const h = detectHeader(grid, ["loginId", "name", "email", "department"]);
  if (!h || h.cols.name === undefined || h.cols.email === undefined) {
    out.warnings.push("Header row with Name and Email columns is required.");
    return out;
  }
  const c = h.cols;
  const nameC = h.cols.name, emailC = h.cols.email;
  if (c.loginId === undefined) {
    out.warnings.push("No Staff ID column. Email is used as login_id for now. It must match the EkLink login_id.");
  }
  const seen = new Set<string>();
  for (let i = h.headerRow + 1; i < grid.length; i++) {
    const r = grid[i];
    const rowNumber = i + 1;
    const name = (r[nameC] ?? "").trim();
    const email = (r[emailC] ?? "").trim().toLowerCase();
    if (!name && !email) continue;
    if (!name) { out.invalid.push({ rowNumber, reason: "Missing name", raw: r }); continue; }
    if (!EMAIL_RE.test(email)) { out.invalid.push({ rowNumber, reason: "Invalid email", raw: r }); continue; }
    const login_id = (c.loginId !== undefined ? (r[c.loginId] ?? "").trim() : "") || email;
    if (seen.has(login_id)) { out.duplicates.push({ rowNumber, key: login_id }); continue; }
    seen.add(login_id);
    out.valid.push({
      login_id, name, email,
      department: c.department !== undefined ? r[c.department] || undefined : undefined,
    });
  }
  return out;
}

/* =====================================================================
   4. EKLINK ROSTER import (the files the college actually has)
      Columns: login_id | name | email | role | batch | section   (faculty: first 4 only)
      Header labels in these exports are unreliable (e.g. "login_id" three times, plus a
      "Table 1" title row), so columns are detected from the CONTENT, not the labels.
   ===================================================================== */

export interface RosterRow {
  login_id: string;
  name: string;
  email: string;
  role: string;            // raw role text from the file, lower-cased
  batch?: string;          // e.g. 2024-28
  section?: string;
  semester?: number;       // derived from batch, never stored as truth
}

const BATCH_RE = /^(\d{4})\s*[-\u2013]\s*(\d{2,4})$/;

/**
 * Semester a batch is in on a given date.
 * Assumes odd semesters run July to December and even semesters January to June.
 * Returns null once the batch has graduated or if it has not started yet.
 */
export function semesterFromBatch(batch: string, on: Date = new Date()): number | null {
  const m = batch.trim().match(BATCH_RE);
  if (!m) return null;
  const start = Number(m[1]);
  const y = on.getFullYear();
  const sem = on.getMonth() >= 6 ? 2 * (y - start) + 1 : 2 * (y - 1 - start) + 2;
  return sem >= 1 && sem <= 8 ? sem : null;
}

export function parseRoster(grid: Grid, on: Date = new Date()): MasterImportParse<RosterRow> {
  const out: MasterImportParse<RosterRow> = { valid: [], invalid: [], duplicates: [], warnings: [] };
  const width = Math.max(0, ...grid.map((r) => r.length));
  const count = (col: number, test: (v: string) => boolean) =>
    grid.filter((r) => test((r[col] ?? "").trim())).length;

  const KNOWN_ROLES = ["student", "faculty", "staff", "hod", "director", "deputy director", "finance", "admin"];
  let emailCol = -1, roleCol = -1, batchCol = -1, sectionCol = -1;
  let best = 0;
  for (let c = 0; c < width; c++) { const n = count(c, (v) => EMAIL_RE.test(v)); if (n > best) { best = n; emailCol = c; } }
  best = 0;
  for (let c = 0; c < width; c++) { const n = count(c, (v) => KNOWN_ROLES.includes(v.toLowerCase())); if (n > best) { best = n; roleCol = c; } }
  best = 0;
  for (let c = 0; c < width; c++) { const n = count(c, (v) => BATCH_RE.test(v)); if (n > best) { best = n; batchCol = c; } }
  best = 0;
  for (let c = 0; c < width; c++) { const n = count(c, (v) => /^[A-Za-z]$/.test(v)); if (n > best) { best = n; sectionCol = c; } }

  if (emailCol === -1 || roleCol === -1) {
    out.warnings.push("Could not find the email and role columns.");
    return out;
  }
  const loginCol = 0;
  const nameCol = [1, 2, 3].find((c) => c !== emailCol && c !== roleCol && c !== batchCol && c !== sectionCol) ?? 1;
  const hasStudents = grid.some((r) => (r[roleCol] ?? "").trim().toLowerCase() === "student");
  if (hasStudents && batchCol === -1) out.warnings.push("No batch column found. Semester cannot be derived.");

  const seenId = new Set<string>(), seenMail = new Set<string>();
  grid.forEach((r, i) => {
    const rowNumber = i + 1;
    const login_id = (r[loginCol] ?? "").trim();
    const email = (r[emailCol] ?? "").trim().toLowerCase();
    const role = (r[roleCol] ?? "").trim().toLowerCase();
    // skip title and header rows: a data row has a valid email AND a known role
    if (!EMAIL_RE.test(email) || !KNOWN_ROLES.includes(role)) {
      if (login_id && login_id.toLowerCase() !== "table 1" && !/^login_?id$/i.test(login_id)) {
        out.invalid.push({ rowNumber, reason: "Missing or invalid email/role", raw: [] });
      }
      return;
    }
    const name = (r[nameCol] ?? "").trim();
    if (!login_id) { out.invalid.push({ rowNumber, reason: "Missing login_id", raw: [] }); return; }
    if (!name) { out.invalid.push({ rowNumber, reason: "Missing name", raw: [] }); return; }

    let batch: string | undefined, section: string | undefined, semester: number | undefined;
    if (role === "student") {
      batch = batchCol !== -1 ? (r[batchCol] ?? "").trim() : "";
      section = sectionCol !== -1 ? (r[sectionCol] ?? "").trim().toUpperCase() : "";
      if (!looksLikePrn(login_id)) { out.invalid.push({ rowNumber, reason: "Student login_id is not a PRN", raw: [] }); return; }
      if (!batch) { out.invalid.push({ rowNumber, reason: "Missing batch", raw: [] }); return; }
      if (!section) { out.invalid.push({ rowNumber, reason: "Missing section", raw: [] }); return; }
      const sem = semesterFromBatch(batch, on);
      if (sem === null) { out.invalid.push({ rowNumber, reason: "Batch is not in an active semester", raw: [] }); return; }
      semester = sem;
    }
    if (seenId.has(login_id)) { out.duplicates.push({ rowNumber, key: login_id }); return; }
    if (seenMail.has(email)) { out.duplicates.push({ rowNumber, key: "email" }); return; }
    seenId.add(login_id); seenMail.add(email);
    out.valid.push({ login_id, name, email, role, batch, section, semester });
  });
  return out;
}

/* =====================================================================
   Downloadable templates (dummy data only)
   ===================================================================== */

function downloadTemplate(rows: Record<string, string | number>[], sheet: string, file: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
}

export const downloadStudentTemplate = () =>
  downloadTemplate(
    [{ login_id: "24070521001", name: "Dummy Student 001", email: "dummy001@example.edu", role: "student", batch: "2024-28", section: "A" }],
    "Students", "Attendie_Student_Master_Template.xlsx");

export const downloadFacultyTemplate = () =>
  downloadTemplate(
    [{ login_id: "T904", name: "Dummy Faculty 004", email: "dummy004.faculty@example.edu", role: "faculty" }],
    "Faculty", "Attendie_Faculty_Master_Template.xlsx");

export const downloadEventSheetTemplate = () =>
  downloadTemplate(
    [{ PRN: "24070521001", Name: "Dummy Student One", Role: "participant" }],
    "Event", "Attendie_Event_Sheet_Template.xlsx");
