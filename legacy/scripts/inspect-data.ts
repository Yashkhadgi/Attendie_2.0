/** Run only by the data owner locally; agents must not run this against data/. */
import fs from "node:fs";
import path from "node:path";
import { readGridFromBuffer } from "../src/features/imports/parseSheet";
import { summarizeRoster } from "./roster-summary";

function findFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findFiles(fullPath);
    return entry.isFile() && /\.(xlsx|xls|csv)$/i.test(entry.name) && !entry.name.startsWith("~$") ? [fullPath] : [];
  });
}

try {
  const files = findFiles(path.resolve("data"));
  console.log(`Found ${files.length} data file(s). Aggregate results only; filenames and rows are omitted.`);
  let students = 0, facultyAndStaff = 0;
  for (const [index, file] of files.entries()) {
    const buffer = fs.readFileSync(file);
    const grid = readGridFromBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    const summary = summarizeRoster(grid);
    students += summary.students;
    facultyAndStaff += summary.facultyAndStaff;
    console.log(JSON.stringify({ fileNumber: index + 1, ...summary }, null, 2));
  }
  console.log(JSON.stringify({ totalValidStudents: students, totalValidFacultyAndStaff: facultyAndStaff }));
} catch {
  // Library errors may contain paths or cell content; never print the raw error.
  console.error("Could not inspect a local sheet. Check file access and format locally.");
  process.exitCode = 1;
}
