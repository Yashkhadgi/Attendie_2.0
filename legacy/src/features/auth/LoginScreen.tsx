import { ArrowRight, CalendarCheck2, LockKeyhole, ShieldCheck, GraduationCap } from "lucide-react";
export function LoginScreen() {
  return <div className="signin-page">
    <div className="signin-brand"><span className="brand-mark">a<span>·</span></span><span>attendie<span className="brand-version">2.0</span></span></div>
    <main className="signin-content">
      <div className="eyebrow"><span className="status-dot" /> SIT NAGPUR · CAMPUS ATTENDANCE</div>
      <h1>Less paperwork.<br /><span>More presence.</span></h1>
      <p className="signin-description">Your campus events, attendance follow-ups and approved leave. One place to keep everyone on the same page.</p>
      <div className="signin-card">
        <div className="signin-lock"><LockKeyhole size={22} /></div>
        <div><h2>Your dashboard, securely yours.</h2><p>Sign-in will be available after Attendie is connected to EkLink. Your college identity will open the right dashboard automatically.</p></div>
        <button disabled className="primary-button">Continue with EkLink <ArrowRight size={17} /></button>
        <span className="signin-note">EkLink connection pending</span>
      </div>
      {import.meta.env.DEV && <div className="layout-links"><span>Local design review · personal data hidden</span><div>
        <a href="/design/student">Student <ArrowRight size={14} /></a>
        <a href="/design/faculty">Faculty <ArrowRight size={14} /></a>
        <a href="/design/admin">Admin <ArrowRight size={14} /></a>
      </div></div>}
    </main>
    <aside className="signin-aside"><div className="presence-art"><div className="presence-ring ring-one" /><div className="presence-ring ring-two" /><div className="presence-core"><CalendarCheck2 size={48} strokeWidth={1.4} /></div><div className="art-chip chip-one"><ShieldCheck size={19} /> Private by default</div><div className="art-chip chip-two"><GraduationCap size={19} /> Connected by campus</div></div><p>Every event.<br />Every acknowledgement.<br /><strong>Clearly accounted for.</strong></p></aside>
    <footer className="signin-footer">Built for the campus, with care.<span>Attendie coordinates event attendance. Regular classes stay in Moodle.</span></footer>
  </div>;
}
