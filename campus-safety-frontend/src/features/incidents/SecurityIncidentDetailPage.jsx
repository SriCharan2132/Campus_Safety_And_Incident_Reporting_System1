import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import StatusActions from "../../components/StatusActions";
import MediaCarousel from "../../components/MediaCarousel";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";
import MapView from "../../components/MapView";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  User,
  Mail,
  CalendarDays,
  MapPinned,
  History,
  Loader2,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Building2,
  BadgeAlert,
  MessageSquareText,
  Star,
  Lock,
  Send,
  Sparkles,
  Route,
  Upload,
  FileUp,
  Paperclip,
} from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    REPORTED: {
      text: "Reported",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    UNDER_REVIEW: {
      text: "Under review",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    ACTION_TAKEN: {
      text: "Action taken",
      className: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
    },
    RESOLVED: {
      text: "Resolved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    CLOSED: {
      text: "Closed",
      className: "bg-slate-900 text-white border-slate-900",
      dot: "bg-white/80",
    },
  };

  const meta = map[status] || {
    text: status || "Unknown",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${meta.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.text}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CRITICAL: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${
        map[priority] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {priority || "UNKNOWN"}
    </span>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mt-0.5 rounded-xl bg-slate-50 p-2 text-slate-600">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function Timeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No history yet.
      </div>
    );
  }

  return (
    
    <div className="space-y-4">
      {history.map((h, i) => (
        <div key={i} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-700">{i + 1}</span>
            </div>
            {i !== history.length - 1 && <div className="mt-2 h-full w-px bg-slate-200" />}
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {h.oldStatus} → {h.newStatus}
                </span>
              </div>

              <span className="text-xs text-slate-500">
                {h.changedAt
                  ? format(new Date(h.changedAt), "dd MMM yyyy • HH:mm")
                  : "—"}
              </span>
            </div>

            {h.remarks && (
              <p className="mt-3 text-sm leading-6 text-slate-600">{h.remarks}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <User size={13} />
                {h.changedByName || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, disabled = false }) {
  return (
    
    <div className="flex items-center gap-1">
      
      {Array.from({ length: 5 }).map((_, idx) => {
        const star = idx + 1;
        const active = star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`rounded-lg p-1 transition ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:scale-110"
            }`}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={22}
              className={active ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          </button>
        );
      })}
    </div>
  );
}

function TrackingStep({ step, index, last }) {
  const done = !!step.completed;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm ${
            done
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          {done ? (
            <CheckCircle2 size={18} />
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>
        {!last && (
          <div className={`mt-2 h-full w-px ${done ? "bg-emerald-200" : "bg-slate-200"}`} />
        )}
      </div>

      <div
        className={`flex-1 rounded-2xl border p-4 shadow-sm ${
          done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{step.label}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {step.status}
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {step.completedAt
              ? format(new Date(step.completedAt), "dd MMM yyyy • HH:mm")
              : "Pending"}
          </div>
        </div>
      </div>
    </div>
  );
}

function RemarkCard({ remark }) {
  if (!remark) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Student feedback</h2>
          <p className="mt-1 text-sm text-slate-500">
            Feedback submitted after the incident was closed.
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
          <MessageSquareText size={18} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">
            Submitted by {remark.studentName || "Student"}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const star = idx + 1;
              return (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= (remark.stars || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }
                />
              );
            })}
          </div>
        </div>

        {remark.message && (
          <p className="mt-4 text-sm leading-6 text-slate-700">{remark.message}</p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          {remark.createdAt ? format(new Date(remark.createdAt), "dd MMM yyyy • HH:mm") : "—"}
        </p>
      </div>
    </div>
  );
}

function RemarkForm({ incidentId, onSaved, disabled }) {
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (stars < 1 || stars > 5) {
      setFormError("Please choose a rating from 1 to 5.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await axiosClient.post(`/incidents/${incidentId}/remark`, {
        stars,
        message: message.trim() || null,
      });

      onSaved?.();
    } catch (err) {
      console.error("Failed to submit remark", err);
      setFormError(
        err?.response?.data?.message || "Could not submit your feedback. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Share your feedback</h2>
          <p className="mt-1 text-sm text-slate-500">
            Visible only after the incident is closed. One submission per incident.
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
          <Sparkles size={18} />
        </div>
      </div>

      {formError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
        <StarRating value={stars} onChange={setStars} disabled={disabled || saving} />
        <p className="mt-2 text-xs text-slate-500">1 = poor, 5 = excellent</p>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Message <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Share anything that would help us improve the response..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
        />
        <div className="mt-2 text-right text-xs text-slate-400">
          {message.length}/2000
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Lock size={16} />
          Feedback can be submitted only once.
        </div>

        <button
          type="submit"
          disabled={disabled || saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Submit feedback
        </button>
      </div>
    </form>
  );
}

export default function SecurityIncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const role = user?.role;
  const currentUserId = user?.id ?? user?.userId ?? null;

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  
  const isOwnerAdmin =
    role === "ADMIN" &&
    incident?.ownerAdmin &&
    String(incident.ownerAdmin.id) === String(currentUserId);

  const isOtherAdmin =
    role === "ADMIN" &&
    incident?.ownerAdmin &&
    String(incident.ownerAdmin.id) !== String(currentUserId);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get(`/incidents/${id}/detail`);
      setIncident(res.data);
    } catch (err) {
      console.error("Failed to load incident", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load incident details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canAct = role === "SECURITY" || (role === "ADMIN" && !isOtherAdmin);
  const canAssign = role === "ADMIN" && !isOtherAdmin;
  const canChat = role === "STUDENT" || role === "SECURITY" || isOwnerAdmin;

  const isClosed = incident?.status === "CLOSED";

  const securityAssignedToMe =
    role === "SECURITY" &&
    incident?.assignedSecurity?.id != null &&
    String(incident.assignedSecurity.id) === String(currentUserId);

  const canUploadMedia =
    !isClosed &&
    ((role === "SECURITY" && securityAssignedToMe) ||
      (role === "ADMIN" && !isOtherAdmin));

  const createdLabel = incident?.createdAt
    ? format(new Date(incident.createdAt), "dd MMM yyyy • HH:mm")
    : "—";

  const hasMedia = incident?.media && incident.media.length > 0;
  const hasLocation = incident?.latitude != null && incident?.longitude != null;
  const canShowFeedback = isClosed || !!incident?.remark || !!incident?.canAddRemark;
  console.log({
  role,
  isClosed,
  assignedSecurity: incident?.assignedSecurity,
  currentUserId,
  securityAssignedToMe,
  canUploadMedia
});
  const handleFileChange = (e) => {
    setUploadError("");
    setUploadSuccess("");
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadError("");
    setUploadSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMediaUpload = async (e) => {
    e.preventDefault();

    if (!incident?.id) return;

    if (!selectedFile) {
      setUploadError("Please choose an image or video first.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      await axiosClient.post(`/incidents/${incident.id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadSuccess("Media uploaded successfully.");
      resetUpload();
      await fetchIncident();
    } catch (err) {
      console.error("Upload failed", err);
      setUploadError(
        err?.response?.data?.message || "Failed to upload media. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5" size={20} />
              <div>
                <h1 className="text-lg font-semibold">Could not load incident</h1>
                <p className="mt-1 text-sm">{error}</p>
                <button
                  onClick={fetchIncident}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={fetchIncident}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Clock3 size={16} />
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white md:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                      <ClipboardList size={14} />
                      Incident detail view
                    </div>

                    <h1 className="break-words text-2xl font-semibold tracking-tight md:text-3xl">
                      {incident.title}
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-[15px]">
                      {incident.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <PriorityBadge priority={incident.priority} />
                      <StatusBadge status={incident.status} />
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                        #{incident.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:min-w-[240px]">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-wide text-slate-300">
                        Reported
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{createdLabel}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-wide text-slate-300">
                        Category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {incident.category || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                <InfoChip icon={User} label="Reporter" value={incident.reporter?.name} />
                <InfoChip icon={Mail} label="Reporter email" value={incident.reporter?.email} />
                <InfoChip
                  icon={Building2}
                  label="Assigned security"
                  value={incident.assignedSecurity?.name || "Unassigned"}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Status tracking</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Delivery-style progress of the incident lifecycle.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">
                  <Route size={18} />
                </div>
              </div>

              {incident.trackingSteps && incident.trackingSteps.length > 0 ? (
                <div className="space-y-4">
                  {incident.trackingSteps.map((step, idx) => (
                    <TrackingStep
                      key={step.status || idx}
                      step={step}
                      index={idx}
                      last={idx === incident.trackingSteps.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No tracking data available.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Evidence media</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Uploaded images or videos attached to this incident.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={14} />
                  {hasMedia ? `${incident.media.length} file(s)` : "No files"}
                </span>
              </div>

              {canUploadMedia ? (
                <form
                  onSubmit={handleMediaUpload}
                  className="mb-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex-1 min-w-[250px]">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        <Upload size={14} />
                        Upload media
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-900">
                        Attach a photo or video
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Security can upload media while the incident remains open.
                        Images and videos only, up to 20MB.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[420px] lg:flex-row lg:items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      />

                      <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileUp size={16} />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                      <Paperclip size={13} />
                      {selectedFile.name}
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {uploadSuccess}
                    </div>
                  )}
                </form>
              ) : role === "SECURITY" && !isClosed ? (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Only the assigned security officer can upload media for this open incident.
                </div>
              ) : isClosed ? (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  This incident is closed, so media upload is disabled.
                </div>
              ) : null}

              {hasMedia ? (
                <MediaCarousel media={incident.media} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No media uploaded for this incident.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Location</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Exact coordinates and map view for the incident.
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <MapPinned size={14} />
                  {hasLocation ? "Pinned" : "Unavailable"}
                </span>
              </div>

              {hasLocation ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <MapView lat={incident.latitude} lng={incident.longitude} />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Coordinates are not available for this incident.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Incident history</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Status changes and remarks in chronological order.
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <History size={14} />
                  {incident.history?.length || 0}
                </span>
              </div>

              <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                <Timeline history={incident.history} />
              </div>
            </div>

            {canShowFeedback && (
              <div className="space-y-6">
                {incident.remark ? (
                  <RemarkCard remark={incident.remark} />
                ) : (
                  <RemarkForm
                    incidentId={incident.id}
                    onSaved={fetchIncident}
                    disabled={!incident.canAddRemark}
                  />
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Action center</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Security and admin controls for this incident.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">
                  <ShieldAlert size={18} />
                </div>
              </div>

              <div className="space-y-4">
                {incident.ownerAdmin && (
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Owned by {incident.ownerAdmin.name}
                  </div>
                )}

                {isOtherAdmin && (
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    View only — owned by another admin
                  </div>
                )}

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <BadgeAlert size={16} />
                      Current status
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <AlertTriangle size={16} />
                      Priority
                    </div>
                    <PriorityBadge priority={incident.priority} />
                  </div>
                </div>

                {incident.assignedSecurity && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Assigned to
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {incident.assignedSecurity.name}
                    </p>
                  </div>
                )}

                {canChat && (
                  <button
                    onClick={() => navigate(`${location.pathname}/chat`)}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900"
                  >
                    <MessageSquareText size={16} />
                    Open incident chat
                  </button>
                )}

                {canAct && !isOtherAdmin && (
                  <StatusActions
                    incidentId={incident.id}
                    status={incident.status}
                    refreshIncident={fetchIncident}
                  />
                )}

                {canAssign && !isOtherAdmin && (
                  <button
                    onClick={() => navigate(`/admin/incidents/${incident.id}/assign`)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${
                      incident.assignedSecurity
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    <ClipboardList size={16} />
                    {incident.assignedSecurity ? "Reassign Security" : "Assign Security"}
                  </button>
                )}
              </div>
            </div>

            {incident.reporter && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reporter</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Original incident submitter.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">
                    <User size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {incident.reporter.name}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {incident.reporter.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Snapshot</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    High-level details at a glance.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">
                  <MessageSquareText size={18} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <InfoChip icon={CalendarDays} label="Reported at" value={createdLabel} />
                <InfoChip
                  icon={MapPinned}
                  label="Coordinates"
                  value={
                    hasLocation
                      ? `${Number(incident.latitude).toFixed(6)}, ${Number(
                          incident.longitude
                        ).toFixed(6)}`
                      : "Unavailable"
                  }
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}