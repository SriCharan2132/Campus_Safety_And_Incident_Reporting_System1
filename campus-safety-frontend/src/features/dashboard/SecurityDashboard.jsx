 // src/features/dashboard/SecurityAnalyticsDashboard.jsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { ShieldCheck } from "lucide-react";
import { jwtDecode } from "jwt-decode";

// Use your UI components
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";

const PRIORITY_COLORS = {
  HIGH: "#EF4444", // red
  MEDIUM: "#F59E0B", // yellow
  LOW: "#10B981", // green
  CRITICAL: "#DC2626", // darker red
  UNKNOWN: "#9CA3AF",
};

function normalizePriorityName(name) {
  return String(name || "UNKNOWN").trim().toUpperCase();
}

function getPriorityColor(name) {
  return PRIORITY_COLORS[normalizePriorityName(name)] || PRIORITY_COLORS.UNKNOWN;
}

export default function SecurityAnalyticsDashboard() {
  const [statsRaw, setStatsRaw] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rangeDays, setRangeDays] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshMs, setRefreshMs] = useState(30000);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const refreshRef = useRef(null);

  const token = localStorage.getItem("token");
  let role = localStorage.getItem("role") || null;
  try {
    if (!role && token) {
      role = jwtDecode(token).role;
    }
  } catch (e) {
    // ignore
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      let statsRes = null;
      try {
        statsRes = await axiosClient.get("/dashboard/security-stats");
      } catch (err) {
        console.warn("Failed to load /dashboard/security-stats", err);
        statsRes = { data: null };
      }

      const candidates = [
        "/incidents/security/my-performance",
        "/incidents/security-perf",
        "/incidents/security/my-performance/summary",
      ];
      let got = null;
      for (const p of candidates) {
        try {
          const r = await axiosClient.get(p);
          got = r.data;
          break;
        } catch (e) {
          // continue trying others
        }
      }

      const perfData = got ? (Array.isArray(got) ? got : [got]) : [];

      setStatsRaw(statsRes.data || null);
      setPerformance(perfData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load security analytics", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [fetchAll]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (refreshRef.current) {
          clearInterval(refreshRef.current);
          refreshRef.current = null;
        }
      } else {
        if (autoRefresh && !refreshRef.current && refreshMs > 0) {
          refreshRef.current = setInterval(fetchAll, refreshMs);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    if (autoRefresh && refreshMs > 0) {
      if (refreshRef.current) clearInterval(refreshRef.current);
      refreshRef.current = setInterval(fetchAll, refreshMs);
    } else {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [autoRefresh, refreshMs, fetchAll]);

  const priorityData = useMemo(() => {
    const s = statsRaw;
    if (!s) return [];

    let raw = [];

    if (s.priorityCounts && typeof s.priorityCounts === "object") {
      raw = Object.entries(s.priorityCounts).map(([k, v]) => ({
        name: normalizePriorityName(k),
        value: Number(v || 0),
      }));
    } else if (Array.isArray(s.priorityDistribution)) {
      raw = s.priorityDistribution.map((item) => ({
        name: normalizePriorityName(item.name),
        value: Number(item.value ?? item.count ?? 0),
      }));
    }

    return raw.map((item) => ({
      ...item,
      fill: getPriorityColor(item.name),
    }));
  }, [statsRaw]);

  const incidentTrend = useMemo(() => {
    const s = statsRaw;
    if (!s) return [];
    let arr = [];

    if (Array.isArray(s.incidentTrend)) {
      arr = s.incidentTrend.map((x) => ({
        date: x.date,
        total: Number(x.total ?? x.count ?? 0),
      }));
    } else if (s.recentCounts && typeof s.recentCounts === "object") {
      arr = Object.entries(s.recentCounts).map(([d, v]) => ({
        date: d,
        total: Number(v),
      }));
    }

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (Number(rangeDays) - 1));

    const filtered = arr
      .filter((item) => {
        const dt = new Date(item.date);
        return !isNaN(dt) && dt >= cutoff;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return filtered;
  }, [statsRaw, rangeDays]);

  const normalizedPerformance = useMemo(() => {
    return (performance || []).map((o) => ({
      securityId: o.securityId ?? o.id,
      securityName: o.securityName ?? o.security_name ?? o.name,
      totalAssigned: Number(o.totalAssigned ?? o.total_assigned ?? 0),
      activeCount: Number(o.activeCount ?? o.active ?? 0),
      resolvedCount: Number(o.resolvedCount ?? o.resolved ?? 0),
      avgResolutionHours: o.avgResolutionHours ?? o.avg_resolution_hours ?? null,
    }));
  }, [performance]);

  const topOfficers = useMemo(() => {
    if (!normalizedPerformance || normalizedPerformance.length <= 1) return [];
    return normalizedPerformance
      .map((o) => ({
        name: o.securityName || `Officer ${o.securityId}`,
        active: o.activeCount,
        resolved: o.resolvedCount,
      }))
      .sort((a, b) => b.active - a.active)
      .slice(0, 8);
  }, [normalizedPerformance]);

  const singleOfficer = normalizedPerformance.length === 1 ? normalizedPerformance[0] : null;

  const resolutionRate = useMemo(() => {
    if (singleOfficer) {
      const total = singleOfficer.totalAssigned ?? 0;
      const resolved = singleOfficer.resolvedCount ?? 0;
      return total ? Math.round((resolved * 100) / total) : 0;
    }
    if (statsRaw && (statsRaw.totalIncidents || statsRaw.resolved !== undefined)) {
      const total = Number(statsRaw.totalIncidents || 0);
      const resolved = Number(statsRaw.resolved || 0);
      return total ? Math.round((resolved * 100) / total) : 0;
    }
    if (normalizedPerformance.length > 1) {
      const totalAssigned = normalizedPerformance.reduce(
        (s, o) => s + (o.totalAssigned || 0),
        0
      );
      const resolved = normalizedPerformance.reduce(
        (s, o) => s + (o.resolvedCount || 0),
        0
      );
      return totalAssigned ? Math.round((resolved * 100) / totalAssigned) : 0;
    }
    return 0;
  }, [singleOfficer, statsRaw, normalizedPerformance]);

  const exportCSV = () => {
    const rows = [];
    rows.push(["Metric", "Label", "Value"].join(","));
    rows.push(["Assigned", "", statsRaw?.assigned ?? 0].join(","));
    rows.push(["Pending", "", statsRaw?.pending ?? 0].join(","));
    rows.push(["UnderReview", "", statsRaw?.underReview ?? 0].join(","));
    rows.push(["ActionTaken", "", statsRaw?.actionTaken ?? 0].join(","));
    rows.push(["HighPriority", "", statsRaw?.highPriority ?? 0].join(","));
    rows.push([]);
    rows.push(["Top Officers", "", ""].join(","));
    rows.push(["Name", "Active", "Resolved"].join(","));
    topOfficers.forEach((o) => rows.push([o.name, o.active, o.resolved].join(",")));
    rows.push([]);
    rows.push(["Trend Date", "Incidents"].join(","));
    incidentTrend.forEach((t) => rows.push([t.date, t.total].join(",")));

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const filename = `security-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV export failed", e);
      alert("Export failed");
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Security Analytics</h1>
          <p className="text-sm text-gray-500">
            High-level command view · role-aware · exportable
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>

          <select
            value={refreshMs}
            onChange={(e) => setRefreshMs(Number(e.target.value))}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
            <option value={0}>Manual only</option>
          </select>

          <button
            onClick={() => setAutoRefresh((a) => !a)}
            className={`px-3 py-2 rounded ${
              autoRefresh ? "bg-green-600 text-white" : "bg-white border"
            }`}
          >
            {autoRefresh ? "Auto-refresh • ON" : "Auto-refresh • OFF"}
          </button>

          <button
            onClick={fetchAll}
            className="px-3 py-2 rounded bg-indigo-600 text-white"
          >
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded border bg-white"
          >
            Export CSV
          </button>

          <div className="text-xs text-gray-500 ml-2">
            {lastRefreshed ? `Last: ${new Date(lastRefreshed).toLocaleString()}` : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Assigned" value={statsRaw?.assigned ?? 0} icon={ShieldCheck} color="bg-indigo-600" />
        <StatCard title="Pending" value={statsRaw?.pending ?? 0} icon={ShieldCheck} color="bg-yellow-500" />
        <StatCard title="Under Review" value={statsRaw?.underReview ?? 0} icon={ShieldCheck} color="bg-blue-500" />
        <StatCard title="Action Taken" value={statsRaw?.actionTaken ?? 0} icon={ShieldCheck} color="bg-green-600" />
        <StatCard title="High Priority" value={statsRaw?.highPriority ?? 0} icon={ShieldCheck} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Incident Trend ({rangeDays}d)</h3>
            <div className="text-xs text-gray-500">
              Total: {incidentTrend.reduce((s, t) => s + (t.total || 0), 0)}
            </div>
          </div>

          {incidentTrend.length > 0 ? (
            <div style={{ height: 220, minWidth: 0 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={incidentTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorInc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-4">
              No trend data available for selected range
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Priority distribution</h3>
          {priorityData && priorityData.length > 0 ? (
            <div style={{ height: 220, minWidth: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    label
                  >
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-4">
              Priority breakdown unavailable
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm">
            {["HIGH", "MEDIUM", "LOW"].map((p) => (
              <div key={p} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: getPriorityColor(p) }}
                  />
                  <span>{p}</span>
                </div>
                <span className="text-gray-500">
                  {priorityData?.find((x) => normalizePriorityName(x.name) === p)?.value ?? 0}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Resolution rate</h3>
            <div className="text-sm text-gray-500">{resolutionRate}%</div>
          </div>

          <div style={{ height: 120, minWidth: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: "resolved", value: resolutionRate },
                    { name: "rest", value: 100 - resolutionRate },
                  ]}
                  dataKey="value"
                  outerRadius={50}
                  innerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Top officers</h4>

            {normalizedPerformance.length === 0 && (
              <div className="text-sm text-gray-500">No performance data</div>
            )}

            {singleOfficer && (
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Officer</div>
                <div className="font-semibold">{singleOfficer.securityName}</div>
                <div className="flex gap-4 mt-2">
                  <div className="text-xs text-gray-500">
                    Assigned
                    <br />
                    <b>{singleOfficer.totalAssigned}</b>
                  </div>
                  <div className="text-xs text-gray-500">
                    Active
                    <br />
                    <b>{singleOfficer.activeCount}</b>
                  </div>
                  <div className="text-xs text-gray-500">
                    Resolved
                    <br />
                    <b>{singleOfficer.resolvedCount}</b>
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg hrs
                    <br />
                    <b>{singleOfficer.avgResolutionHours ?? "—"}</b>
                  </div>
                </div>
              </div>
            )}

            {topOfficers.length > 0 && (
              <div style={{ height: 180, minWidth: 0 }}>
                <ResponsiveContainer>
                  <BarChart data={topOfficers} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="active" name="Active" fill="#EF4444" />
                    <Bar dataKey="resolved" name="Resolved" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Recent/high priority incidents</h3>
          <div className="text-xs text-gray-500">Quick view</div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {Array.isArray(statsRaw?.recentIncidents) && statsRaw.recentIncidents.length > 0 ? (
            statsRaw.recentIncidents.map((i) => (
              <div
                key={i.id}
                className="border p-3 rounded-lg flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium">{i.title ?? i.category ?? "Untitled"}</div>
                  <div className="text-xs text-gray-500">
                    {i.createdAt ? new Date(i.createdAt).toLocaleString() : ""}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {i.description ?? "—"}
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      normalizePriorityName(i.priority) === "HIGH"
                        ? "bg-red-100 text-red-600"
                        : normalizePriorityName(i.priority) === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-700"
                        : normalizePriorityName(i.priority) === "LOW"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i.priority ?? "LOW"}
                  </div>
                  <div className="mt-2">
                    <a
                      href={`/security/incidents/${i.id}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Open
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 p-3">
              No recent incidents provided by backend.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}