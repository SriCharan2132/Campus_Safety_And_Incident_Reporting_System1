// src/features/dashboard/AdminDashboard.jsx

import { useEffect, useState, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";

const COLORS = ["#EF4444","#F59E0B","#10B981","#3B82F6"];
const PRIORITY_COLORS = {
  HIGH: "#EF4444",   // red
  MEDIUM: "#F59E0B", // yellow/orange
  LOW: "#10B981"     // green
};
function AdminDashboard() {

  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get("/dashboard/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  // 🔹 Priority chart
  const priorityData = useMemo(() => {
  if (!stats?.priorityCounts) return [];

  return Object.entries(stats.priorityCounts).map(([key, value]) => ({
    name: key,
    value
  }));
}, [stats]);

  // 🔹 Trend (fallback mock if backend not ready)
  const trendData = useMemo(() => {
    if (stats?.incidentTrend) return stats.incidentTrend;

    // fallback dummy (remove later when backend gives)
    return [
      { date: "03-01", total: 5 },
      { date: "03-02", total: 8 },
      { date: "03-03", total: 6 },
      { date: "03-04", total: 10 },
      { date: "03-05", total: 7 }
    ];
  }, [stats]);

  if (!stats) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">System overview & control panel</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/incidents")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Manage Incidents
          </button>

          <button
  onClick={() => navigate("/admin/sos")}
  className="bg-red-600 text-white px-4 py-2 rounded-lg"
>
  View SOS
</button>
        </div>
      </div>

      {/* 🔥 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard title="Total Incidents" value={stats.totalIncidents} />
        <StatCard title="Reported" value={stats.reported} />
        <StatCard title="Under Review" value={stats.underReview} />
        <StatCard title="Action Taken" value={stats.actionTaken} />
        <StatCard title="Resolved" value={stats.resolved} />
        <StatCard title="Closed" value={stats.closed} />
        <StatCard title="High Priority" value={stats.highPriority} />
        <StatCard title="Active SOS" value={stats.activeSOS} color="bg-red-500" />

      </div>

      {/* 🔥 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 📈 Trend */}
        <Card>
          <h3 className="font-semibold mb-2">Incident Trend</h3>

          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#93C5FD" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 🥧 Priority */}
        <Card>
          <h3 className="font-semibold mb-2">Priority Distribution</h3>

          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={70}>
  {priorityData.map((entry, index) => (
    <Cell
      key={index}
      fill={PRIORITY_COLORS[entry.name] || "#3B82F6"}
    />
  ))}
</Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 🚨 Alerts */}
        <Card>
  <h3 className="font-semibold mb-2">System Alerts</h3>

  <div className="space-y-3">

    {stats.activeSOS > 0 && (
      <div className="bg-red-100 text-red-600 p-3 rounded flex justify-between">
        🚨 {stats.activeSOS} Active SOS alerts
        <button onClick={() => navigate("/admin/sos")} className="underline">
          View
        </button>
      </div>
    )}

    {stats.highPriority > 5 && (
      <div className="bg-yellow-100 text-yellow-700 p-3 rounded">
        ⚠️ High priority incidents increasing
      </div>
    )}

    {stats.reported > stats.resolved && (
      <div className="bg-orange-100 text-orange-700 p-3 rounded">
        📉 Resolution rate dropping
      </div>
    )}

    {stats.totalIncidents === 0 && (
      <div className="bg-green-100 text-green-700 p-3 rounded">
        ✅ System stable
      </div>
    )}

  </div>
</Card>

      </div>

      {/* 🔥 RECENT INCIDENTS */}
      <Card>
        <h3 className="font-semibold mb-3">Recent Incidents</h3>

        {stats.recentIncidents?.length > 0 ? (
          <div className="space-y-2">

            {stats.recentIncidents.map((i) => (
              <div
                key={i.id}
                className="border p-3 rounded flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{i.title}</p>
                  <p className="text-sm text-gray-500">{i.status}</p>
                </div>

                <span className="text-sm text-gray-600">
                  {i.priority}
                </span>
              </div>
            ))}

          </div>
        ) : (
          <p className="text-gray-500">No recent incidents</p>
        )}
      </Card>

    </div>
  );
}

export default AdminDashboard;