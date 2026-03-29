import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import axiosClient from "../../api/axiosClient";
import {
  Bot,
  CircleHelp,
  Loader2,
  MessageCircle,
  Minimize2,
  RefreshCw,
  Send,
  Sparkles,
  X,
  PanelRightClose,
  ChevronDown,
} from "lucide-react";

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initialAssistantMessage() {
  return {
    id: makeId(),
    sender: "bot",
    text:
      "Hi, I’m your Campus Safety Assistant. Ask me about incidents, SOS, chat, notifications, media upload, dashboards, or user management.",
    createdAt: new Date().toISOString(),
  };
}

function getQuickPrompts(role) {
  const r = String(role || "").toUpperCase();

  if (r === "STUDENT") {
    return [
      "How do I report an incident?",
      "How do I check my incident status?",
      "How do I use SOS?",
      "Where can I view notifications?",
    ];
  }

  if (r === "SECURITY") {
    return [
      "How do I open assigned incidents?",
      "How do I upload media to an incident?",
      "How do I chat with the student?",
      "Where are active SOS alerts?",
    ];
  }

  if (r === "ADMIN") {
    return [
      "How do I assign an incident?",
      "How do I open incident chat?",
      "Where is the security analysis page?",
      "How do I monitor SOS alerts?",
    ];
  }

  if (r === "SYSTEM_ADMIN") {
    return [
      "How do I create a new user?",
      "How do I activate or deactivate a user?",
      "How do I edit user roles?",
      "Where is user management?",
    ];
  }

  return [
    "How do I use this system?",
    "How do I open notifications?",
    "How do I report an incident?",
    "How do I contact support?",
  ];
}

export default function ChatBotWindow({ onClose }) {
  const { user } = useAuth();

  const role = String(user?.role || localStorage.getItem("role") || "").toUpperCase();
  const email = String(user?.email || localStorage.getItem("email") || "").trim();

  const storageKey = useMemo(
    () => `csirs_chatbot_history_${email || role || "guest"}`,
    [email, role]
  );

  const quickPrompts = useMemo(() => getQuickPrompts(role), [role]);

  const [messages, setMessages] = useState([initialAssistantMessage()]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
      setMessages([initialAssistantMessage()]);
    } catch {
      setMessages([initialAssistantMessage()]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, minimized]);

  const appendMessage = (sender, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        sender,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const cleanReply = (text) => {
    const t = String(text || "").trim();
    if (!t) return "Sorry, I could not generate a response right now.";

    const lower = t.toLowerCase();
    if (
      lower.includes("openai") ||
      lower.includes("language model") ||
      lower.includes("i can't browse") ||
      lower.includes("i cannot browse") ||
      lower.includes("as an ai")
    ) {
      return "I can only help with the Campus Safety and Incident Reporting System.";
    }

    return t;
  };

  const handleSend = async (presetText) => {
    const text = String(presetText ?? input).trim();
    if (!text || sending) return;

    setError("");
    setInput("");
    appendMessage("user", text);
    setSending(true);

    try {
      const res = await axiosClient.post("/chatbot/message", {
        message: text,
      });

      const reply =
        res?.data?.response ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : "");

      appendMessage("bot", cleanReply(reply));
    } catch (err) {
      console.error("Chatbot request failed", err);
      const fallback =
        err?.response?.data?.message ||
        "Sorry, something went wrong. Please try again.";
      setError(fallback);
      appendMessage("bot", cleanReply(fallback));
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    const fresh = [initialAssistantMessage()];
    setMessages(fresh);
    setError("");
    setInput("");

    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleLabel =
    role === "SYSTEM_ADMIN"
      ? "System Admin Assistant"
      : role === "ADMIN"
      ? "Admin Assistant"
      : role === "SECURITY"
      ? "Security Assistant"
      : role === "STUDENT"
      ? "Student Assistant"
      : "Campus Assistant";

  const subtitle = "Ask only about the Campus Safety & Incident Reporting System.";

  if (minimized) {
    return (
      <div className="fixed bottom-3 right-3 z-[9999] sm:bottom-4 sm:right-4">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-3 rounded-full bg-slate-950 px-3 py-3 text-white shadow-2xl shadow-slate-950/25 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-900 sm:px-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 sm:h-11 sm:w-11">
            <Bot size={22} />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold">{roleLabel}</span>
            <span className="text-[11px] text-slate-300">Click to continue</span>
          </span>
          <ChevronDown size={16} className="text-slate-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-[9999] sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[340px] md:w-[360px] lg:w-[380px] xl:w-[400px]">
      <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.22)] sm:max-h-[560px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-3 py-3 text-white sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 sm:px-3">
                <Sparkles size={12} />
                Campus Safety Assistant
              </div>

              <h2 className="mt-2 text-sm font-semibold tracking-tight sm:text-base">
                {roleLabel}
              </h2>

              <p className="mt-1 text-[11px] leading-5 text-slate-300 sm:text-xs">
                {subtitle}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20 sm:px-3"
                title="Close chat"
              >
                <PanelRightClose size={14} />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </span>

              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <RefreshCw size={12} />
                Reset
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 sm:hidden"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 custom-scrollbar">
            <div className="space-y-3">
              {messages.map((msg) => {
                const mine = msg.sender === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-[13px] leading-5 shadow-sm sm:max-w-[88%] sm:px-4 sm:py-3 sm:text-sm sm:leading-6 ${
                        mine
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-[10px] font-medium opacity-80 sm:text-[11px]">
                        {mine ? <MessageCircle size={11} /> : <Bot size={11} />}
                        <span>{mine ? "You" : "Assistant"}</span>
                        <span>•</span>
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 shadow-sm sm:px-4 sm:py-3 sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </div>

          {messages.length <= 1 && (
            <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <CircleHelp size={13} />
                Quick questions
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSend(p)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[13px] text-slate-700 transition hover:border-slate-300 hover:bg-white sm:px-3 sm:py-3 sm:text-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="border-t border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] text-rose-700 sm:px-4 sm:text-sm">
              {error}
            </div>
          )}

          <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-end gap-2.5 sm:gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Ask a question about the system..."
                className="min-h-[50px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:min-h-[56px] sm:px-4 sm:text-sm"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="inline-flex h-[50px] items-center gap-2 rounded-2xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[56px] sm:px-4 sm:text-sm"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-slate-400 sm:text-[11px] sm:leading-5">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}