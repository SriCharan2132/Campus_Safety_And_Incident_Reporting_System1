import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  LogOut,
  LayoutDashboard,
  LockKeyhole,
} from "lucide-react";
import ChatBotWidget from "../components/ChatBot/ChatBotWidget";
export default function SystemAdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/");
  };

  const navItemClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_40%,_#e2e8f0_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                System Administrator
              </h1>
              <p className="text-sm text-slate-500">
                Campus Safety & Incident Reporting System
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
            <LockKeyhole className="h-4 w-4" />
            Secure RBAC Console
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/60 bg-white/55 p-4 backdrop-blur-xl lg:p-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Control Center
                </p>
                <p className="text-xs text-slate-500">User administration</p>
              </div>
            </div>

            <nav className="space-y-2">
              <NavLink to="/system-admin/users" className={navItemClass}>
                <LayoutDashboard className="h-4 w-4" />
                Users
              </NavLink>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatBotWidget />
    </div>
  );
}