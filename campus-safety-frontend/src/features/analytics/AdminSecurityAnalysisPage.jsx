import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}h`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0%";
  return `${Math.round(Number(value))}%`;
}

function normalizeOfficer(item) {
  return {
    securityId: pick(item, ["securityId", "id"]),
    securityName: pick(item, ["securityName", "name"], "Unknown"),
    totalAssigned: toNum(pick(item, ["totalAssigned", "total", "assignedCount"], 0)),
    resolvedCount: toNum(pick(item, ["resolvedCount", "resolved"], 0)),
    activeCount: toNum(pick(item, ["activeCount", "active"], 0)),
    resolutionRate: toNum(pick(item, ["resolutionRate", "rate"], 0)),
    avgResolutionHours: pick(item, ["avgResolutionHours", "avgHours"], null),
  };
}

function KpiCard({ label, value, sub, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "from-blue-600 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-orange-500",
    slate: "from-slate-700 to-slate-900",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-3 text-white shadow-md`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function OfficerRow({ officer, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">
            {officer.securityName}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {officer.totalAssigned} assigned • {officer.activeCount} active • {officer.resolvedCount} resolved
          </div>
        </div>

        <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
          {formatPercent(officer.resolutionRate)}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
          style={{ width: `${Math.max(0, Math.min(100, officer.resolutionRate || 0))}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div className="rounded-2xl bg-slate-50 px-2 py-2 text-center">
          <div className="font-semibold text-slate-900">{officer.totalAssigned}</div>
          Load
        </div>
        <div className="rounded-2xl bg-slate-50 px-2 py-2 text-center">
          <div className="font-semibold text-slate-900">{formatHours(officer.avgResolutionHours)}</div>
          Avg time
        </div>
        <div className="rounded-2xl bg-slate-50 px-2 py-2 text-center">
          <div className="font-semibold text-slate-900">{officer.activeCount}</div>
          Active
        </div>
      </div>
    </button>
  );
}

export default function AdminSecurityAnalysisPage() {
  const navigate = useNavigate();

  const [overviewRaw, setOverviewRaw] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("workload");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      setError("");

      const res = await axiosClient.get("/incidents/admin/security-advanced-performance");
      const rows = Array.isArray(res.data) ? res.data : [];
      setOverviewRaw(rows);

      const firstId = pick(rows[0], ["securityId", "id"], null);
      if (firstId != null) {
        setSelectedId((prev) => prev ?? firstId);
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load security analysis overview.");
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const officers = useMemo(() => overviewRaw.map(normalizeOfficer), [overviewRaw]);

  const filteredOfficers = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = officers.filter((o) => !q || o.securityName.toLowerCase().includes(q));

    const sorted = [...list].sort((a, b) => {
      if (sortMode === "resolution") return b.resolutionRate - a.resolutionRate;
      if (sortMode === "active") return b.activeCount - a.activeCount;
      if (sortMode === "avgTime") {
        const av = a.avgResolutionHours == null ? Number.POSITIVE_INFINITY : Number(a.avgResolutionHours);
        const bv = b.avgResolutionHours == null ? Number.POSITIVE_INFINITY : Number(b.avgResolutionHours);
        return av - bv;
      }
      return b.totalAssigned - a.totalAssigned;
    });

    return sorted;
  }, [officers, query, sortMode]);

  useEffect(() => {
    if (!filteredOfficers.length) {
      setSelectedId(null);
      return;
    }

    const exists = filteredOfficers.some((o) => String(o.securityId) === String(selectedId));
    if (!selectedId || !exists) {
      setSelectedId(filteredOfficers[0].securityId);
    }
  }, [filteredOfficers, selectedId]);

  const selected = useMemo(
    () => filteredOfficers.find((o) => String(o.securityId) === String(selectedId)) || null,
    [filteredOfficers, selectedId]
  );

  const totals = useMemo(() => {
    return officers.reduce(
      (acc, item) => {
        acc.securityCount += 1;
        acc.totalAssigned += item.totalAssigned;
        acc.resolvedCount += item.resolvedCount;
        acc.activeCount += item.activeCount;

        if (item.avgResolutionHours != null && item.resolvedCount > 0) {
          acc.avgWeightedHours += Number(item.avgResolutionHours) * item.resolvedCount;
          acc.avgWeight += item.resolvedCount;
        }
        return acc;
      },
      {
        securityCount: 0,
        totalAssigned: 0,
        resolvedCount: 0,
        activeCount: 0,
        avgWeightedHours: 0,
        avgWeight: 0,
      }
    );
  }, [officers]);

  const teamResolutionRate = totals.totalAssigned
    ? (totals.resolvedCount * 100) / totals.totalAssigned
    : 0;

  const teamAvgHours = totals.avgWeight ? totals.avgWeightedHours / totals.avgWeight : null;

  const topPerformer = useMemo(() => {
    if (!officers.length) return null;
    return [...officers].sort((a, b) => b.resolutionRate - a.resolutionRate)[0];
  }, [officers]);

  const busiestOfficer = useMemo(() => {
    if (!officers.length) return null;
    return [...officers].sort((a, b) => b.totalAssigned - a.totalAssigned)[0];
  }, [officers]);

  const refreshAll = () => setRefreshKey((v) => v + 1);

  const visibleCount = filteredOfficers.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <BarChart3 size={14} />
                Admin analytics
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Security Analysis
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Compare every security officer at a glance. Open the performance page for the full charts and deeper drill-down.
              </p>
            </div>

            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <RefreshCw size={16} className={loadingOverview ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Security officers"
              value={totals.securityCount}
              sub="All officers in the system"
              icon={Users}
              tone="blue"
            />
            <KpiCard
              label="Assigned incidents"
              value={totals.totalAssigned}
              sub="Across all officers"
              icon={ShieldCheck}
              tone="slate"
            />
            <KpiCard
              label="Team resolution rate"
              value={formatPercent(teamResolutionRate)}
              sub="Resolved / assigned"
              icon={CheckCircle2}
              tone="emerald"
            />
            <KpiCard
              label="Active workload"
              value={totals.activeCount}
              sub="Currently not closed"
              icon={Activity}
              tone="amber"
            />
            <KpiCard
              label="Avg resolution time"
              value={formatHours(teamAvgHours)}
              sub="Weighted across resolved incidents"
              icon={Clock3}
              tone="blue"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Top performer</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {topPerformer?.securityName || "—"}
                  </p>
                </div>
                <Award className="text-amber-500" size={20} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Resolution rate:{" "}
                <span className="font-semibold text-slate-900">
                  {formatPercent(topPerformer?.resolutionRate)}
                </span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Highest workload</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {busiestOfficer?.securityName || "—"}
                  </p>
                </div>
                <Target className="text-blue-500" size={20} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Assigned incidents:{" "}
                <span className="font-semibold text-slate-900">
                  {busiestOfficer?.totalAssigned ?? 0}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Officer leaderboard</h2>
                    <p className="text-sm text-slate-500">
                      Compare officers and pick one for a deeper view.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {visibleCount} visible
                  </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search officer..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="workload">Sort: workload</option>
                      <option value="resolution">Sort: resolution rate</option>
                      <option value="active">Sort: active load</option>
                      <option value="avgTime">Sort: avg time</option>
                    </select>
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  Search, sort, and pick an officer for a detailed drill-down.
                </p>
              </div>
            </div>

            {loadingOverview ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Loader2 className="mx-auto animate-spin text-slate-500" size={24} />
                <p className="mt-3 text-sm text-slate-500">Loading officers...</p>
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">No security officers match the current search.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredOfficers.map((officer) => (
                  <OfficerRow
                    key={officer.securityId}
                    officer={officer}
                    selected={String(selectedId) === String(officer.securityId)}
                    onClick={() => setSelectedId(officer.securityId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selected officer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Basic overview only. Open the performance page for the full analysis.
                  </p>
                </div>

                <button
                  onClick={() =>
                    selectedId != null && navigate(`/admin/security-performance/${selectedId}`)
                  }
                  disabled={selectedId == null}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deep dive
                  <ChevronRight size={16} />
                </button>
              </div>

              {selected ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                          Officer summary
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold">
                          {selected.securityName}
                        </h3>
                        <p className="mt-2 text-sm text-blue-100">
                          Quick summary of assigned incidents, resolution progress, and active load.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/15 p-3">
                        <BarChart3 size={18} />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/15 p-4">
                        <div className="text-xs text-blue-100">Assigned</div>
                        <div className="mt-1 text-2xl font-semibold">{selected.totalAssigned}</div>
                      </div>
                      <div className="rounded-2xl bg-white/15 p-4">
                        <div className="text-xs text-blue-100">Resolved</div>
                        <div className="mt-1 text-2xl font-semibold">{selected.resolvedCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white/15 p-4">
                        <div className="text-xs text-blue-100">Active</div>
                        <div className="mt-1 text-2xl font-semibold">{selected.activeCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white/15 p-4">
                        <div className="text-xs text-blue-100">Avg time</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {formatHours(selected.avgResolutionHours)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                      <span className="text-sm text-blue-100">Resolution rate</span>
                      <span className="text-lg font-semibold">
                        {formatPercent(selected.resolutionRate)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      selectedId != null && navigate(`/admin/security-performance/${selectedId}`)
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Open full performance page
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <ShieldCheck className="mx-auto text-slate-400" size={28} />
                  <p className="mt-3 text-sm text-slate-500">
                    Select a security officer to see the basic summary.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">What this page shows</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  Top-level workload and resolution comparison across all security officers.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  A basic selected-officer summary with a direct link to the full performance page.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  Charts, trends, and deep analytics should live on the dedicated performance page.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}