import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateDMY } from "./format";
import type { EventRecord, EventParticipant } from "../types";

const INSTITUTE = "SYMBIOSIS INSTITUTE OF TECHNOLOGY";
const CAMPUS = "NAGPUR CAMPUS";

export interface SheetPdfOptions {
  /** Restrict to one section, for the faculty class view printout. */
  section?: string;
  /** Add a blank signature column (for the paper copy). */
  signatureColumn?: boolean;
}

/** Official printable attendance list for one event. */
export function generateEventSheetPdf(
  event: EventRecord,
  participants: EventParticipant[],
  opts: SheetPdfOptions = {}
) {
  const list = (opts.section ? participants.filter((p) => p.section === opts.section) : participants)
    .slice()
    .sort((a, b) => a.semester - b.semester || a.section.localeCompare(b.section) || a.prn.localeCompare(b.prn));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(INSTITUTE, 105, 18, { align: "center" });
  doc.setFontSize(12);
  doc.text(CAMPUS, 105, 25, { align: "center" });
  doc.setLineWidth(0.6);
  doc.line(15, 29, 195, 29);

  doc.setFontSize(14);
  doc.text("EVENT ATTENDANCE LIST", 105, 36, { align: "center" });

  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 41, 180, 26, 2, 2, "FD");
  doc.setFontSize(10);

  const field = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + doc.getTextWidth(label) + 2, y);
  };
  field("Event:", event.title, 20, 48);
  field("Date:", formatDateDMY(event.date), 20, 56);
  field("Time:", `${event.start_time} - ${event.end_time}`, 75, 56);
  field("Venue:", event.venue, 138, 56);
  field("Coordinator:", event.coordinator_name, 20, 63);
  field("Total:", `${list.length}${opts.section ? ` (Section ${opts.section})` : ""}`, 138, 63);

  const head = ["#", "PRN", "Sem", "Sec", "Name", "Role"];
  if (opts.signatureColumn) head.push("Signature");

  autoTable(doc, {
    startY: 72,
    head: [head],
    body: list.map((p, i) => {
      const row: (string | number)[] = [i + 1, p.prn, p.semester, p.section, p.student_name, p.role];
      if (opts.signatureColumn) row.push("");
      return row;
    }),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, valign: "middle" },
    headStyles: { fillColor: [23, 37, 84], textColor: 255, fontStyle: "bold", halign: "center" },
    margin: { left: 15, right: 15 },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${doc.getNumberOfPages()}`, 195, 287, { align: "right" });
      doc.setTextColor(0);
    },
  });

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let y = lastY + 22;
  if (y > doc.internal.pageSize.height - 35) { doc.addPage(); y = 40; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Coordinator Signature: ____________________", 20, y);
  doc.text("HoD Office: ____________________", 125, y);

  const safe = event.title.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`Attendie_${safe}_${formatDateDMY(event.date)}${opts.section ? `_Sec${opts.section}` : ""}.pdf`);
}
