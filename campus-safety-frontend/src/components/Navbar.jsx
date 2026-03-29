import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import SosBell from "./SosBell";
import { useAuth } from "../hooks/useAuth";
import { jwtDecode } from "jwt-decode";

function Navbar() {
  const { user } = useAuth();
  const email = user?.email;

  const token = localStorage.getItem("token");
  let role = null;

  if (token) {
    const decoded = jwtDecode(token);
    role = decoded.role;
  }

  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
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
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/");
  };

  const roleColor = {
  SYSTEM_ADMIN: "bg-black text-white",
  ADMIN: "bg-purple-100 text-purple-700",
  SECURITY: "bg-blue-100 text-blue-700",
  STUDENT: "bg-green-100 text-green-700",
};

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">

      {/* LEFT */}
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-slate-800">
          {getPageTitle()}
        </h2>

        <p className="text-xs text-slate-500">
          Campus Safety System
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* SOS + Notifications */}
        <div className="flex items-center gap-3">
          <SosBell />
          <NotificationBell />
        </div>

        {/* USER CARD */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            {email?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-slate-700">
              {email}
            </span>

            {/* ROLE BADGE */}
            {role && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${roleColor[role]}`}
              >
                {role}
              </span>
            )}
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut size={16} />
          Logout
        </button>

      </div>
    </header>
  );
}

export default Navbar;