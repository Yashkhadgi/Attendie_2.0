import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parseRoster, parseEventSheet, parsePastedPrns, matchToMaster, semesterFromBatch, readGridFromBuffer } from "../src/features/imports/parseSheet";
import { summarizeRoster } from "../scripts/roster-summary";

const date = new Date(2026, 9, 31);
const rosterHeader = ["login_id", "name", "email", "role", "batch", "section"];
const row = ["24070521001", "Dummy Student 001", "dummy001@example.edu", "student", "2024-28", "A"];
function csvGrid(name: string) {
  const buffer = readFileSync(new URL(`../supabase/seed/${name}`, import.meta.url));
  return readGridFromBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

test("dummy student and faculty CSVs parse with expected counts", () => {
  const students = parseRoster(csvGrid("dummy_students.csv"), date);
  assert.equal(students.valid.length, 60);
  assert.equal(students.invalid.length, 0);
  assert.equal(students.duplicates.length, 0);
  const faculty = parseRoster(csvGrid("dummy_faculty.csv"), date);
  assert.equal(faculty.valid.length, 8);
  assert.equal(faculty.invalid.length, 0);
});

test("roster detects title/repeated headers and rejects duplicate IDs/emails and blank section", () => {
  const result = parseRoster([["Table 1"], ["login_id", "login_id", "login_id", "role", "batch", "section"],
    row, row, ["24070521002", ...row.slice(1)], ["24070521003", "Dummy", "third@example.edu", "student", "2024-28", ""]], date);
  assert.equal(result.valid.length, 1);
  assert.equal(result.duplicates.length, 2);
  assert.equal(result.invalid.length, 1);
  assert.equal(result.invalid[0].reason, "Missing section");
});

test("headerless roster retains its first student; invalid email/role and missing batch are flagged", () => {
  assert.equal(parseRoster([row], date).valid.length, 1);
  const result = parseRoster([rosterHeader, row,
    ["24070521002", "Dummy", "bad-email", "student", "2024-28", "A"],
    ["24070521003", "Dummy", "third@example.edu", "student", "", "A"]], date);
  assert.equal(result.invalid.length, 2);
  assert.equal(parseRoster([], date).valid.length, 0);
});

test("semester boundaries follow the documented provisional college calendar", () => {
  assert.equal(semesterFromBatch("2024-28", date), 5);
  assert.equal(semesterFromBatch("2025-29", date), 3);
  assert.equal(semesterFromBatch("2026-30", date), 1);
  assert.equal(semesterFromBatch("2024-28", new Date(2026, 5, 30)), 4);
  assert.equal(semesterFromBatch("2024-28", new Date(2026, 6, 1)), 5);
  assert.equal(semesterFromBatch("2026-30", new Date(2026, 5, 30)), null);
  assert.equal(semesterFromBatch("2020-24", date), null);
});

test("event parser deduplicates, flags bad IDs and preserves participant roles", () => {
  const result = parseEventSheet([["PRN", "Name", "Role"], [row[0], "Dummy", "volunteer"],
    [row[0], "Dummy", "participant"], ["bad-id", "Dummy", "participant"],
    ["24070521002", "Dummy", "organiser"]]);
  assert.equal(result.rows.length, 2);
  assert.equal(result.duplicatesInSheet.length, 1);
  assert.equal(result.invalid.length, 1);
  assert.deepEqual(result.rows.map(r => r.role), ["volunteer", "organiser"]);
});

test("headerless and pasted PRNs parse; master matching leaves unknown IDs unresolved", () => {
  const parsed = parseEventSheet([[row[0]], ["23070521001"]]);
  assert.equal(parsed.mode, "autodetect");
  const matched = matchToMaster(parsed.rows, new Map([[row[0], { prn: row[0], name: "Dummy", section: "A", semester: 5 }]]));
  assert.equal(matched.matched.length, 1);
  assert.equal(matched.unmatched.length, 1);
  const pasted = parsePastedPrns(`${row[0]},${row[0]}\n23070521001;bad`);
  assert.equal(pasted.rows.length, 2);
  assert.equal(pasted.duplicatesInSheet.length, 1);
  assert.equal(pasted.invalid.length, 1);
});

test("150 and 400 row dummy event sheets parse without losing participants", () => {
  for (const count of [150, 400]) {
    const result = parseEventSheet([["PRN"], ...Array.from({ length: count }, (_, i) => [String(99000000000 + i)])]);
    assert.equal(result.rows.length, count);
    assert.equal(result.invalid.length, 0);
  }
});

test("aggregate inspection never emits identity cells, even for headerless or malformed section data", () => {
  const serialized = JSON.stringify(summarizeRoster([
    row,
    ["99000000999", "PRIVATE_NAME_SENTINEL", "private-sentinel@example.edu", "student", "2024-28", "PRIVATE_SECTION_SENTINEL"],
  ], date));
  assert.doesNotMatch(serialized, /PRIVATE|99000000999|private-sentinel/);
  assert.equal(JSON.parse(serialized).bySection.Other, 1);
});
