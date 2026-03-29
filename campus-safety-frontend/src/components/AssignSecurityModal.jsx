// src/components/AssignSecurityModal.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

function AssignSecurityModal({ incident, close, refresh }) {
  const [securityUsers, setSecurityUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSecurity = async () => {
    try {
      const res = await axiosClient.get("/users/security");
      setSecurityUsers(res.data || []);
    } catch (error) {
      console.error("Failed to load security users", error);
      alert(
        error?.response?.data?.message ||
          "Failed to load security users. Check console."
      );
    } finally {
      setLoading(false);
    }
  };

  const assign = async () => {
    if (!selected) {
      alert("Please select security officer");
      return;
    }
    try {
      await axiosClient.put(`/incidents/${incident.id}/assign`, {
        securityId: Number(selected),
      });
      alert("Incident assigned successfully");
      close();
      refresh();
    } catch (error) {
      console.error("Assign error", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to assign incident";
      alert(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-[540px] space-y-5">
        <h2 className="text-lg font-semibold">Assign Security</h2>

        <div className="bg-gray-50 p-3 rounded">
          <p className="font-medium">{incident.title}</p>
          <p className="text-sm text-gray-500">{incident.description}</p>
        </div>

        {loading ? (
          <p>Loading security officers...</p>
        ) : (
          <select
            className="border p-2 w-full rounded"
            value={selected}
            onChange={(e) => {
              const id = e.target.value;
              setSelected(id);
              const sec = securityUsers.find((u) => String(u.id) === String(id));
              setSelectedSecurity(sec);
            }}
          >
            <option value="">Select Security Officer</option>

            {securityUsers.length === 0 ? (
              <option disabled>No security officers available</option>
            ) : (
              securityUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))
            )}
          </select>
        )}

        {selectedSecurity && (
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p>
              <strong>Name:</strong> {selectedSecurity.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedSecurity.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              View full performance from the admin panel.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={close} className="px-4 py-1 bg-gray-200 rounded">
            Cancel
          </button>

          <button
            onClick={assign}
            className="px-4 py-1 bg-indigo-600 text-white rounded"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignSecurityModal;