import { useState, type ReactNode } from "react";
import { Activity, ArrowRight, Bell, BookOpen, CalendarDays, Check, CheckCheck, CircleHelp, ClipboardCheck, Clock3, FileCheck2, FileText, GraduationCap, LayoutDashboard, LockKeyhole, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import type { AppRole } from "../../types";
import type { DashboardData } from "../../types/dashboard";
import { DASHBOARD_PATHS } from "../../types/dashboard";

type Tab = "overview" | "events" | "leaves" | "roster" | "help";
const roleLabels: Record<AppRole, string> = { STUDENT: "Student", FACULTY: "Faculty", ADMIN: "HoD office", ORGANISER: "Organiser", VIEWER: "Reports viewer" };
const roleTitles: Record<AppRole, string> = { STUDENT: "Your campus, at a glance.", FACULTY: "A clearer teaching day.", ADMIN: "Keep the campus in sync.", ORGANISER: "Bring your event together.", VIEWER: "The bigger campus picture." };
const roleDescriptions: Record<AppRole, string> = {
  STUDENT: "Track event attendance, follow up on pending marks and keep your leave records close.",
  FACULTY: "Find published event lists and acknowledge the attendance you mark in Moodle.",
  ADMIN: "Review event lists, keep student records in order and help every acknowledgement reach the right place.",
  ORGANISER: "Prepare your participant lists and send your events to the HoD office for review.",
  VIEWER: "Read attendance coordination reports and understand roster coverage across batches.",
};
function Card({ title, subtitle, icon, children, className = "" }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`dash-card ${className}`}><header className="card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{icon && <span className="card-heading-icon">{icon}</span>}</header>{children}</section>;
}
function Empty({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{children}</p></div>;
}
function Metric({ label, value, description, icon, tone = "teal" }: { label: string; value: number | string; description: string; icon: ReactNode; tone?: string }) {
  return <div className="metric-card"><div><span className="metric-label">{label}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{typeof value === "number" ? value.toLocaleString("en-IN") : value}</strong><p>{description}</p></div>;
}
export function Dashboard({ role, data, preview = false, onLogout }: { role: AppRole; data: DashboardData | null; preview?: boolean; onLogout?: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = data?.profile;
  const roster = data?.roster;
  const isOffice = role === "ADMIN" || role === "VIEWER";
  const date = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const nav: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={19} /> },
    { id: "events", label: role === "FACULTY" ? "Event attendance" : isOffice ? "Event lists" : "My events", icon: <CalendarDays size={19} /> },
    { id: "leaves", label: role === "FACULTY" ? "Marking requests" : isOffice ? "Leave ledger" : "Leave records", icon: role === "FACULTY" ? <Bell size={19} /> : <FileCheck2 size={19} /> },
    ...(isOffice ? [{ id: "roster" as Tab, label: "College roster", icon: <Users size={19} /> }] : []),
  ];
  const move = (next: Tab) => { setTab(next); setMobileOpen(false); };
  return <div className="dashboard-app">
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside id="workspace-navigation" className={`dash-sidebar ${mobileOpen ? "is-open" : ""}`} onKeyDown={event => { if (event.key === "Escape") setMobileOpen(false); }}>
      <a href={preview ? "/" : DASHBOARD_PATHS[role]} className="dash-brand"><span className="brand-mark">a<span>·</span></span><span>attendie<span className="brand-version">2.0</span></span></a>
      <div className="workspace-label">SIT NAGPUR<span>{roleLabels[role]} workspace</span></div>
      <span className="nav-group-label">WORKSPACE</span>
      <nav aria-label="Dashboard navigation">{nav.map(item => <button key={item.id} onClick={() => move(item.id)} aria-current={tab === item.id ? "page" : undefined} className={tab === item.id ? "nav-item active" : "nav-item"}>{item.icon}{item.label}{tab === item.id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="moodle-note"><span><BookOpen size={17} /> Working with Moodle</span><p>Class attendance stays in Moodle. Attendie keeps event follow-ups together.</p></div><button className={`nav-item ${tab === "help" ? "active" : ""}`} onClick={() => move("help")}><CircleHelp size={19} /> How Attendie works</button><div className="sidebar-profile"><span className="avatar">{profile?.name.trim().charAt(0).toUpperCase() ?? <LockKeyhole size={18} />}</span><div><strong>{profile?.name ?? roleLabels[role]}</strong><span>{preview ? "Layout preview" : "Verified college account"}</span></div>{!preview && <button title="Sign out" aria-label="Sign out" onClick={onLogout}><LogOut size={17} /></button>}</div></div>
    </aside>
    <div className="dash-main">
      {preview && <div className="preview-banner"><ShieldCheck size={16} /><span>Layout preview · Personal records are hidden. EkLink sign-in will unlock your dashboard.</span><a href="/">Exit preview <X size={14} /></a></div>}
      <header className="dash-topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="breadcrumb">Workspace <span>/</span> <strong>{tab === "overview" ? "Overview" : tab === "help" ? "Help" : nav.find(n => n.id === tab)?.label}</strong></span></div><div className="topbar-right"><span className="today-label"><CalendarDays size={15} />{date}</span><span className="topbar-divider" /><span className="secure-label"><ShieldCheck size={15} /> Private workspace</span></div></header>
      <main className="dashboard-content">
        <div className="dashboard-intro"><div><div className="eyebrow"><span className="status-dot" /> {roleLabels[role].toUpperCase()} DASHBOARD</div><h1>{tab === "overview" ? roleTitles[role] : tab === "help" ? "A little clarity goes a long way." : nav.find(n => n.id === tab)?.label}</h1><p>{tab === "overview" ? roleDescriptions[role] : tab === "help" ? "What each part of your workspace does, and who can see it." : "Your records, with a clear place for every update."}</p></div><span className="campus-badge"><GraduationCap size={18} /> SIT Nagpur</span></div>
        {tab === "overview" && <>
          <div className="welcome-strip"><span className="welcome-icon">{isOffice ? <ClipboardCheck size={25} /> : role === "FACULTY" ? <BookOpen size={25} /> : <GraduationCap size={25} />}</span><div><h2>{profile ? `Welcome, ${profile.name}.` : role === "ADMIN" ? "Your HoD office workspace." : `Your ${roleLabels[role].toLowerCase()} workspace.`}</h2><p>{isOffice ? "A shared process. Clear ownership. Fewer follow-ups." : "Everything you need to stay up to date, in one place."}</p></div><span className="welcome-tag">{preview ? "Data hidden" : "College records"}</span></div>
          <div className="metrics-grid">{isOffice ? <>
            <Metric label="Students in roster" value={roster?.students ?? "—"} description={roster ? "Across the available batches" : "Visible after verified sign-in"} icon={<GraduationCap size={19} />} />
            <Metric label="Faculty members" value={roster?.faculty ?? "—"} description="Teaching faculty in the master" icon={<Users size={19} />} tone="blue" />
            <Metric label="Lists for review" value="—" description="Event review is not available yet" icon={<ClipboardCheck size={19} />} tone="amber" />
            <Metric label="Roster issues" value={roster ? roster.invalidRows + roster.duplicateRows : "—"} description="Rows that need an office review" icon={<Activity size={19} />} tone="rose" />
          </> : <>
            <Metric label={role === "FACULTY" ? "Published event lists" : "Event attendance"} value="—" description="Event records are not available yet" icon={<CalendarDays size={19} />} />
            <Metric label={role === "FACULTY" ? "Acknowledgements" : "Marked in Moodle"} value="—" description="Faculty confirmations appear here" icon={<CheckCheck size={19} />} tone="blue" />
            <Metric label="Pending follow-ups" value="—" description="No follow-up records available yet" icon={<Clock3 size={19} />} tone="amber" />
            <Metric label={role === "FACULTY" ? "Marking requests" : "Approved leave days"} value="—" description={role === "FACULTY" ? "Student requests will appear here" : "Leave records are not available yet"} icon={role === "FACULTY" ? <Bell size={19} /> : <FileCheck2 size={19} />} tone="rose" />
          </>}</div>
          <div className="dashboard-columns"><div className="dashboard-primary"><Card title={role === "FACULTY" ? "Your event attendance desk" : isOffice ? "Event lists to review" : "Your event attendance"} subtitle={role === "FACULTY" ? "Published lists, organised by day and section" : isOffice ? "Review, correct and publish participant lists" : "Published events and faculty acknowledgements"} icon={<CalendarDays size={19} />}><Empty icon={<CalendarDays size={27} />} title="A place for every event">{preview ? "Published event records will appear here after sign-in. This preview contains no student or event data." : "Event attendance is not available yet. Your published event lists will appear here when the service is ready."}</Empty><button className="card-footer-link" onClick={() => move("events")}>Explore event attendance <ArrowRight size={16} /></button></Card>
          {isOffice ? <RosterCoverage roster={roster} /> : <Card title="How attendance comes together" subtitle="Three steps. Everyone stays informed."><div className="process-steps">{[{title:"The office publishes an event",text:"Approved participant lists are shared with faculty."},{title:"Faculty marks it in Moodle",text:"An acknowledgement in Attendie keeps the student informed."},{title:"Students see the update",text:"Pending records can be followed up with the right faculty."}].map((step, i) => <div className="process-step" key={step.title}><span>{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div>{i === 2 && <Check size={17} />}</div>)}</div></Card>}
          </div><div className="dashboard-secondary"><Card title={isOffice ? "Office priorities" : "Your college profile"} icon={isOffice ? <ClipboardCheck size={18} /> : <GraduationCap size={18} />}>{isOffice ? <div className="office-priorities"><Priority title="Keep the roster complete" text={roster ? `${roster.invalidRows} invalid rows and ${roster.duplicateRows} duplicate rows need attention.` : "Import quality is visible after verified sign-in."} /><Priority title="Review before publishing" text="Only the HoD office can publish event lists." /><Priority title="Keep a clear record" text="Leave decisions remain with the authorised college office." /></div> : <dl className="profile-details"><div><dt>{role === "FACULTY" ? "Staff ID" : "Student PRN"}</dt><dd>{profile?.loginId ?? "Hidden in preview"}</dd></div><div><dt>College email</dt><dd>{profile?.email ?? "Hidden in preview"}</dd></div>{role !== "FACULTY" && <><div><dt>Batch</dt><dd>{profile?.batch ?? "—"}</dd></div><div><dt>Semester / section</dt><dd>{profile ? `${profile.semester ?? "—"} / ${profile.section ?? "—"}` : "—"}</dd></div></>}<div><dt>Access</dt><dd><span className="role-pill">{roleLabels[role]}</span></dd></div></dl>}</Card><Card title="Updates" icon={<Bell size={18} />}><div className="quiet-updates"><span className="quiet-icon"><Bell size={21} /></span><h3>Updates will live here</h3><p>Event publications, marking updates and requests will be grouped in one place.</p></div></Card><div className="privacy-card"><ShieldCheck size={23} /><h3>Only the right eyes.</h3><p>{isOffice ? "Office access requires an explicit admin grant. A college title alone does not grant access." : "Your dashboard is linked to your verified college identity. Another student's records stay private."}</p></div></div></div>
        </>}
        {tab === "events" && <Card title={role === "FACULTY" ? "Published event attendance" : isOffice ? "Event review desk" : "My event records"} subtitle="Attendie coordinates event attendance. Moodle remains the attendance system." icon={<CalendarDays size={20} />}><Empty icon={<CalendarDays size={30} />} title="Event attendance is coming next">{isOffice ? "Participant upload, matching, review and publication are the next workflow to be connected." : "Your event lists and marking acknowledgements will be available when the event workflow is connected."}</Empty></Card>}
        {tab === "leaves" && role === "FACULTY" && <Card title="Student marking requests" subtitle="Follow-ups from students waiting for an attendance acknowledgement" icon={<Bell size={20} />}><Empty icon={<Bell size={30} />} title="Marking requests will appear here">Student follow-ups will be available after event attendance is connected. Acknowledgements confirm a manual update in Moodle.</Empty></Card>}
        {tab === "leaves" && role !== "FACULTY" && <Card title={isOffice ? "Leave and condonation ledger" : "My leave records"} subtitle="Approved leave totals and supporting records" icon={<FileText size={20} />}><Empty icon={<FileCheck2 size={30} />} title="Leave records are not available yet">Approved leaves will be shown here when the ledger is ready. Attendance eligibility is decided by the college; no percentage or leave total is estimated here.</Empty></Card>}
        {tab === "roster" && isOffice && <><RosterCoverage roster={roster} /><div className="roster-footnote"><ShieldCheck size={17} /> This view shows aggregate coverage. Personal roster rows are not exposed here.</div></>}
        {tab === "help" && <div className="help-grid"><Card title="One identity. The right workspace." icon={<LockKeyhole size={20} />}><p className="help-copy">EkLink will verify your college identity. Attendie checks your current role and permissions on the server for every dashboard request. Changing a URL does not grant access to another workspace.</p></Card><Card title="Attendie and Moodle" icon={<BookOpen size={20} />}><p className="help-copy">Faculty continue to mark attendance in Moodle. Attendie helps the office publish event participant lists and records the faculty's acknowledgement. It never writes attendance into Moodle.</p></Card><Card title="Leave and condonation" icon={<FileCheck2 size={20} />}><p className="help-copy">The office records approved leave. Students see their own records. The college decides eligibility and condonation; Attendie does not make that decision automatically.</p></Card></div>}
        <footer className="dashboard-footer"><span><ShieldCheck size={13} /> {preview ? "Layout only · no personal records loaded" : "Access checked on the server"}</span><span>Attendie 2.0 · SIT Nagpur</span></footer>
      </main>
    </div>
  </div>;
}
function Priority({ title, text }: { title: string; text: string }) {
  return <div className="priority"><span /><div><h3>{title}</h3><p>{text}</p></div></div>;
}
function RosterCoverage({ roster }: { roster?: DashboardData["roster"] }) {
  return <Card title="Roster coverage" subtitle="Student distribution across available batches" icon={<Users size={19} />}>{roster ? <div className="roster-coverage">{roster.batches.map(batch => <div className="batch-row" key={batch.batch}><div><span className="batch-icon"><GraduationCap size={18} /></span><div><h3>{batch.batch}</h3><p>{batch.sections.map(section => `${section.section}: ${section.count}`).join(" · ")}</p></div><strong>{batch.count}<small>students</small></strong></div><div className="coverage-track"><span style={{ width: `${roster.students ? batch.count / roster.students * 100 : 0}%` }} /></div></div>)}<div className="coverage-total"><span>Other staff / leadership</span><strong>{roster.otherStaff}</strong></div></div> : <Empty icon={<Users size={27} />} title="College records stay protected">Batch and section totals will be visible to the authorised office after sign-in. No sample roster is shown in this preview.</Empty>}</Card>;
}
