import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../../components/LocationPicker";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Filter,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldAlert,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";

const CATEGORIES = ["HARASSMENT", "ACCIDENT", "MEDICAL", "SECURITY", "OTHER"];

function formatCoords(coords) {
  if (!coords || coords.length !== 2) return "No location selected";
  return `${Number(coords[0]).toFixed(6)}, ${Number(coords[1]).toFixed(6)}`;
}

export default function SosPage() {
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef(null);

  const [manualLocationOpen, setManualLocationOpen] = useState(false);
  const [manualCoords, setManualCoords] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  // hard lock to prevent double submit
  const submitLockRef = useRef(false);

  const navigate = useNavigate();

  const selectedCategoryLabel = useMemo(() => category || "Not selected", [category]);

  const resolveCurrentPosition = (timeout = 10000) =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout, maximumAge: 0 }
      );
    });

  const clearEmergencyTimer = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const openManualPicker = (message = "") => {
    setLocationMessage(message);
    setManualLocationOpen(true);
  };

  const getCoordsForSubmit = async () => {
    if (manualCoords && manualCoords.length === 2) {
      return {
        latitude: manualCoords[0],
        longitude: manualCoords[1],
      };
    }

    try {
      const coords = await resolveCurrentPosition();
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } catch (err) {
      console.warn("Geolocation failed", err);

      if (err?.code === 1) {
        openManualPicker(
          "Location permission is denied. You can select your position manually on the map."
        );
      } else {
        openManualPicker("Unable to fetch live GPS. Please pick your location manually.");
      }

      return null;
    }
  };

  const resetSOSForm = () => {
    setDetails("");
    setCategory("");
    setManualCoords(null);
    setLocationMessage("");
  };

  const triggerSOS = async () => {
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const coords = await getCoordsForSubmit();
      if (!coords) return;

      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const cleanDetails = details.trim();
      if (cleanDetails) payload.description = cleanDetails;
      if (category) payload.category = category;

      await axiosClient.post("/sos/trigger", payload);

      alert("SOS submitted. Security has been notified.");

      resetSOSForm();
      navigate("/student/dashboard");
    } catch (err) {
      console.error("SOS submit failed", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "SOS failed. Please try again.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const openEmergency = () => {
    if (submitLockRef.current || isSubmitting) return;

    clearEmergencyTimer();
    setCountdown(10);
    setShowEmergencyModal(true);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearEmergencyTimer();
          setShowEmergencyModal(false);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelEmergency = () => {
    clearEmergencyTimer();
    setShowEmergencyModal(false);
    setCountdown(10);
  };

  const copyCoords = async () => {
    if (!manualCoords) return;
    try {
      await navigator.clipboard.writeText(formatCoords(manualCoords));
      alert("Coordinates copied.");
    } catch {
      alert("Could not copy coordinates.");
    }
  };

  const detectAndPreviewLocation = async () => {
    try {
      const coords = await resolveCurrentPosition(8000);
      setManualCoords([coords.latitude, coords.longitude]);
      setLocationMessage("Current location detected. Review it before sending.");
      setManualLocationOpen(true);
    } catch (err) {
      if (err?.code === 1) {
        openManualPicker(
          "Location permission is denied. Choose your location manually."
        );
      } else {
        openManualPicker("Unable to detect live location. Choose manually.");
      }
    }
  };

  useEffect(() => {
    return () => clearEmergencyTimer();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <ShieldAlert size={14} />
                  Student Emergency SOS
                </div>
                <h1 className="text-2xl font-semibold md:text-3xl">
                  Send a distress alert fast and clearly
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Use the emergency button for urgent cases. If GPS is unavailable,
                  you can still select your location manually before sending.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                onClick={openEmergency}
                disabled={isSubmitting}
              >
                <AlertTriangle size={18} />
                Emergency SOS
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Status</p>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">Ready to send</p>
              <p className="mt-1 text-xs text-slate-500">
                Category: {selectedCategoryLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Location</p>
                <MapPin size={18} className="text-blue-600" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {manualCoords ? "Manual location selected" : "GPS preferred"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {manualCoords ? formatCoords(manualCoords) : "Will request live GPS first"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Tip</p>
                <Sparkles size={18} className="text-amber-500" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">Add brief details</p>
              <p className="mt-1 text-xs text-slate-500">
                A short description helps security respond faster.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">SOS details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill only what is helpful. Location is the most important part.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                onClick={() => navigate(-1)}
              >
                <X size={16} />
                Cancel
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>
            <div className="relative mb-4">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Details
            </label>
            <textarea
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Describe what is happening, who is involved, or any urgent note for security."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Optional, but useful for faster response.</span>
              <span>{details.trim().length} chars</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => {
                  if (!window.confirm("Submit SOS now?")) return;
                  triggerSOS();
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    Send SOS
                  </>
                )}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={detectAndPreviewLocation}
                disabled={isSubmitting}
              >
                <LocateFixed size={18} />
                Detect / Preview location
              </button>
            </div>

            {manualCoords && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Using manual coordinates
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      {formatCoords(manualCoords)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCoords}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {locationMessage && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                {locationMessage}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Quick guidance</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                If the situation is urgent, use <strong>Emergency SOS</strong>. It
                starts a confirmation countdown.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                If GPS fails, choose your exact position manually on the map before
                sending.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                You can add category and details, but location is always the key field.
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                SOS workflow
              </div>
              <div className="space-y-0 p-4 text-sm text-slate-600">
                <div className="flex gap-3 pb-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                  <p>Detect location automatically or select manually.</p>
                </div>
                <div className="flex gap-3 pb-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <p>Add an optional category and a short note.</p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <p>Submit the SOS and notify security immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelEmergency} />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Confirm Emergency SOS
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This will notify security immediately. Auto-confirm in{" "}
                  <strong>{countdown}s</strong>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={cancelEmergency}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
                onClick={async () => {
                  clearEmergencyTimer();
                  setShowEmergencyModal(false);
                  await triggerSOS();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {manualLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setManualLocationOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Pick your location
                </h3>
                <p className="text-sm text-slate-500">
                  {locationMessage || "Move the marker or search for your spot on the map."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setManualLocationOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                  onClick={() => {
                    if (!manualCoords) {
                      alert("Please select a location first.");
                      return;
                    }
                    setManualLocationOpen(false);
                  }}
                >
                  Use this location
                </button>
              </div>
            </div>

            <LocationPicker
              initialPosition={manualCoords ?? null}
              onChange={(lat, lon) => {
                if (lat != null && lon != null) {
                  setManualCoords([lat, lon]);
                }
              }}
              height={460}
              showSearch={true}
            />

            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>
                Selected: {manualCoords ? formatCoords(manualCoords) : "none"}
              </span>
              <button
                type="button"
                className="text-indigo-600 hover:underline"
                onClick={() => setManualCoords(null)}
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}