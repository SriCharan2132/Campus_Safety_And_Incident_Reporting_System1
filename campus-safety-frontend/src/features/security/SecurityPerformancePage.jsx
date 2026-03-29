import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
  Activity,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const STATUS_COLORS = ["#f59e0b", "#3b82f6", "#0ea5e9", "#10b981", "#0f172a", "#f43f5e"];
const PRIORITY_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#10b981"];

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}h`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0%";
  return `${Math.round(Number(value))}%`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function MetricCard({ label, value, sub, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "from-blue-600 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-orange-500",
    slate: "from-slate-700 to-slate-900",
    rose: "from-rose-500 to-red-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-3 text-white shadow-md`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-blue-100">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyChart({ title, subtitle }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <BarChart3 size={20} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function SecurityPerformancePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get(`/incidents/admin/security-analysis/${id}`);
      setDetail(res.data || null);
    } catch (e) {
      console.error(e);
      setDetail(null);
      setError("Failed to load the selected officer analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  const selected = detail
    ? {
        securityId: detail.securityId,
        securityName: detail.securityName,
        totalAssigned: safeNumber(detail.totalAssigned, 0),
        resolvedCount: safeNumber(detail.resolvedCount, 0),
        activeCount: safeNumber(detail.activeCount, 0),
        resolutionRate: safeNumber(detail.resolutionRate, 0),
        avgResolutionHours: detail.avgResolutionHours ?? null,
        statusCounts: detail.statusCounts || {},
        priorityCounts: detail.priorityCounts || {},
        trend: Array.isArray(detail.trend) ? detail.trend : [],
        recentIncidents: Array.isArray(detail.recentIncidents) ? detail.recentIncidents : [],
      }
    : null;

  const statusData = useMemo(() => {
    if (!selected) return [];
    const keys = ["REPORTED", "UNDER_REVIEW", "ACTION_TAKEN", "RESOLVED", "CLOSED", "ACTIVE"];
    return keys
      .map((k) => ({ name: k, value: safeNumber(selected.statusCounts[k], 0) }))
      .filter((x) => x.value > 0);
  }, [selected]);

  const priorityData = useMemo(() => {
    if (!selected) return [];
    const keys = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    return keys
      .map((k) => ({ name: k, value: safeNumber(selected.priorityCounts[k], 0) }))
      .filter((x) => x.value > 0);
  }, [selected]);

  const trendData = useMemo(() => {
    if (!selected) return [];
    return selected.trend.map((row) => ({
      date: row.date,
      total: safeNumber(row.total, 0),
    }));
  }, [selected]);

  const recentIncidents = selected?.recentIncidents || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin" size={20} />
            Loading performance...
          </div>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-700">No performance data found.</p>
          <button
            onClick={() => navigate("/admin/security-analysis")}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} />
            Back to analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <BarChart3 size={14} />
                Selected officer performance
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {selected.securityName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Full performance analysis for the selected security officer. No officer list, no search,
                no sort — only the selected officer.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/admin/security-analysis")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft size={16} />
                Back to analysis
              </button>

              <button
                onClick={() => setRefreshKey((v) => v + 1)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Assigned incidents"
              value={selected.totalAssigned}
              sub="Selected officer"
              icon={ShieldCheck}
              tone="slate"
            />
            <MetricCard
              label="Resolved incidents"
              value={selected.resolvedCount}
              sub="Selected officer"
              icon={CheckCircle2}
              tone="emerald"
            />
            <MetricCard
              label="Active cases"
              value={selected.activeCount}
              sub="Selected officer"
              icon={Activity}
              tone="amber"
            />
            <MetricCard
              label="Resolution rate"
              value={formatPercent(selected.resolutionRate)}
              sub="Resolved / assigned"
              icon={Target}
              tone="blue"
            />
            <MetricCard
              label="Avg resolution time"
              value={formatHours(selected.avgResolutionHours)}
              sub="Weighted average"
              icon={Clock3}
              tone="rose"
            />
          </div>

          <div className="mt-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Officer summary</p>
                <h2 className="mt-2 text-2xl font-semibold">{selected.securityName}</h2>
                <p className="mt-2 text-sm text-blue-100">
                  Selected officer only. All charts below belong to this one person.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatChip label="Assigned" value={selected.totalAssigned} />
                <StatChip label="Resolved" value={selected.resolvedCount} />
                <StatChip label="Active" value={selected.activeCount} />
                <StatChip label="Rate" value={formatPercent(selected.resolutionRate)} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Status distribution</h3>
                <p className="text-sm text-slate-500">Workload split by incident status.</p>
              </div>
              <Activity className="text-slate-500" size={18} />
            </div>

            {statusData.length === 0 ? (
              <EmptyChart title="No status data" subtitle="Nothing to show for this officer." />
            ) : (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={3}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Priority mix</h3>
                <p className="text-sm text-slate-500">Incident urgency distribution.</p>
              </div>
              <AlertTriangle className="text-slate-500" size={18} />
            </div>

            {priorityData.length === 0 ? (
              <EmptyChart title="No priority data" subtitle="Nothing to show for this officer." />
            ) : (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} layout="vertical" margin={{ left: 12, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={entry.name} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Trend over time</h3>
              <p className="text-sm text-slate-500">Incidents assigned by date for this officer.</p>
            </div>
            <Clock3 className="text-slate-500" size={18} />
          </div>

          {trendData.length === 0 ? (
            <EmptyChart title="No trend data" subtitle="Nothing to show for this officer." />
          ) : (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent incidents</h3>
              <p className="text-sm text-slate-500">Latest incidents assigned to this officer.</p>
            </div>
            <Sparkles className="text-slate-500" size={18} />
          </div>

          {recentIncidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No recent incidents available.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentIncidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => navigate(`/admin/incidents/${incident.id}`)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{incident.title}</div>
                      <p className="mt-1 text-xs text-slate-500">
                        {incident.category} • {incident.priority}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {incident.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>#{incident.id}</span>
                    <span>{formatDateTime(incident.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}