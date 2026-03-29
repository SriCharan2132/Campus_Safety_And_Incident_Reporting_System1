import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../../components/LocationPicker";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  FileUp,
  Filter,
  Image as ImageIcon,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
  Loader2,
} from "lucide-react";

const MAX_TITLE = 120;
const MAX_DESC = 1000;
const MAX_FILES = 8;
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CATEGORIES = [
  { value: "HARASSMENT", label: "Harassment" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "MEDICAL", label: "Medical" },
  { value: "SECURITY", label: "Security Issue" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  {
    value: "LOW",
    label: "Low",
    helper: "Routine monitoring",
    active: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    helper: "Needs attention",
    active: "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  {
    value: "HIGH",
    label: "High",
    helper: "Urgent response",
    active: "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-200",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
];

const ANON_OPTIONS = [
  {
    value: "NONE",
    label: "No anonymity",
    helper: "Security can see your identity",
    active: "border-slate-900 bg-slate-900 text-white",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  {
    value: "SECURITY_ONLY",
    label: "Security only",
    helper: "Hidden from security",
    active: "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  {
  value: "ADMIN_AND_SECURITY",
  label: "Fully anonymous",
    helper: "Identity hidden as much as possible",
    active: "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    idle: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
];

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function formatCoords(coords) {
  if (!coords || coords.length !== 2) return "No location selected";
  return `${Number(coords[0]).toFixed(6)}, ${Number(coords[1]).toFixed(6)}`;
}

function getFriendlyError(err) {
  const resp = err?.response?.data;

  if (resp?.errors && Array.isArray(resp.errors) && resp.errors.length > 0) {
    return resp.errors
      .map((x) => x?.defaultMessage || x?.message || JSON.stringify(x))
      .join("\n");
  }

  if (resp?.fieldErrors && Array.isArray(resp.fieldErrors) && resp.fieldErrors.length > 0) {
    return resp.fieldErrors
      .map((f) => `${f.field || "field"}: ${f.defaultMessage || f.message || "Invalid value"}`)
      .join("\n");
  }

  if (typeof resp === "string") return resp;

  return resp?.message || "Failed to report incident";
}

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const attachmentRef = useRef([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "LOW",
    anonymousLevel: "NONE",
    latitude: null,
    longitude: null,
    address: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error" | "info", message: string }
  const [attachmentNote, setAttachmentNote] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    attachmentRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);

  const titleCount = form.title.length;
  const descCount = form.description.length;

  const selectedPriorityMeta = useMemo(
    () => PRIORITIES.find((p) => p.value === form.priority) || PRIORITIES[0],
    [form.priority]
  );

  const selectedAnonMeta = useMemo(
    () => ANON_OPTIONS.find((a) => a.value === form.anonymousLevel) || ANON_OPTIONS[0],
    [form.anonymousLevel]
  );

  const selectedCategoryLabel = useMemo(() => {
    return CATEGORIES.find((c) => c.value === form.category)?.label || form.category;
  }, [form.category]);

  const previewLocation = useMemo(() => {
    if (form.latitude == null || form.longitude == null) return "Location not selected yet";
    return formatCoords([form.latitude, form.longitude]);
  }, [form.latitude, form.longitude]);

  const clearFiles = () => {
    attachmentRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const next = [...prev];
      const removed = next[index];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      next.splice(index, 1);
      return next;
    });
  };

  const handleFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles || []);
    if (incoming.length === 0) return;

    setAttachmentNote("");

    setAttachments((prev) => {
      const spaceLeft = MAX_FILES - prev.length;
      if (spaceLeft <= 0) {
        setAttachmentNote(`You can attach up to ${MAX_FILES} files.`);
        return prev;
      }

      const accepted = [];
      let rejectedCount = 0;

      for (const file of incoming.slice(0, spaceLeft)) {
        const validType =
          file.type.startsWith("image/") || file.type.startsWith("video/");
        const validSize = file.size <= MAX_FILE_SIZE_BYTES;

        if (!validType || !validSize) {
          rejectedCount += 1;
          continue;
        }

        accepted.push({
          file,
          url: URL.createObjectURL(file),
        });
      }

      if (rejectedCount > 0) {
        setAttachmentNote(
          `Some files were skipped. Use images/videos only, each under ${MAX_FILE_SIZE_MB}MB.`
        );
      }

      if (accepted.length === 0 && incoming.length > 0) {
        setAttachmentNote(
          `No valid files were added. Use images/videos only, each under ${MAX_FILE_SIZE_MB}MB.`
        );
        return prev;
      }

      const next = [...prev, ...accepted];
      if (next.length >= MAX_FILES) {
        setAttachmentNote(`Attachment limit reached (${MAX_FILES}/${MAX_FILES}).`);
      }

      return next;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.title.trim().length > MAX_TITLE) return `Title must be <= ${MAX_TITLE} characters.`;
    if (form.description.trim().length > MAX_DESC) return `Description must be <= ${MAX_DESC} characters.`;
    if (attachments.length > MAX_FILES) return `You can upload a maximum of ${MAX_FILES} files.`;
    return null;
  };

  const getCurrentLocation = async () => {
    setLocationNote("");
    setDetectingLocation(true);

    try {
      const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      setForm((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));

      setLocationNote("Current GPS location detected successfully.");
    } catch (err) {
      console.warn("Geolocation failed", err);
      setLocationNote(
        err?.code === 1
          ? "Location permission was denied. You can still pick the location on the map."
          : "Unable to detect GPS. You can still pick the location on the map."
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const validationError = validateForm();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setLoading(true);

    try {
      const safeEnum = (v) => v?.toUpperCase().trim();

const payload = {
  title: form.title.trim(),
  description: form.description.trim(),
  category: safeEnum(form.category),
  priority: safeEnum(form.priority),
  anonymousLevel: safeEnum(form.anonymousLevel),

  ...(form.latitude != null && { latitude: form.latitude }),
  ...(form.longitude != null && { longitude: form.longitude }),
};

      const res = await axiosClient.post("/incidents/report", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const incidentId = res.data?.id;

      if (attachments.length > 0 && incidentId) {
        for (const item of attachments) {
          const fd = new FormData();
          fd.append("file", item.file);

          await axiosClient.post(`/incidents/${incidentId}/upload`, fd, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
      }

      setFeedback({
        type: "success",
        message: "Incident reported successfully. Redirecting to your incidents page...",
      });

      clearFiles();

      setTimeout(() => {
        navigate("/student/incidents");
      }, 1800);
    } catch (err) {
      console.error("REPORT ERROR FULL:", JSON.stringify(err?.response?.data, null, 2));
      setFeedback({
        type: "error",
        message: getFriendlyError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const fileCount = attachments.length;
  const totalSizeMB = useMemo(() => {
    const bytes = attachments.reduce((sum, a) => sum + (a.file?.size || 0), 0);
    return (bytes / (1024 * 1024)).toFixed(1);
  }, [attachments]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <ShieldAlert size={14} />
                  Student Incident Reporting
                </div>
                <h1 className="text-2xl font-semibold md:text-3xl">
                  Report an incident with clarity and speed
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                  Add the title, a clear description, category, priority, and location.
                  You can also attach photos or videos to help security respond faster.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    Submit Incident
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Priority</p>
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedPriorityMeta.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{selectedPriorityMeta.helper}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Attachments</p>
                <FileUp size={18} className="text-blue-600" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {fileCount}/{MAX_FILES} files
              </p>
              <p className="mt-1 text-xs text-slate-500">{totalSizeMB} MB selected</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Location</p>
                <MapPin size={18} className="text-emerald-600" />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {form.latitude != null && form.longitude != null ? "Location set" : "Not set yet"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{previewLocation}</p>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-2xl border p-4 text-sm whitespace-pre-wrap ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Incident details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep it short, specific, and factual.
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

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  required
                  maxLength={MAX_TITLE}
                  placeholder="Incident title"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Make it descriptive and precise.</span>
                  <span>{titleCount}/{MAX_TITLE}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  required
                  maxLength={MAX_DESC}
                  placeholder="Describe what happened, where it happened, and anything the responder should know..."
                  className="min-h-40 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Optional details like direction, people involved, or nearby landmarks help.</span>
                  <span>{descCount}/{MAX_DESC}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <div className="relative">
                    <Filter
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((item) => {
                      const active = form.priority === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setForm({ ...form, priority: item.value })}
                          className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${
                            active ? item.active : item.idle
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="mt-1 text-xs opacity-80">{item.helper}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Anonymous level
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {ANON_OPTIONS.map((item) => {
                    const active = form.anonymousLevel === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setForm({ ...form, anonymousLevel: item.value })}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          active ? item.active : item.idle
                        }`}
                      >
                        <div>{item.label}</div>
                        <div className="mt-1 text-xs opacity-80">{item.helper}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Location</h3>
                    <p className="text-xs text-slate-500">
                      Choose manually on the map or auto-detect your current position.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <LocateFixed size={16} />
                        Use current GPS
                      </>
                    )}
                  </button>
                </div>

                <LocationPicker
                  initialPosition={
                    form.latitude != null && form.longitude != null
                      ? [form.latitude, form.longitude]
                      : null
                  }
                  onChange={(lat, lng, address) => {
                    setForm((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      address: address || prev.address,
                    }));
                  }}
                  height={330}
                />

                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                  <span>
                    {locationNote || "Tip: click the map to drop a pin, drag it, or search nearby."}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {form.latitude != null && form.longitude != null
                        ? formatCoords([form.latitude, form.longitude])
                        : "No coords yet"}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          form.latitude != null && form.longitude != null
                            ? formatCoords([form.latitude, form.longitude])
                            : ""
                        )
                      }
                      disabled={form.latitude == null || form.longitude == null}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                      <Upload size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Attach evidence</h3>
                      <p className="text-xs text-slate-500">
                        Images or videos only. Up to {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each.
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                    <FileUp size={16} />
                    Choose files
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </label>
                </div>

                {attachmentNote && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {attachmentNote}
                  </div>
                )}

                {attachments.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {attachments.map((item, idx) => {
                      const isImage = item.file.type.startsWith("image/");
                      const isVideo = item.file.type.startsWith("video/");

                      return (
                        <div
                          key={`${item.file.name}-${idx}`}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="aspect-square bg-slate-100">
                            {isImage ? (
                              <img
                                src={item.url}
                                alt={item.file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : isVideo ? (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                <div className="text-center">
                                  <Video size={24} className="mx-auto" />
                                  <p className="mt-2 text-xs">Video</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-600">
                                <ImageIcon size={22} />
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-200 p-3">
                            <div className="truncate text-xs font-medium text-slate-700">
                              {item.file.name}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-90 transition hover:bg-black"
                            title="Remove file"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No files attached yet.
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{attachments.length} of {MAX_FILES} used</span>
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-slate-700 hover:underline"
                    disabled={attachments.length === 0}
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Report Incident
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/student/incidents")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View my incidents
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Live preview</h3>
                  <p className="text-sm text-slate-500">This is how the report reads to security.</p>
                </div>
                <Sparkles className="text-amber-500" size={18} />
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/15 text-white">{selectedPriorityMeta.label}</Badge>
                    <Badge className="bg-white/15 text-white">{selectedCategoryLabel}</Badge>
                  </div>
                  <h4
  title={form.title}
  className="mt-3 text-xl font-semibold break-all line-clamp-2 max-w-full overflow-hidden"
>
                    {form.title.trim() || "Incident title preview"}
                  </h4>
                  <p
  title={form.description}
  className="mt-2 text-sm leading-6 text-white/80 break-all line-clamp-3 max-w-full overflow-hidden"
>
                    {form.description.trim() || "Description preview"}
                  </p>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Clock3 size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Anonymous level</p>
                      <p className="text-sm font-medium text-slate-900">{selectedAnonMeta.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="truncate text-sm font-medium text-slate-900">{previewLocation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <div className="text-xs text-slate-500">Title</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{titleCount}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <div className="text-xs text-slate-500">Desc</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{descCount}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <div className="text-xs text-slate-500">Files</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{fileCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">What happens next</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  1. Your report is sent to the backend with location and details.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  2. Any attached photos or videos are uploaded against the created incident.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  3. You will be redirected to your incident list after successful submission.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Quick tips</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  Keep the title short and clear so security can triage it quickly.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  If the issue is urgent, use a high priority and pin the exact location.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  Attach only the most useful evidence. Too many files can slow review.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}