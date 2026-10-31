import type { AppRole } from "./index";
export interface DashboardProfile {
  name: string;
  loginId: string;
  email: string;
  batch?: string;
  section?: string;
  semester?: number;
}
export interface DashboardRosterSummary {
  students: number;
  faculty: number;
  otherStaff: number;
  invalidRows: number;
  duplicateRows: number;
  batches: Array<{ batch: string; count: number; sections: Array<{ section: string; count: number }> }>;
  loadedAt: string;
}
export interface DashboardData {
  role: AppRole;
  profile: DashboardProfile;
  roster?: DashboardRosterSummary;
  availability: { events: false; leaves: false; notifications: false };
}
export const DASHBOARD_PATHS: Record<AppRole, string> = {
  STUDENT: "/dashboard/student", FACULTY: "/dashboard/faculty", ADMIN: "/dashboard/admin",
  ORGANISER: "/dashboard/organiser", VIEWER: "/dashboard/viewer",
};
export function roleForPath(pathname: string): AppRole | null {
  return (Object.entries(DASHBOARD_PATHS).find(([, value]) => value === pathname)?.[0] as AppRole) ?? null;
}
