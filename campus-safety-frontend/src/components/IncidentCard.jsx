import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ShieldAlert,
  UserX,
  Hammer,
  HeartPulse,
  ArrowRight,
  Clock3,
  BadgeAlert,
} from "lucide-react";

function IncidentCard({ incident, role }) {
  const navigate = useNavigate();

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "HIGH":
        return {
          border: "border-red-200",
          accent: "bg-red-500",
          badge: "bg-red-50 text-red-700 border-red-200",
          glow: "hover:shadow-red-100",
        };
      case "MEDIUM":
        return {
          border: "border-amber-200",
          accent: "bg-amber-500",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          glow: "hover:shadow-amber-100",
        };
      case "LOW":
        return {
          border: "border-emerald-200",
          accent: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          glow: "hover:shadow-emerald-100",
        };
      default:
        return {
          border: "border-slate-200",
          accent: "bg-slate-400",
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          glow: "hover:shadow-slate-100",
        };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "HARASSMENT":
        return <UserX size={18} />;
      case "ACCIDENT":
        return <AlertTriangle size={18} />;
      case "MEDICAL":
        return <HeartPulse size={18} />;
      case "SECURITY":
        return <ShieldAlert size={18} />;
      case "OTHER":
        return <Hammer size={18} />;
      default:
        return <BadgeAlert size={18} />;
    }
  };

  const handleClick = () => {
    const pathRole = role === "admin" ? "admin" : role;
    navigate(`/${pathRole}/incidents/${incident.id}`);
  };

  const p = getPriorityClass(incident.priority);

  return (
    <button
      onClick={handleClick}
      className={`group text-left rounded-3xl border ${p.border} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${p.glow}`}
    >
      <div className={`mb-4 h-1.5 w-16 rounded-full ${p.accent}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              {getCategoryIcon(incident.category)}
            </div>
            <h3 className="truncate text-lg font-semibold text-slate-900">
              {incident.title}
            </h3>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {incident.description}
          </p>
        </div>

        <div className="mt-1 rounded-full bg-slate-100 p-2 text-slate-500 transition group-hover:text-slate-800">
          <ArrowRight size={16} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${p.badge}`}>
          {incident.priority}
        </span>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
          {incident.category}
        </span>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
          {incident.status}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock3 size={13} />
          <span>Status updated recently</span>
        </div>

        {incident.status === "ACTION_TAKEN" && (
          <span className="text-sky-600">Waiting for review</span>
        )}
      </div>
    </button>
  );
}

export default IncidentCard;