import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Shield, UserCircle } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import SosBell from "./SosBell";
import { useAuth } from "../hooks/useAuth";
import { jwtDecode } from "jwt-decode";

function Navbar() {
  const { user } = useAuth();
  const email = user?.email || user?.name || "User";

  const token = localStorage.getItem("token");
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role || null;
    } catch {
      role = null;
    }
  }

  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    if (path.includes("/student/dashboard")) return "Dashboard";
    if (path.includes("/security/dashboard")) return "Dashboard";
    if (path.includes("/admin/dashboard")) return "Dashboard";

    if (path.includes("/student/incidents/report")) return "Report Incident";
    if (path.includes("/student/incidents")) return "My Incidents";
    if (path.includes("/security/incidents")) return "Assigned Incidents";
    if (path.includes("/admin/incidents")) return "Manage Incidents";
    if (path.includes("/admin/security-analysis")) return "Security Analysis";
    if (path.includes("/sos")) return "SOS Monitoring";
    if (path.includes("/system-admin/users")) return "User Management";

    return "Campus Safety";
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/");
  };

  const roleColor = {
    SYSTEM_ADMIN: "bg-slate-950 text-white ring-slate-900/20",
    ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
    SECURITY: "bg-sky-50 text-sky-700 ring-sky-200",
    STUDENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  const roleClass =
    roleColor[role] ||
    "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="flex h-auto min-h-16 flex-col gap-3 px-3 py-3 sm:px-4 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
              <Shield className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                  {pageTitle}
                </h2>
                <span className="hidden rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200 sm:inline-flex">
                  Live
                </span>
              </div>

              <p className="truncate text-xs text-slate-500 sm:text-sm">
                Campus Safety System
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <SosBell />
              <div className="h-6 w-px bg-slate-200" />
              <NotificationBell />
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white shadow-sm">
                {email?.[0]?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {email}
                  </span>
                  <UserCircle className="hidden h-4 w-4 text-slate-400 sm:block" />
                </div>

                <div className="mt-1 flex items-center gap-2">
                  {role && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${roleClass}`}
                    >
                      {role.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;