/**
 * Provisional domain types. These will be locked together with
 * supabase/migrations/0001_init.sql, so treat field names as draft.
 */

export type AppRole = "STUDENT" | "FACULTY" | "ORGANISER" | "ADMIN" | "VIEWER";

export interface SessionUser {
  login_id: string; // EkLink login_id (PRN for students, staff ID for staff)
  name: string;
  email: string;
  role: AppRole;
}

export interface Student {
  prn: string;
  name: string;
  email?: string;
  department?: string;
  batch?: string;
  semester: number;
  section: string;
  status: "active" | "inactive";
}

export interface Faculty {
  login_id: string;
  name: string;
  email: string;
  department?: string;
  status: "active" | "inactive";
}

/* ---------- Case 1: event attendance ---------- */

export type EventCategory =
  | "club_event" | "seminar" | "workshop" | "hackathon" | "sports" | "cultural" | "other";

/** draft = coordinator still editing; published = faculty can see it; closed = locked */
export type EventStatus = "draft" | "in_review" | "published" | "closed";

export interface EventRecord {
  id: string;
  title: string;
  category: EventCategory;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm
  end_time: string;
  venue: string;
  coordinator_login_id: string;
  coordinator_name: string;
  status: EventStatus;
  participant_count: number;
}

export type ParticipantRole = "participant" | "organiser" | "volunteer";

/** pending = not yet marked in Moodle, marked = faculty has marked it */
export type MarkStatus = "pending" | "marked";

export interface EventParticipant {
  id: string;
  event_id: string;
  prn: string;
  student_name: string;
  semester: number;
  section: string;
  role: ParticipantRole;
  mark_status: MarkStatus;
  marked_by_login_id?: string;
  marked_at?: string;
}

/* ---------- Case 2: leave / condonation ledger ---------- */

export type LeaveType = "medical" | "hackathon" | "sports" | "official_travel" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRecord {
  id: string;
  prn: string;
  type: LeaveType;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approved_by_login_id?: string;
  entered_by_login_id: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  to_login_id: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at: string;
}
