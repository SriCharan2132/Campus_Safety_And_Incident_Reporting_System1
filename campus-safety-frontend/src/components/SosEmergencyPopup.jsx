import { useEffect, useState } from "react";
import { useSosNotifications } from "../context/SosNotificationContext";
import { useNavigate } from "react-router-dom";

export default function SosEmergencyPopup() {
  const { sosList } = useSosNotifications();
  const [latest, setLatest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sosList.length) return;

    const newest = sosList[0];

    if (newest?.status === "ACTIVE") {
      setLatest(newest);
    }
  }, [sosList]);

  if (!latest) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />

      <div className="bg-white p-6 rounded-xl shadow-xl z-50 w-[400px] animate-pulse">
        <h2 className="text-lg font-bold text-red-600 mb-2">
          🚨 EMERGENCY SOS ALERT
        </h2>

        <p className="text-sm mb-2">
          <strong>Student:</strong> {latest.studentName}
        </p>

        <p className="text-sm mb-4">
          Location received. Immediate action required.
        </p>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() => setLatest(null)}
          >
            Dismiss
          </button>

          <button
            className="px-3 py-1 bg-red-600 text-white rounded"
            onClick={() => {
              navigate("/security/sos/active");
              setLatest(null);
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}