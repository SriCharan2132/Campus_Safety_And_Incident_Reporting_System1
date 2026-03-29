import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import SecurityDetailModal from "../../components/SecurityDetailModal";
import { useAuth } from "../../hooks/useAuth";
import {
  Search,
  Repeat,
  Filter,
  ShieldCheck,
  Sparkles,
  Users,
  AlertTriangle,
  Clock3,
  Award,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Zap,
} from "lucide-react";

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function formatHours(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  return `${n.toFixed(1)}h`;
}

function OfficerCard({ officer, isSuggested, onOpen }) {
  const workload = officer.activeIncidents ?? 0;

  const workloadMeta =
    workload < 2
      ? {
          label: "Low",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          accent: "from-emerald-500 to-teal-500",
        }
      : workload < 6
      ? {
          label: "Medium",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          accent: "from-amber-500 to-orange-500",
        }
      : {
          label: "High",
          className: "bg-rose-50 text-rose-700 border-rose-200",
          accent: "from-rose-500 to-red-600",
        };

  return (
    <button
      type="button"
      onClick={() => onOpen(officer)}
      className={`group relative overflow-hidden rounded-3xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        isSuggested ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${workloadMeta.accent}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-lg font-semibold text-slate-900">
              {officer.name}
            </h4>
            {isSuggested && (
              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                Suggested
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-sm text-slate-500">
            {officer.email}
          </div>
        </div>

        <Badge className={`${workloadMeta.className} border`}>
          {workloadMeta.label} workload
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Active</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {officer.activeIncidents ?? 0}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Resolved</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {officer.resolvedCount ?? 0}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Avg time</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {formatHours(officer.avgResponseTime)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} />
          {workload} active incident{workload === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5 group-hover:text-slate-700">
          <Sparkles size={13} />
          Open details
        </span>
      </div>
    </button>
  );
}

function LoadingShell() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function AdminAssignSecurityPage() {
  const { id: incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentAdminId = user?.id ?? user?.userId ?? null;

  const [users, setUsers] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [incident, setIncident] = useState(null);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("workload"); // workload | resolved | name
  const [onlySuggestedTop, setOnlySuggestedTop] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersRes, perfRes, incidentRes] = await Promise.all([
        axiosClient.get("/users/security"),
        axiosClient.get("/incidents/admin/security-advanced-performance"),
        axiosClient.get(`/incidents/${incidentId}/detail`),
      ]);

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setPerformance(Array.isArray(perfRes.data) ? perfRes.data : []);
      setIncident(incidentRes.data || null);
    } catch (err) {
      console.error("Failed to load assignment page data", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load security officers or incident details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const mergedOfficers = useMemo(() => {
    return users.map((u) => {
      const stat = performance.find(
        (s) => Number(s.securityId) === Number(u.id)
      );

      return {
        securityId: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        activeIncidents: stat?.activeCount ?? 0,
        resolvedCount: stat?.resolvedCount ?? 0,
        avgResponseTime: stat?.avgResolutionHours ?? null,
        resolutionRate: stat?.resolutionRate ?? 0,
      };
    });
  }, [users, performance]);

  const suggestedOfficer = useMemo(() => {
    if (!mergedOfficers.length) return null;

    return [...mergedOfficers].sort((a, b) => {
      if ((a.activeIncidents ?? 0) !== (b.activeIncidents ?? 0)) {
        return (a.activeIncidents ?? 0) - (b.activeIncidents ?? 0);
      }
      if ((a.resolvedCount ?? 0) !== (b.resolvedCount ?? 0)) {
        return (b.resolvedCount ?? 0) - (a.resolvedCount ?? 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    })[0];
  }, [mergedOfficers]);

  const displayed = useMemo(() => {
    let list = [...mergedOfficers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sort === "resolved") return (b.resolvedCount ?? 0) - (a.resolvedCount ?? 0);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return (a.activeIncidents ?? 0) - (b.activeIncidents ?? 0);
    });

    if (onlySuggestedTop && suggestedOfficer) {
      list = [
        suggestedOfficer,
        ...list.filter((x) => Number(x.securityId) !== Number(suggestedOfficer.securityId)),
      ];
    }

    return list;
  }, [mergedOfficers, search, sort, onlySuggestedTop, suggestedOfficer]);

  const isAssignmentAllowed = useMemo(() => {
    if (!incident) return false;

    const allowedStatus = ["REPORTED", "UNDER_REVIEW"].includes(incident.status);
    const ownerOk =
      !incident.ownerAdmin ||
      Number(incident.ownerAdmin.id) === Number(currentAdminId);

    return allowedStatus && ownerOk;
  }, [incident, currentAdminId]);

  const restrictionMessage = useMemo(() => {
    if (!incident) return "";

    if (!["REPORTED", "UNDER_REVIEW"].includes(incident.status)) {
      return "This incident can only be assigned when status is REPORTED or UNDER_REVIEW.";
    }

    if (incident.ownerAdmin && Number(incident.ownerAdmin.id) !== Number(currentAdminId)) {
      return `This incident is controlled by ${incident.ownerAdmin.name}.`;
    }

    return "";
  }, [incident, currentAdminId]);

  const assignOfficer = async (officer) => {
    if (!isAssignmentAllowed) {
      alert(restrictionMessage || "Assignment is not allowed right now.");
      return;
    }

    try {
      setAssigning(true);
      await axiosClient.put(`/incidents/${incidentId}/assign`, {
        securityId: officer.securityId ?? officer.id,
      });
      navigate("/admin/incidents");
    } catch (err) {
      console.error("Failed to assign", err);
      alert(err?.response?.data?.message || "Failed to assign security officer.");
    } finally {
      setAssigning(false);
    }
  };

  const assignSuggested = async () => {
    if (!suggestedOfficer) return;

    await assignOfficer(suggestedOfficer);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck size={14} />
                Dispatch center
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Select Security Officer
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Search, compare workload, and assign the most suitable officer.
                Assignment is restricted to REPORTED and UNDER_REVIEW incidents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Repeat size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingShell />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Incident status</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {incident?.status || "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Clock3 size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Owner admin</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {incident?.ownerAdmin?.name || "Unassigned"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Suggested officer</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {suggestedOfficer?.name || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isAssignmentAllowed && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                {restrictionMessage}
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Officer list</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Compare officers and open a detailed performance view before assigning.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search security officer..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 sm:w-80"
                    />
                  </div>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="workload">Sort: Workload (low → high)</option>
                    <option value="resolved">Sort: Resolved (high → low)</option>
                    <option value="name">Sort: Name</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setOnlySuggestedTop((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      onlySuggestedTop
                        ? "border border-indigo-200 bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                    title="Pin suggested officer to top"
                  >
                    <Zap size={16} />
                    {onlySuggestedTop ? "Suggested pinned" : "Pin suggested"}
                  </button>
                </div>
              </div>
            </div>

            {suggestedOfficer && (
              <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 shadow-sm">
                <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      <Sparkles size={14} />
                      AI suggested officer
                    </div>

                    <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                      {suggestedOfficer.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This officer currently has the lowest workload and a strong resolution history.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-slate-500">Active cases</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {suggestedOfficer.activeIncidents ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-slate-500">Resolved</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {suggestedOfficer.resolvedCount ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-slate-500">Avg response</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {formatHours(suggestedOfficer.avgResponseTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOfficer(suggestedOfficer)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      View profile
                    </button>

                    <button
                      type="button"
                      onClick={assignSuggested}
                      disabled={assigning || !isAssignmentAllowed}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {assigning ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Assign suggested
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {displayed.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                  No officers found.
                </div>
              ) : (
                displayed.map((officer) => (
                  <OfficerCard
                    key={officer.securityId}
                    officer={officer}
                    isSuggested={
                      suggestedOfficer &&
                      Number(officer.securityId) === Number(suggestedOfficer.securityId)
                    }
                    onOpen={(off) => setSelectedOfficer(off)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {selectedOfficer && (
          <SecurityDetailModal
            security={selectedOfficer}
            incidentId={incidentId}
            close={() => setSelectedOfficer(null)}
            onAssigned={() => {
              navigate("/admin/incidents");
            }}
          />
        )}
      </div>
    </div>
  );
}