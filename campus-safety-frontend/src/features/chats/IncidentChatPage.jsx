import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { jwtDecode } from "jwt-decode";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  Lock,
  MessageSquareText,
  Send,
  ShieldCheck,
  User,
  AlertTriangle,
  Eye,
} from "lucide-react";

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function mergeUniqueById(prev = [], incoming) {
  const list = Array.isArray(prev) ? [...prev] : [];
  if (!incoming || incoming.id == null) return list;

  const exists = list.some((m) => m.id === incoming.id);
  if (exists) {
    return list.map((m) => (m.id === incoming.id ? incoming : m));
  }

  return [...list, incoming].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );
}

function ChatLockBanner({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-start gap-3">
        <Eye className="mt-0.5" size={16} />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-amber-800">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export default function IncidentChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const token = localStorage.getItem("token");
  let decodedToken = null;
  try {
    if (token) decodedToken = jwtDecode(token);
  } catch {
    decodedToken = null;
  }

  const currentUserId = user?.id ?? decodedToken?.id ?? null;
  const currentEmail = (user?.email || decodedToken?.sub || localStorage.getItem("email") || "")
    .trim()
    .toLowerCase();
  const currentRole = user?.role ?? decodedToken?.role ?? localStorage.getItem("role");

  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const clientRef = useRef(null);
  const subRef = useRef(null);

  const canView = useMemo(() => {
    return ["STUDENT", "SECURITY", "ADMIN"].includes(currentRole);
  }, [currentRole]);

  const isAdmin = currentRole === "ADMIN";
  const isOwnerAdmin =
    isAdmin &&
    incident?.ownerAdmin &&
    String(incident.ownerAdmin.id) === String(currentUserId);

  const isOtherAdmin =
    isAdmin &&
    incident?.ownerAdmin &&
    String(incident.ownerAdmin.id) !== String(currentUserId);

  const isClosed = incident?.status === "CLOSED";

  // Important:
  // Student access is already enforced by the backend getIncidentDetail() method.
  // So the send permission should not depend on hidden reporter fields.
  const canSendMessage = useMemo(() => {
    if (!incident) return false;
    if (isOtherAdmin) return false;
    if (isClosed) return false;

    if (currentRole === "ADMIN") return true;
    if (currentRole === "SECURITY") return true;
    if (currentRole === "STUDENT") return true;

    return false;
  }, [incident, currentRole, isOtherAdmin, isClosed]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [incidentRes, chatRes] = await Promise.all([
        axiosClient.get(`/incidents/${id}/detail`),
        axiosClient.get(`/incidents/${id}/chat`),
      ]);

      setIncident(incidentRes.data || null);
      setMessages(Array.isArray(chatRes.data) ? chatRes.data : []);
    } catch (e) {
      console.error("Failed to load chat", e);
      setError(
        e?.response?.data?.message ||
          "Failed to load incident chat. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      setError("You do not have access to this chat.");
      setLoading(false);
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canView, currentRole, currentUserId]);

  useEffect(() => {
    const wsToken = localStorage.getItem("token");
    if (!wsToken || !canView) return;

    const socket = new SockJS(
      `https://campus-safety-and-incident-reporting-08jc.onrender.com/ws?token=${encodeURIComponent(wsToken)}`
    );

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${wsToken}` },
      debug: () => {},
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setConnected(true);

      subRef.current = client.subscribe(`/topic/incidents/${id}/chat`, (msg) => {
        try {
          const incoming = JSON.parse(msg.body);
          setMessages((prev) => mergeUniqueById(prev, incoming));
        } catch (err) {
          console.warn("Invalid chat message received", err);
        }
      });
    };

    client.onWebSocketClose = () => setConnected(false);
    client.onStompError = () => setConnected(false);

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);

      if (subRef.current) {
        subRef.current.unsubscribe();
        subRef.current = null;
      }

      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [id, canView]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!canSendMessage) {
      setError("You are in view-only mode for this incident.");
      return;
    }

    const message = text.trim();
    if (!message) return;

    try {
      setSending(true);
      setError("");

      const res = await axiosClient.post(`/incidents/${id}/chat`, {
        message,
      });

      if (res.data) {
        setMessages((prev) => mergeUniqueById(prev, res.data));
      }

      setText("");
    } catch (e) {
      console.error("Failed to send message", e);
      setError(e?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const incidentTitle = incident?.title || `Incident #${id}`;
  const status = incident?.status || "UNKNOWN";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin" size={20} />
            Loading chat...
          </div>
        </div>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5" size={20} />
            <div>
              <h1 className="text-lg font-semibold">Chat unavailable</h1>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                <ArrowLeft size={16} />
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMine = (msg) => {
    if (currentUserId != null && msg.senderId != null) {
      return String(msg.senderId) === String(currentUserId);
    }
    return msg.senderRole === currentRole;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to incident
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            {connected ? "Live connected" : "Connecting..."}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  <MessageSquareText size={14} />
                  Incident chat
                </div>

                <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
                  {incidentTitle}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Use this thread to coordinate between student, security, and admin for this incident.
                </p>
              </div>

              <div className="grid gap-3 md:min-w-[260px]">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-wide text-slate-300">
                    Current status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{status}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-wide text-slate-300">
                    Access
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {currentRole || "USER"}
                  </div>
                </div>

                {isAdmin && (
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="text-[11px] uppercase tracking-wide text-slate-300">
                      Admin ownership
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {incident?.ownerAdmin?.name || "Not assigned yet"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isOtherAdmin && (
          <ChatLockBanner
            title="View only mode"
            subtitle={`This incident chat is controlled by ${incident?.ownerAdmin?.name || "another admin"}. You can read messages, but only the owner admin can send or modify this incident.`}
          />
        )}

        {isClosed && (
          <ChatLockBanner
            title="Incident closed"
            subtitle="This incident has been closed. The chat remains available for viewing history."
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                  <p className="text-sm text-slate-500">
                    Messages are stored and synced in real time.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <Lock size={14} />
                  Incident-linked
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5 custom-scroll">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const mine = isMine(msg);

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-sm ${
                            mine
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                            {mine ? <User size={13} /> : <ShieldCheck size={13} />}
                            <span className="font-medium">
                              {msg.senderName || "Unknown"}
                            </span>
                            <span>•</span>
                            <span>{msg.senderRole || "USER"}</span>
                          </div>

                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {msg.message}
                          </p>

                          <div
                            className={`mt-2 flex items-center gap-1 text-[11px] ${
                              mine ? "text-white/70" : "text-slate-500"
                            }`}
                          >
                            <Clock3 size={12} />
                            {formatDateTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              {canSendMessage ? (
                <form onSubmit={sendMessage} className="flex items-end gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Type your message..."
                    className="min-h-[84px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="inline-flex h-[84px] items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send
                  </button>
                </form>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {isOtherAdmin
                    ? "View only mode — another admin owns this incident."
                    : "You do not have permission to send messages in this chat."}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Incident summary</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Title</div>
                  <div className="mt-1 font-semibold text-slate-900">{incidentTitle}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Category</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {incident?.category || "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Priority</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {incident?.priority || "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Owner admin</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {incident?.ownerAdmin?.name || "Not assigned"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Chat rules</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  Keep messages directly related to the incident.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  Student, security, and the owner admin can send messages.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  Other admins can view only.
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}