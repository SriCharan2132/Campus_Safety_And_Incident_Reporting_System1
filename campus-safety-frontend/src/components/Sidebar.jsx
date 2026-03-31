import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  FilePlus,
  ShieldCheck,
  BarChart3,
  Siren,
  BadgeInfo,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useSosNotifications } from "../context/SosNotificationContext";
import { jwtDecode } from "jwt-decode";

function Sidebar() {
  const token = localStorage.getItem("token");
  const { activeCount } = useSosNotifications();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

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

  const navItems = useMemo(() => {
    const items = [
      {
        section: "Overview",
        show: true,
        links: [
          {
            to: `/${role?.toLowerCase()}/dashboard`,
            label: "Dashboard",
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
    ];

    if (role === "STUDENT") {
      items.push({
        section: "My Activity",
        show: true,
        links: [
          { to: "/student/incidents", label: "My Incidents", icon: AlertTriangle, exact: true },
          { to: "/student/incidents/report", label: "Report Incident", icon: FilePlus, exact: true },
          { to: "/student/sos", label: "SOS", icon: Siren, exact: true, isSos: true },
        ],
      });
    }

    if (role === "ADMIN") {
      items.push({
        section: "Management",
        show: true,
        links: [
          { to: "/admin/incidents", label: "Manage Incidents", icon: AlertTriangle, exact: true },
          { to: "/admin/sos", label: "SOS Monitoring", icon: Siren, exact: true, isSos: true },
          { to: "/admin/security-analysis", label: "Security Analysis", icon: BarChart3, exact: true },
        ],
      });
    }

    if (role === "SECURITY") {
      items.push({
        section: "Operations",
        show: true,
        links: [
          { to: "/security/incidents", label: "Assigned Incidents", icon: ShieldCheck, exact: true },
          { to: "/security/sos/active", label: "SOS Alerts", icon: Siren, exact: true, isSos: true },
        ],
      });
    }

    return items;
  }, [role]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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

  const renderNav = () => (
    <>
      <p className={sectionTitle}>Overview</p>

      {navItems[0]?.links?.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={linkClass}
        >
          {({ isActive }) => (
            <>
              <item.icon size={18} />
              <span>{item.label}</span>
              <ActiveBar show={isActive} />
            </>
          )}
        </NavLink>
      ))}

      {navItems.slice(1).map((group) => (
        <div key={group.section}>
          <p className={sectionTitle}>{group.section}</p>

          {group.links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={item.isSos ? sosClass : linkClass}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} />
                  <span>{item.label}</span>

                  {item.isSos && activeCount > 0 && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {activeCount}
                    </span>
                  )}

                  <ActiveBar show={isActive && (!item.isSos || activeCount === 0)} />
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/15"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-sm font-semibold">Campus Safety</h1>
          <p className="truncate text-[11px] text-slate-300">Secure System</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/15 ring-1 ring-cyan-400/20">
          <Shield className="h-5 w-5 text-cyan-300" />
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[84vw] max-w-xs flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-blue-950 to-blue-900 text-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile sidebar"
      >
        <div className="shrink-0 border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
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

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/15"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
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

        <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">{renderNav()}</nav>

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

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-blue-950 to-blue-900 text-white shadow-2xl lg:flex">
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

        <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          {renderNav()}
        </nav>

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
    </>
  );
}

export default Sidebar;