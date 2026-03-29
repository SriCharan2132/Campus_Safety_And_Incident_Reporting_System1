// src/components/SecurityDetailModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function SecurityDetailModal({ security, incidentId, close, onAssigned }) {
  const navigate = useNavigate();
  const [assigning, setAssigning] = useState(false);

  const securityIdVal = security.securityId ?? security.id;

  const assign = async () => {
    if (!incidentId) {
      alert("Missing incident id");
      return;
    }
    try {
      setAssigning(true);
      await axiosClient.put(`/incidents/${incidentId}/assign`, { securityId: securityIdVal });
      alert("Incident assigned successfully");
      if (onAssigned) onAssigned();
      close();
    } catch (err) {
      console.error("Assign failed", err);
      alert(err?.response?.data?.message || "Failed to assign");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Security Details</h3>
          <button onClick={close} className="text-gray-500">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="font-medium">{security.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{security.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Active Cases</div>
            <div className="font-medium">{security.activeIncidents ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Resolved Incidents</div>
            <div className="font-medium">{security.resolvedCount ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
            <div className="font-medium">{security.avgResponseTime ?? "N/A"}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <button
              onClick={() => navigate(`/admin/security-performance/${securityIdVal}`)}
              className="px-4 py-2 bg-gray-100 rounded-md"
            >
              View Performance
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={close} className="px-4 py-2 rounded-md bg-gray-200">Cancel</button>
            <button
              onClick={assign}
              disabled={assigning}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white"
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}