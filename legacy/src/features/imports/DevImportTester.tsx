import React, { useState } from "react";
import {
  readGrid,
  parseRoster,
  parseEventSheet,
  matchToMaster,
  downloadStudentTemplate,
  downloadFacultyTemplate,
  downloadEventSheetTemplate,
  type MasterImportParse,
  type RosterRow,
  type EventSheetParse,
  type MasterStudentLite,
  type MatchResult,
} from "./parseSheet";

const DUMMY_MASTER = new Map<string, MasterStudentLite>([
  ["24070521001", { prn: "24070521001", name: "Dummy Student One", semester: 5, section: "A" }],
  ["24070521002", { prn: "24070521002", name: "Dummy Student Two", semester: 5, section: "A" }],
  ["24070521003", { prn: "24070521003", name: "Dummy Student Three", semester: 5, section: "A" }],
  ["24070521006", { prn: "24070521006", name: "Dummy Student Six", semester: 5, section: "B" }],
  ["25070521021", { prn: "25070521021", name: "Dummy Student Twenty-One", semester: 3, section: "A" }],
]);

export function DevImportTester() {
  const [tab, setTab] = useState<"roster" | "event">("roster");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rosterResult, setRosterResult] = useState<MasterImportParse<RosterRow> | null>(null);
  const [eventResult, setEventResult] = useState<EventSheetParse | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileName(null);
    setRosterResult(null);
    setEventResult(null);
    setMatchResult(null);
    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Unsupported file type");
      if (file.size > 5 * 1024 * 1024) throw new Error("File too large");
      const grid = await readGrid(file);
      if (tab === "roster") {
        const parsed = parseRoster(grid);
        setRosterResult(parsed);
        setEventResult(null);
        setMatchResult(null);
      } else {
        const parsed = parseEventSheet(grid);
        setEventResult(parsed);
        const matched = matchToMaster(parsed.rows, DUMMY_MASTER);
        setMatchResult(matched);
        setRosterResult(null);
      }
      setFileName(file.name);
    } catch {
      setError("Could not read this sheet. Choose a valid .xlsx, .xls or .csv file under 5 MB.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleTabChange = (newTab: "roster" | "event") => {
    setTab(newTab);
    setFileName(null);
    setRosterResult(null);
    setEventResult(null);
    setMatchResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 bg-white shadow rounded-lg my-8">
      <div className="flex flex-wrap gap-4 items-center justify-between border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dev Import Tester</h2>
          <p className="text-sm text-slate-500">Test sheet parsing completely in-browser</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadStudentTemplate}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
          >
            Student Template
          </button>
          <button
            type="button"
            onClick={downloadFacultyTemplate}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
          >
            Faculty Template
          </button>
          <button
            type="button"
            onClick={downloadEventSheetTemplate}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
          >
            Event Sheet Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleTabChange("roster")}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
            tab === "roster"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Roster (EkLink format)
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleTabChange("event")}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
            tab === "event"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Event sheet
        </button>
      </div>

      {/* File input */}
      <div className="mb-6">
        <label htmlFor="dev-sheet-upload" className="block text-sm font-medium text-slate-700 mb-2">
          Upload {tab === "roster" ? "Roster (.xlsx/.xls/.csv)" : "Event sheet (.xlsx/.xls/.csv)"}
        </label>
        <input
          id="dev-sheet-upload"
          key={tab}
          type="file"
          disabled={loading}
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {error && <p role="alert" className="text-sm text-red-700 mt-2">{error}</p>}
        {loading && <p role="status" className="text-sm text-blue-600 mt-2">Parsing file...</p>}
        {fileName && !loading && (
          <p className="text-xs text-slate-500 mt-1">Loaded: {fileName}</p>
        )}
      </div>

      {/* Roster Results */}
      {rosterResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4 text-center">
              <span className="text-xs text-emerald-600 uppercase font-bold">Valid</span>
              <p className="text-3xl font-extrabold text-emerald-700">{rosterResult.valid.length}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded p-4 text-center">
              <span className="text-xs text-rose-600 uppercase font-bold">Invalid</span>
              <p className="text-3xl font-extrabold text-rose-700">{rosterResult.invalid.length}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-center">
              <span className="text-xs text-amber-600 uppercase font-bold">Duplicates</span>
              <p className="text-3xl font-extrabold text-amber-700">{rosterResult.duplicates.length}</p>
            </div>
          </div>

          {rosterResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">Warnings:</h4>
              <ul className="list-disc list-inside text-xs text-yellow-700">
                {rosterResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {rosterResult.invalid.length > 0 && (
            <div className="border border-slate-200 rounded p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Invalid Rows:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {rosterResult.invalid.map((inv, idx) => (
                  <div key={idx} className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                    Row {inv.rowNumber}: {inv.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rosterResult.duplicates.length > 0 && (
            <div className="border border-slate-200 rounded p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Duplicate Rows:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {rosterResult.duplicates.map((dup, idx) => (
                  <div key={idx} className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Row {dup.rowNumber} (Key: {dup.key})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Sheet Results */}
      {eventResult && (
        <div className="space-y-6">
          {eventResult.warnings.length > 0 && (
            <div role="status" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {eventResult.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4 text-center">
              <span className="text-xs text-emerald-600 uppercase font-bold">Parsed Rows</span>
              <p className="text-3xl font-extrabold text-emerald-700">{eventResult.rows.length}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded p-4 text-center">
              <span className="text-xs text-rose-600 uppercase font-bold">Invalid</span>
              <p className="text-3xl font-extrabold text-rose-700">{eventResult.invalid.length}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-center">
              <span className="text-xs text-amber-600 uppercase font-bold">Duplicates</span>
              <p className="text-3xl font-extrabold text-amber-700">{eventResult.duplicatesInSheet.length}</p>
            </div>
          </div>

          {matchResult && (
            <div className="bg-slate-50 border border-slate-200 rounded p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Master Match Status:</h4>
              <div className="flex gap-6 mb-4">
                <span className="text-sm font-medium text-emerald-700">
                  Matched: <strong>{matchResult.matched.length}</strong>
                </span>
                <span className="text-sm font-medium text-rose-700">
                  Unmatched: <strong>{matchResult.unmatched.length}</strong>
                </span>
              </div>
              {matchResult.unmatched.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-600 mb-1">Unmatched PRNs:</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {matchResult.unmatched.map((unm, idx) => (
                      <div key={idx} className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                        Row {unm.rowNumber}: PRN {unm.prn}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {eventResult.invalid.length > 0 && (
            <div className="border border-slate-200 rounded p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Invalid Rows:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {eventResult.invalid.map((inv, idx) => (
                  <div key={idx} className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                    Row {inv.rowNumber}: {inv.reason} ({inv.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
