import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { AlertTriangle, Clock, CheckCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {

  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchIncidents();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get("/dashboard/student-stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to load student stats", error);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await axiosClient.get("/incidents/my");
      setIncidents(res.data || []);
    } catch (error) {
      console.error("Failed to load incidents", error);
      setIncidents([]);
    }
  };

  if (!stats) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="space-y-6">

      {/* 🔹 HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of your activity</p>
      </div>

      {/* 🔹 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total"
          value={stats.totalIncidents}
          icon={FileText}
          color="bg-indigo-500"
        />

        <StatCard
          title="Reported"
          value={stats.reported}
          icon={AlertTriangle}
          color="bg-yellow-500"
        />

        <StatCard
          title="Under Review"
          value={stats.underReview}
          icon={Clock}
          color="bg-blue-500"
        />

        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="bg-green-500"
        />

      </div>

      {/* 🔹 MAIN GRID */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* 🧾 RECENT INCIDENTS */}
        <div className="bg-white p-5 rounded-2xl shadow-md">

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Incidents</h2>
            <button
              onClick={() => navigate("/student/incidents")}
              className="text-sm text-indigo-600 hover:underline"
            >
              View all
            </button>
          </div>

          {incidents.length === 0 ? (
            <p className="text-gray-500 text-sm">No incidents reported</p>
          ) : (

            <div className="space-y-3 max-h-[260px] overflow-y-auto">

              {incidents.map((incident) => (

                <div
                  key={incident.id}
                  className="border p-3 rounded-xl flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-xs text-gray-500">
                      {incident.status}
                    </p>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded-full ${
                    incident.priority === "HIGH"
                      ? "bg-red-100 text-red-600"
                      : incident.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {incident.priority}
                  </span>
                </div>

              ))}

            </div>

          )}

        </div>

        {/* ⚡ QUICK ACTIONS */}
        <div className="bg-white p-5 rounded-2xl shadow-md">

          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>

          <div className="flex flex-col gap-3">

            <button
              onClick={() => navigate("/student/incidents/report")}
              className="bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              Report Incident
            </button>

            <button
              onClick={() => navigate("/student/sos")}
              className="bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition"
            >
              Trigger SOS
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default StudentDashboard;





/* 🔹 INLINE COMPONENT */
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-md flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>

      <div className={`${color} p-3 rounded-xl text-white`}>
        <Icon size={18} />
      </div>

    </div>
  );
}