"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const uid = () => Math.random().toString(36).slice(2);

const CHIP_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Occasion",
    items: [
      "Work Day",
      "Date Night",
      "Weekend Errand",
      "Cocktail Event",
      "Black Tie",
      "Travel Capsule",
    ],
  },
  {
    title: "Palette",
    items: [
      "Monochrome",
      "Jewel Tones",
      "Earthy Neutrals",
      "Soft Pastels",
      "Bold Contrast",
    ],
  },
  { title: "Vibe", items: ["Classic", "Modern", "Edgy", "Romantic", "Minimal"] },
];

export default function SmartStylePage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      text:
        "Hi! I’m SmartStyle. Ask me about silhouettes, fit, or how to style pieces you already own.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sending, setSending] = useState(false);

  // --- Visible viewport height fallback for older mobile browsers ---
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll to toggle button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      setShowScrollBtn(!nearBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const appendChip = (text: string) => {
    setInput((v) => (v ? `${v} ${text}` : text));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Msg = { id: uid(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/smartstyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-12),
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      const reply =
        data.reply ??
        "I couldn’t reach the style engine, but here’s a tip: anchor the look with one structured piece (jacket or trouser) and one fluid piece (silk, satin, drape) for balance.";

      const botMsg: Msg = { id: uid(), role: "assistant", text: reply };
      setMessages((m) => [...m, botMsg]);
    } catch {
      const botMsg: Msg = {
        id: uid(),
        role: "assistant",
        text:
          "Hmm, there was a connection hiccup. Quick style note: if you’re unsure on color, start with a monochrome base and add texture for depth.",
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-[100svh] min-h-[calc(var(--vh)*100)] bg-app-gradient">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Page header - now centered */}
        <header className="mb-4 md:mb-6 flex items-center justify-center gap-3 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
            SmartStyle
          </h1>
          <p className="text-slate-500">
            AI personal styling—tailored to your wardrobe.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: Chip Sections */}
          <aside className="space-y-4 lg:col-span-1">
            {CHIP_SECTIONS.map((s) => (
              <section
                key={s.title}
                className="card-glass ring-1 ring-black/5 shadow-xl"
              >
                <div className="px-5 pt-4">
                  <h2 className="text-base md:text-lg font-medium text-slate-800">
                    {s.title}
                  </h2>
                  <p className="text-xs text-slate-500 mb-3">
                    Choose a few to steer the advice.
                  </p>
                </div>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <button
                      key={item}
                      onClick={() => appendChip(item)}
                      className="chip"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </aside>

          {/* Right: Chat Panel */}
          <section className="lg:col-span-2">
            <div className="chat-main card-glass ring-1 ring-black/5 shadow-2xl">
              <div className="flex h-[60svh] h-[calc(var(--vh)*72)] flex-col">
                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3"
                >
                  {messages.map((m) => (
                    <div key={m.id} className="flex">
                      <div
                        className={
                          m.role === "user"
                            ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 text-white px-4 py-2 shadow-md"
                            : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 text-slate-800 px-4 py-2 shadow"
                        }
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-[15px]">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sticky bottom input */}
                <div className="sticky bottom-0 w-full border-t border-slate-200 bg-white/95 backdrop-blur px-3 md:px-4 py-3">
                  <div className="flex items-end gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder={
                        sending
                          ? "Sending…"
                          : "Ask SmartStyle… (Press Enter to send)"
                      }
                      disabled={sending}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400 shadow-sm disabled:opacity-60"
                    />
                    <button
                      onClick={send}
                      disabled={sending}
                      className="liquid-button"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="fixed right-4 bottom-[92px] md:right-6 md:bottom-[104px] btn-fab"
                aria-label="Scroll to latest"
                title="Scroll to latest"
              >
                ↓
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
