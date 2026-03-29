import { useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";
import ChatBotWindow from "./ChatBotWindow";

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-3 right-3 z-[9999] flex items-center gap-3 rounded-full bg-slate-950 px-3 py-3 text-white shadow-2xl shadow-slate-950/25 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-900 sm:bottom-4 sm:right-4 sm:px-4"
          aria-label="Open assistant"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 sm:h-11 sm:w-11">
            <MessageSquareText size={21} />
          </span>

          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold">Campus Assistant</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <Sparkles size={12} />
              Ask about the system
            </span>
          </span>
        </button>
      )}

      {open && <ChatBotWindow onClose={() => setOpen(false)} />}
    </>
  );
}