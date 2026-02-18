"use client";

import { useEffect, useRef, useState } from "react";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL!;

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; resource?: string; count?: number }
  | { role: "error"; text: string };

const SUGGESTIONS = [
  "What monsters live in forests?",
  "Fire spells for a wizard",
  "Swords for a treasure chest",
  "Heavy armor options",
];

export default function ReferenceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reference_chat", message: query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response ?? "No response received.",
          resource: data.resource,
          count: data.count,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: `Lookup failed: ${err instanceof Error ? err.message : "unknown error"}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="border-t border-dnd-border bg-dnd-surface flex flex-col"
      style={{ height: "300px" }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-dnd-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-dnd-gold text-xs font-bold tracking-wide">
            D&D REFERENCE
          </span>
          <span className="text-gray-500 text-xs">· AI</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-gray-600 hover:text-gray-400 text-xs"
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto game-scroll px-3 py-2 space-y-2"
      >
        {messages.length === 0 && !loading && (
          <div className="mt-2 space-y-2">
            <p className="text-gray-600 text-xs text-center">
              Ask anything about D&D 5e
            </p>
            <div className="grid grid-cols-1 gap-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-left text-xs text-gray-500 hover:text-dnd-gold-light bg-dnd-dark hover:bg-dnd-dark/80 rounded px-2 py-1.5 transition-colors border border-dnd-border hover:border-dnd-gold/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] bg-dnd-gold/20 border border-dnd-gold/30 rounded-lg px-3 py-2">
                  <p className="text-dnd-gold-light text-xs">{msg.text}</p>
                </div>
              </div>
            );
          }

          if (msg.role === "assistant") {
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[90%] bg-dnd-dark border border-dnd-border rounded-lg px-3 py-2 space-y-1">
                  <p className="text-gray-200 text-xs leading-relaxed">{msg.text}</p>
                  {msg.resource && (
                    <p className="text-gray-600 text-[10px]">
                      via Open5e · {msg.count} {msg.resource}{(msg.count ?? 0) !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          if (msg.role === "error") {
            return (
              <div key={i} className="flex justify-start">
                <p className="text-dnd-red text-xs italic px-1">{msg.text}</p>
              </div>
            );
          }

          return null;
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dnd-dark border border-dnd-border rounded-lg px-3 py-2">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_0.4s_infinite]" />
                <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_0.8s_infinite]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-dnd-border p-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about monsters, spells, items..."
          disabled={loading}
          className="flex-1 min-w-0 bg-dnd-dark border border-dnd-border text-gray-200 text-xs rounded px-2 py-1.5 placeholder-gray-600 focus:outline-none focus:border-dnd-gold disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="shrink-0 bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-40 text-dnd-dark text-xs font-bold rounded px-3 py-1.5 transition-colors"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
