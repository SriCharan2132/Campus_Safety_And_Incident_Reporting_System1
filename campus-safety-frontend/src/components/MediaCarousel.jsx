import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
  PlayCircle,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://campus-safety-and-incident-reporting-08jc.onrender.com";

function resolveMediaUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function isImage(contentType) {
  return typeof contentType === "string" && contentType.startsWith("image/");
}

function isVideo(contentType) {
  return typeof contentType === "string" && contentType.startsWith("video/");
}

function getRoleKey(item) {
  return String(item?.uploaderType || "UNKNOWN").toUpperCase();
}

function getRoleMeta(roleKey) {
  if (roleKey === "STUDENT") {
    return {
      title: "Media uploaded by Students",
      subtitle: "Files shared by students for this incident.",
      accent: "from-emerald-500 to-teal-600",
      badge: "Student uploads",
      icon: ImageIcon,
    };
  }

  if (roleKey === "SECURITY") {
    return {
      title: "Media uploaded by Security",
      subtitle: "Files added by security staff while handling the case.",
      accent: "from-violet-500 to-indigo-600",
      badge: "Security uploads",
      icon: PlayCircle,
    };
  }

  return {
    title: "Other media",
    subtitle: "Files with an unrecognized uploader role.",
    accent: "from-slate-700 to-slate-900",
    badge: "Other",
    icon: FolderOpen,
  };
}

function MediaCard({ item, onOpen }) {
  const url = resolveMediaUrl(item.fileUrl);
  const image = isImage(item.contentType);
  const video = isVideo(item.contentType);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={url}
            alt="incident media"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : video ? (
          <video
            src={url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <FolderOpen className="h-8 w-8" />
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
          {image ? "Image" : video ? "Video" : "File"}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="space-y-1 p-3">
        <div className="line-clamp-1 text-sm font-semibold text-slate-900">
          {item.uploadedBy || "Unknown uploader"}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {item.uploadedAt
              ? format(new Date(item.uploadedAt), "dd MMM yyyy • HH:mm")
              : "—"}
          </span>

          {item.aiFlag ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              AI Flag
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function RoleSection({ roleKey, items, onOpen }) {
  const meta = getRoleMeta(roleKey);
  const count = items.length;
  const preview = items.slice(0, 4);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${meta.accent} px-3 py-1 text-xs font-semibold text-white shadow-sm`}
          >
            <meta.icon className="h-3.5 w-3.5" />
            {meta.badge}
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {meta.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{meta.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => count > 0 && onOpen(roleKey)}
          disabled={count === 0}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {count > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {preview.map((item) => (
            <MediaCard key={item.id} item={item} onOpen={() => onOpen(roleKey)} />
          ))}

          {count > 4 && (
            <button
              type="button"
              onClick={() => onOpen(roleKey)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
              <div className="relative flex aspect-video flex-col items-center justify-center p-4 text-center">
                <div className="text-3xl font-semibold">+{count - 4}</div>
                <div className="mt-1 text-sm text-white/75">more media</div>
                <div className="mt-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  Open gallery
                </div>
              </div>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <FolderOpen className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No {roleKey.toLowerCase()} media yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Uploaded files from this role will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function MediaModal({ open, title, items, onClose }) {
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm">
      <div
        className="flex h-full w-full items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          className="flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white sm:px-6">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-white/60">
                {items.length} {items.length === 1 ? "file" : "files"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Close media viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const url = resolveMediaUrl(item.fileUrl);
                const image = isImage(item.contentType);
                const video = isVideo(item.contentType);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-lg"
                  >
                    <div className="bg-black">
                      {image ? (
                        <img
                          src={url}
                          alt="incident media"
                          className="h-72 w-full object-contain"
                        />
                      ) : video ? (
                        <video
                          src={url}
                          controls
                          className="h-72 w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-72 items-center justify-center text-white/60">
                          Unsupported media type
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 p-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">
                          {item.uploadedBy || "Unknown uploader"}
                        </div>

                        {item.aiFlag ? (
                          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                            AI Flag
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/65">
                        <span>{item.uploaderType || "UNKNOWN"}</span>
                        <span>•</span>
                        <span>
                          {item.uploadedAt
                            ? format(new Date(item.uploadedAt), "dd MMM yyyy • HH:mm")
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MediaCarousel({ media = [] }) {
  const [openRole, setOpenRole] = useState(null);

  const grouped = useMemo(() => {
    const student = [];
    const security = [];
    const other = [];

    for (const item of media) {
      const roleKey = getRoleKey(item);
      if (roleKey === "STUDENT") student.push(item);
      else if (roleKey === "SECURITY") security.push(item);
      else other.push(item);
    }

    return {
      STUDENT: student,
      SECURITY: security,
      UNKNOWN: other,
    };
  }, [media]);

  const activeItems =
    openRole === "STUDENT"
      ? grouped.STUDENT
      : openRole === "SECURITY"
      ? grouped.SECURITY
      : grouped.UNKNOWN;

  const activeTitle =
    openRole === "STUDENT"
      ? "Media uploaded by Students"
      : openRole === "SECURITY"
      ? "Media uploaded by Security"
      : "Other media";

  if (!media || media.length === 0) {
    return <p className="text-sm text-slate-500">No media uploaded.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <RoleSection roleKey="STUDENT" items={grouped.STUDENT} onOpen={setOpenRole} />
        <RoleSection roleKey="SECURITY" items={grouped.SECURITY} onOpen={setOpenRole} />
      </div>

      {grouped.UNKNOWN.length > 0 && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Other media
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Files without a recognized uploader role.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenRole("UNKNOWN")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {grouped.UNKNOWN.slice(0, 4).map((item) => (
              <MediaCard key={item.id} item={item} onOpen={() => setOpenRole("UNKNOWN")} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {media.length} {media.length === 1 ? "media file" : "media files"} total
      </div>

      <MediaModal
        open={Boolean(openRole)}
        title={activeTitle}
        items={activeItems}
        onClose={() => setOpenRole(null)}
      />
    </div>
  );
}