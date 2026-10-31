/** Private local roster adapter. Never import this module into browser code. */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseRoster, readGridFromBuffer, type RosterRow } from "../../src/features/imports/parseSheet";
import { isLocalDevelopment } from "./devEnvironment";

export type Grant = "admin" | "organiser" | "viewer";
export interface RosterSummary {
  students: number;
  faculty: number;
  otherStaff: number;
  invalidRows: number;
  duplicateRows: number;
  batches: Array<{ batch: string; count: number; sections: Array<{ section: string; count: number }> }>;
  loadedAt: string;
}
export interface PrivateRoster {
  people: Map<string, RosterRow>;
  grants: Map<string, Grant>;
  summary: RosterSummary;
}

async function sheetPaths(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isSymbolicLink() || entry.name.startsWith("~$")) return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sheetPaths(target);
    return entry.isFile() && /\.(xlsx|xls|csv)$/i.test(entry.name) ? [target] : [];
  }));
  return nested.flat().sort();
}

let cache: { signature: string; roster: PrivateRoster } | undefined;

export async function loadLocalRoster(): Promise<PrivateRoster> {
  if (!isLocalDevelopment()) throw new Error("Local roster access is unavailable");
  const directory = path.resolve("data");
  const files = await sheetPaths(directory);
  if (!files.length) throw new Error("No local roster available");
  const collegeDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month, day] = collegeDay.split("-").map(Number);
  const semesterDate = new Date(year, month - 1, day);
  const accessPath = path.join(directory, "access.json");
  let accessText = "";
  try { accessText = await readFile(accessPath, "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Access configuration unavailable"); }
  const signatures = await Promise.all(files.map(async (file) => { const info = await stat(file); return `${file}:${info.mtimeMs}:${info.size}`; }));
  // Recalculate derived semester at date changes, even when the files are unchanged.
  const signature = JSON.stringify([collegeDay, signatures, accessText]);
  if (cache?.signature === signature) return cache.roster;

  const people = new Map<string, RosterRow>();
  const grants = new Map<string, Grant>();
  const conflicts = new Set<string>();
  let invalidRows = 0, duplicateRows = 0;
  for (const file of files) {
    const buffer = await readFile(file);
    const result = parseRoster(readGridFromBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)), semesterDate);
    invalidRows += result.invalid.length;
    duplicateRows += result.duplicates.length;
    // A repeated ID is ambiguous even if parseRoster kept its first occurrence.
    for (const duplicate of result.duplicates) if (duplicate.key !== "email") conflicts.add(duplicate.key);
    for (const person of result.valid) {
      if (people.has(person.login_id)) { duplicateRows++; conflicts.add(person.login_id); }
      else people.set(person.login_id, person);
    }
  }
  if (accessText) {
    const config: unknown = JSON.parse(accessText);
    if (!config || typeof config !== "object") throw new Error("Invalid access configuration");
    const { identities = [], grants: rows = [] } = config as { identities?: unknown; grants?: unknown };
    if (!Array.isArray(identities) || !Array.isArray(rows)) throw new Error("Invalid access configuration");
    for (const value of identities) {
      const person = value as Partial<RosterRow>;
      if (!person || typeof person.login_id !== "string" || !person.login_id.trim()
        || typeof person.name !== "string" || !person.name.trim()
        || typeof person.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)
        || !["staff", "admin"].includes(person.role ?? "")) throw new Error("Invalid office identity configuration");
      if (people.has(person.login_id)) throw new Error("Conflicting office identity configuration");
      people.set(person.login_id, { login_id: person.login_id, name: person.name, email: person.email, role: person.role! });
    }
    for (const value of rows) {
      const row = value as { login_id?: unknown; app_role?: unknown };
      if (!row || typeof row.login_id !== "string" || !people.has(row.login_id)
        || !["admin", "organiser", "viewer"].includes(String(row.app_role)) || grants.has(row.login_id)) throw new Error("Invalid role grant configuration");
      grants.set(row.login_id, row.app_role as Grant);
    }
  }
  for (const id of conflicts) { people.delete(id); grants.delete(id); }

  const batches = new Map<string, { count: number; sections: Map<string, number> }>();
  let students = 0, faculty = 0, otherStaff = 0;
  for (const person of people.values()) {
    if (person.role === "student") {
      students++;
      const batch = person.batch!;
      const item = batches.get(batch) ?? { count: 0, sections: new Map<string, number>() };
      item.count++;
      const section = /^[A-Z]$/.test(person.section ?? "") ? person.section! : "Unassigned";
      item.sections.set(section, (item.sections.get(section) ?? 0) + 1);
      batches.set(batch, item);
    } else if (person.role === "faculty") faculty++;
    else otherStaff++;
  }
  const summary: RosterSummary = {
    students, faculty, otherStaff, invalidRows, duplicateRows,
    batches: [...batches].sort(([a], [b]) => a.localeCompare(b)).map(([batch, value]) => ({
      batch, count: value.count, sections: [...value.sections].sort(([a], [b]) => a.localeCompare(b)).map(([section, count]) => ({ section, count })),
    })),
    loadedAt: new Date().toISOString(),
  };
  const roster = { people, grants, summary };
  cache = { signature, roster };
  return roster;
}
