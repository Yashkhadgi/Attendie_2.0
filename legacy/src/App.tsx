import { useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { LoginScreen } from "./features/auth/LoginScreen";
import { Dashboard } from "./features/dashboard/Dashboard";
import { api } from "./lib/api";
import { DASHBOARD_PATHS, roleForPath, type DashboardData } from "./types/dashboard";
import type { AppRole } from "./types";
import "./styles/dashboard.css";

function AccessMessage({ forbidden = false }: { forbidden?: boolean }) {
  const { user, logout } = useAuth();
  return <main className="access-screen"><a className="access-brand" href="/">attendie<span>2.0</span></a><span className="access-icon"><LockKeyhole size={30} /></span><span className="eyebrow">PROTECTED WORKSPACE</span><h1>{forbidden ? "This workspace isn’t yours." : "Your identity opens the door."}</h1><p>{forbidden ? "Your account does not have permission to open this dashboard. You can return to your own workspace." : "Sign in with your verified college identity to see your dashboard. EkLink sign-in will be connected next."}</p><a className="primary-button" href={user ? DASHBOARD_PATHS[user.role] : "/"}><ArrowLeft size={16} />{user ? "Go to my dashboard" : "Back to Attendie"}</a>{user && <button className="text-button" onClick={() => void logout()}>Sign out</button>}<span className="access-footnote"><ShieldCheck size={15} /> No college records have been shared.</span></main>;
}
function DashboardRoute({ role }: { role: AppRole }) {
  const { user, loading, logout, refreshUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(null); setDenied(false); setFetching(true);
    if (loading || !user || user.role !== role) { setFetching(false); return; }
    void api.get<DashboardData>(`/api/dashboard/${role.toLowerCase()}`).then(result => {
      if (!active) return;
      if (result.status === 401 || result.status === 403) {
        setDenied(true);
        void refreshUser();
      } else if (result.error || !result.data || result.data.role !== role) {
        setError("Your dashboard could not be loaded. Please try again.");
      } else setData(result.data);
      setFetching(false);
    });
    return () => { active = false; };
  }, [user, loading, role, attempt, refreshUser]);
  if (loading) return <Loading />;
  if (!user) return <AccessMessage />;
  if (user.role !== role || denied) return <AccessMessage forbidden />;
  if (error) return <div className="access-screen"><h1>Let’s try that again.</h1><p role="alert">{error}</p><button className="primary-button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={16} /> Retry</button><a href="/">Return home</a></div>;
  if (fetching || !data || data.profile.loginId !== user.login_id) return <Loading />;
  return <Dashboard role={role} data={data} onLogout={() => void logout()} />;
}
function Loading() { return <div className="loading-screen" role="status"><span className="loading-orbit" />Opening your workspace…</div>; }
function Main() {
  const { user, loading, error } = useAuth();
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const preview = import.meta.env.DEV && pathname.match(/^\/design\/(student|faculty|admin)$/);
  if (preview) return <Dashboard role={preview[1].toUpperCase() as AppRole} data={null} preview />;
  const requestedRole = roleForPath(pathname);
  if (requestedRole) return <DashboardRoute role={requestedRole} />;
  if (pathname !== "/") return <main className="access-screen"><h1>Page not found.</h1><p>This page is not available.</p><a className="primary-button" href="/">Return home</a></main>;
  if (loading) return <Loading />;
  if (user) { window.location.replace(DASHBOARD_PATHS[user.role]); return <Loading />; }
  return <>{error && <p role="alert">{error}</p>}<LoginScreen /></>;
}
export default function App() { return <AuthProvider><Main /></AuthProvider>; }
