import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  FilePlus,
  ShieldCheck,
  BarChart3,
  Siren,
  BadgeInfo,
  Shield,
} from "lucide-react";
import { useSosNotifications } from "../context/SosNotificationContext";
import { jwtDecode } from "jwt-decode";

function Sidebar() {
  const token = localStorage.getItem("token");
  const { activeCount } = useSosNotifications();

  let role = null;
  let email = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
      email = decoded.sub || "";
    } catch {
      role = null;
    }
  }

  const base =
    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden";

  const active =
    "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10";
  const inactive = "text-slate-200/85 hover:bg-white/10 hover:text-white";

  const sectionTitle =
    "px-4 mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/70";

  const linkClass = ({ isActive }) => `${base} ${isActive ? active : inactive}`;

  const sosClass = ({ isActive }) =>
    `${base} ${
      activeCount > 0
        ? "bg-red-500/18 text-red-100 ring-1 ring-red-400/20 animate-pulse"
        : isActive
        ? active
        : inactive
    }`;

  const ActiveBar = ({ show }) =>
    show ? (
      <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.75)]" />
    ) : null;

  return (
    <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-blue-950 to-blue-900 text-white shadow-2xl">
      {/* Brand */}
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Shield className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-5">
              Campus Safety
            </h1>
            <p className="text-xs text-blue-100/70">Secure System</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/60">
                Signed in as
              </p>
              <p className="truncate text-sm font-medium text-white">
                {email || "User"}
              </p>
            </div>
            <div className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
              {role || "GUEST"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <p className={sectionTitle}>Overview</p>

        <NavLink to={`/${role?.toLowerCase()}/dashboard`} end className={linkClass}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
              <ActiveBar show={isActive} />
            </>
          )}
        </NavLink>

        {role === "STUDENT" && (
          <>
            <p className={sectionTitle}>My Activity</p>

            <NavLink to="/student/incidents" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <AlertTriangle size={18} />
                  <span>My Incidents</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>

            <NavLink to="/student/incidents/report" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <FilePlus size={18} />
                  <span>Report Incident</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>

            <NavLink to="/student/sos" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <Siren size={18} />
                  <span>SOS</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>
          </>
        )}

        {role === "ADMIN" && (
          <>
            <p className={sectionTitle}>Management</p>

            <NavLink to="/admin/incidents" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <AlertTriangle size={18} />
                  <span>Manage Incidents</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>

            <NavLink to="/admin/sos" end className={sosClass}>
              {({ isActive }) => (
                <>
                  <Siren size={18} />
                  <span>SOS Monitoring</span>
                  {activeCount > 0 && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {activeCount}
                    </span>
                  )}
                  <ActiveBar show={isActive && activeCount === 0} />
                </>
              )}
            </NavLink>

            <NavLink to="/admin/security-analysis" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <BarChart3 size={18} />
                  <span>Security Analysis</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>
          </>
        )}

        {role === "SECURITY" && (
          <>
            <p className={sectionTitle}>Operations</p>

            <NavLink to="/security/incidents" end className={linkClass}>
              {({ isActive }) => (
                <>
                  <ShieldCheck size={18} />
                  <span>Assigned Incidents</span>
                  <ActiveBar show={isActive} />
                </>
              )}
            </NavLink>

            <NavLink to="/security/sos/active" end className={sosClass}>
              {({ isActive }) => (
                <>
                  <Siren size={18} />
                  <span>SOS Alerts</span>
                  {activeCount > 0 && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {activeCount}
                    </span>
                  )}
                  <ActiveBar show={isActive && activeCount === 0} />
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200 ring-1 ring-cyan-400/20">
              <BadgeInfo size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Enterprise Control</p>
              <p className="mt-1 text-xs leading-5 text-blue-100/70">
                Role-aware navigation and live incident alerts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;