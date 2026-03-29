import { useAuth } from "../hooks/useAuth";
import axiosClient from "../api/axiosClient";

function StatusActions({ incidentId, status, refreshIncident }) {

  const { user } = useAuth();
  const role = user?.role;

  const updateStatus = async (newStatus) => {

    try {

      await axiosClient.put(`/incidents/${incidentId}/status`, {
        newStatus,
        remarks: ""
      });

      refreshIncident();

    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }

  };

  return (

    <div className="flex gap-2">

      {/* SECURITY WORKFLOW */}

      {role === "SECURITY" && status === "REPORTED" && (
        <button
          onClick={() => updateStatus("UNDER_REVIEW")}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Start Review
        </button>
      )}

      {role === "SECURITY" && status === "UNDER_REVIEW" && (
        <button
          onClick={() => updateStatus("ACTION_TAKEN")}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Mark Action Taken
        </button>
      )}

      {/* ADMIN WORKFLOW */}

      {role === "ADMIN" && status === "ACTION_TAKEN" && (
        <button
          onClick={() => updateStatus("RESOLVED")}
          className="bg-indigo-600 text-white px-3 py-1 rounded"
        >
          Resolve Incident
        </button>
      )}

      {role === "ADMIN" && status === "RESOLVED" && (
        <button
          onClick={() => updateStatus("CLOSED")}
          className="bg-gray-800 text-white px-3 py-1 rounded"
        >
          Close Incident
        </button>
      )}

    </div>

  );

}

export default StatusActions;