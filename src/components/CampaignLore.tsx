"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useGame } from "@/lib/GameContext";
import { queryCampaignLore } from "@/lib/api";
import { getEpisode } from "@/data/campaigns";
import type {
  CampaignEpisode,
  CampaignSegment,
  CastMember,
} from "@/data/campaigns/campaign4-schema";

type Tab = "browse" | "chat" | "cast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { segment_id: string; content: string; type: string }[];
}

const SEGMENT_COLORS: Record<string, string> = {
  chapter_start: "text-dnd-gold",
  narration: "text-amber-200",
  dialogue: "text-sky-300",
  combat: "text-dnd-red-light",
  description: "text-emerald-300",
  ooc: "text-gray-400",
};

const SEGMENT_ICONS: Record<string, string> = {
  chapter_start: "📖",
  narration: "📜",
  dialogue: "💬",
  combat: "⚔️",
  description: "🎭",
  ooc: "🎲",
};

const SEGMENT_LABELS: Record<string, string> = {
  chapter_start: "CHAPTER",
  narration: "NARRATION",
  dialogue: "DIALOGUE",
  combat: "COMBAT",
  description: "ACTION",
  ooc: "OOC",
};

const PAGE_SIZE = 40;

function SegmentRow({ seg }: { seg: CampaignSegment }) {
  const [expanded, setExpanded] = useState(false);
  const speakerShort = seg.speaker.split("(")[0].trim();

  return (
    <div
      className="border-b border-dnd-border/30 px-2.5 py-2 hover:bg-dnd-muted/30 cursor-pointer transition-colors group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]">{SEGMENT_ICONS[seg.type] || "·"}</span>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider ${SEGMENT_COLORS[seg.type] || "text-gray-400"}`}
        >
          {SEGMENT_LABELS[seg.type] || seg.type}
        </span>
        <span className="text-[9px] text-dnd-text-muted opacity-60">
          {seg.segment_id}
        </span>
        {speakerShort && speakerShort !== "Unknown" && (
          <span className="text-[10px] text-dnd-gold/80 ml-auto truncate max-w-[120px] font-medium">
            {speakerShort}
          </span>
        )}
        <span className="text-[10px] text-dnd-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      <p
        className={`text-xs text-dnd-text/90 mt-1 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
      >
        {seg.content}
      </p>
      {expanded && (
        <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-dnd-purple/30">
          {seg.summary && (
            <div className="text-[10px] text-amber-300/90 bg-dnd-gold/10 rounded px-2 py-1 italic">
              {seg.summary}
            </div>
          )}
          {seg.location && (
            <div className="text-[10px] text-dnd-text-muted">
              📍 <span className="text-dnd-text">{seg.location}</span>
            </div>
          )}
          {seg.characters_present.length > 0 && (
            <div className="text-[10px] text-dnd-text-muted">
              👥{" "}
              <span className="text-dnd-text">
                {seg.characters_present.join(", ")}
              </span>
            </div>
          )}
          {seg.metadata?.lore_keywords && seg.metadata.lore_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {seg.metadata.lore_keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[8px] bg-dnd-purple/20 text-dnd-purple border border-dnd-purple/30 rounded-full px-1.5 py-0.5"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CastCard({ member, segments }: { member: CastMember; segments: CampaignSegment[] }) {
  const segCount = useMemo(
    () =>
      segments.filter((s) =>
        s.speaker.toLowerCase().includes(member.character.toLowerCase().split(" ")[0])
      ).length,
    [member.character, segments]
  );

  return (
    <div className="flex items-start gap-2.5 bg-dnd-dark/80 rounded-lg px-3 py-2 border border-dnd-border/50 hover:border-dnd-gold/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dnd-gold/30 to-dnd-purple/30 flex items-center justify-center text-dnd-gold text-xs font-bold shrink-0 mt-0.5 border border-dnd-gold/20">
        {member.character[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-dnd-text font-semibold">
          {member.character}
        </div>
        <div className="text-[10px] text-dnd-text-muted">{member.player}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {member.race && (
            <span className="text-[9px] text-dnd-gold/70">{member.race}</span>
          )}
          {member.class && (
            <span className="text-[9px] text-dnd-purple/90">{member.class}</span>
          )}
          <span className="text-[9px] text-dnd-text-muted ml-auto">
            {segCount} lines
          </span>
        </div>
      </div>
    </div>
  );
}

function CastTab({ episode }: { episode: CampaignEpisode }) {
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-dnd-text-muted">
          DM:{" "}
          <span className="text-dnd-gold font-semibold">
            {episode.campaign.dm}
          </span>
        </div>
        <div className="text-[10px] text-dnd-text-muted">
          World:{" "}
          <span className="text-dnd-text font-medium">
            {episode.campaign.world}
          </span>
        </div>
      </div>

      <div className="bg-dnd-purple/10 border border-dnd-purple/20 rounded-lg px-3 py-2 mb-2">
        <div className="text-[10px] text-dnd-purple font-semibold mb-0.5">
          Episode {episode.episode.number}: {episode.episode.title}
        </div>
        <div className="text-[9px] text-dnd-text-muted">
          {episode.episode.total_segments} segments ·{" "}
          {episode.campaign.system}
        </div>
      </div>

      {episode.cast.map((member) => (
        <CastCard key={member.character} member={member} segments={episode.segments} />
      ))}
    </div>
  );
}

function StatsBar({ segments }: { segments: CampaignSegment[] }) {
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of segments) {
      counts[s.type] = (counts[s.type] || 0) + 1;
    }
    return counts;
  }, [segments]);

  const total = segments.length;

  return (
    <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden bg-dnd-dark">
      {Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => {
          const colors: Record<string, string> = {
            dialogue: "bg-sky-400",
            ooc: "bg-gray-500",
            narration: "bg-amber-400",
            description: "bg-emerald-400",
            combat: "bg-red-400",
            chapter_start: "bg-dnd-gold",
          };
          return (
            <div
              key={type}
              className={`${colors[type] || "bg-gray-600"} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${SEGMENT_LABELS[type] || type}: ${count}`}
            />
          );
        })}
    </div>
  );
}

export default function CampaignLore() {
  const { state } = useGame();

  const episode = useMemo(() => {
    try {
      const stored = localStorage.getItem("dnd-session");
      if (stored) {
        const epNum = JSON.parse(stored).episodeNumber ?? 1;
        return getEpisode(epNum);
      }
    } catch { /* fall through */ }
    return getEpisode(1);
  }, []);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("browse");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [speakerFilter, setSpeakerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    setPage(0);
    browseRef.current?.scrollTo(0, 0);
  }, [typeFilter, speakerFilter, searchQuery]);

  const speakers = useMemo(() => {
    const set = new Set<string>();
    for (const s of episode.segments) {
      if (s.speaker && s.speaker !== "Multiple" && s.speaker !== "NPC (DM)") {
        set.add(s.speaker);
      }
    }
    return Array.from(set).sort();
  }, []);

  const filteredSegments = useMemo(() => {
    let segs = episode.segments;
    if (typeFilter !== "all") {
      segs = segs.filter((s) => s.type === typeFilter);
    }
    if (speakerFilter !== "all") {
      segs = segs.filter((s) => s.speaker === speakerFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      segs = segs.filter(
        (s) =>
          s.content.toLowerCase().includes(q) ||
          s.speaker.toLowerCase().includes(q) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.summary && s.summary.toLowerCase().includes(q)) ||
          (s.metadata?.lore_keywords &&
            s.metadata.lore_keywords.some((kw) => kw.toLowerCase().includes(q)))
      );
    }
    return segs;
  }, [typeFilter, speakerFilter, searchQuery]);

  const pagedSegments = useMemo(
    () => filteredSegments.slice(0, (page + 1) * PAGE_SIZE),
    [filteredSegments, page]
  );

  const hasMore = pagedSegments.length < filteredSegments.length;

  const handleChat = useCallback(async (directQuestion?: string) => {
    const q = (directQuestion || chatInput).trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatLoading(true);

    try {
      const resp = await queryCampaignLore(state.sessionId, q, 4, 0);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: resp.answer, sources: resp.sources },
      ]);
    } catch {
      const localResults = episode.segments
        .filter(
          (s) =>
            s.content.toLowerCase().includes(q.toLowerCase()) ||
            (s.metadata?.lore_keywords &&
              s.metadata.lore_keywords.some((kw) =>
                kw.toLowerCase().includes(q.toLowerCase())
              ))
        )
        .slice(0, 5);

      if (localResults.length > 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I found ${localResults.length} relevant segment(s) in the transcript:\n\n${localResults
              .map(
                (s) =>
                  `[${s.segment_id}] ${s.speaker}: "${s.content.slice(0, 150)}${s.content.length > 150 ? "..." : ""}"`
              )
              .join("\n\n")}`,
            sources: localResults.map((s) => ({
              segment_id: s.segment_id,
              content: s.content.slice(0, 100),
              type: s.type,
            })),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "The campaign lore AI is not available right now. I searched the transcript locally but couldn't find a match. Try different keywords.",
          },
        ]);
      }
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, state.sessionId]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-t border-dnd-border bg-gradient-to-r from-dnd-surface to-dnd-purple/5 px-3 py-2.5 shrink-0 w-full text-left hover:from-dnd-muted/30 hover:to-dnd-purple/10 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📜</span>
          <span className="text-dnd-purple text-xs font-bold tracking-wide">
            CAMPAIGN LORE
          </span>
          <span className="ml-auto text-[9px] text-dnd-purple/60 border border-dnd-purple/30 rounded px-1.5 py-0.5">
            Open
          </span>
        </div>
        <div className="mt-1">
          <StatsBar segments={episode.segments} />
        </div>
        <div className="text-[9px] text-dnd-text-muted mt-1">
          E{episode.episode.number}: {episode.episode.title} ·{" "}
          {episode.segments.length} segments · {episode.cast.length} cast
        </div>
      </button>
    );
  }

  const panelHeight = expanded ? "70vh" : "380px";

  return (
    <div
      className="border-t border-dnd-border bg-dnd-surface flex flex-col shrink-0 transition-all duration-200"
      style={{ height: panelHeight, maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-dnd-border flex items-center gap-2 shrink-0 bg-gradient-to-r from-dnd-surface to-dnd-purple/5">
        <span className="text-sm">📜</span>
        <span className="text-dnd-purple text-xs font-bold tracking-wide">
          CAMPAIGN LORE
        </span>
        <span className="text-[9px] text-dnd-text-muted truncate">
          {episode.episode.title}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-dnd-text-muted hover:text-dnd-purple transition-colors px-1"
            title={expanded ? "Shrink" : "Expand"}
          >
            {expanded ? "◇" : "◆"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
            className="text-[10px] text-dnd-text-muted hover:text-dnd-red-light transition-colors px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dnd-border shrink-0">
        {(["browse", "chat", "cast"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-[10px] font-medium uppercase tracking-wider py-1.5 transition-colors ${
              tab === t
                ? "text-dnd-purple border-b-2 border-dnd-purple bg-dnd-purple/5"
                : "text-dnd-text-muted hover:text-dnd-text"
            }`}
          >
            {t === "browse"
              ? `📜 Transcript (${episode.segments.length})`
              : t === "chat"
                ? "💬 Ask AI"
                : `👥 Cast (${episode.cast.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === "browse" && (
          <>
            {/* Search + Filters */}
            <div className="px-2 py-1.5 border-b border-dnd-border/50 shrink-0 space-y-1.5">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full bg-dnd-dark border border-dnd-border text-gray-200 text-[10px] rounded px-2 py-1 placeholder-gray-600 focus:outline-none focus:border-dnd-purple"
              />
              <div className="flex gap-1 overflow-x-auto">
                {[
                  "all",
                  "narration",
                  "dialogue",
                  "combat",
                  "description",
                  "ooc",
                ].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`text-[8px] px-1.5 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                      typeFilter === f
                        ? "bg-dnd-purple/20 border-dnd-purple text-dnd-purple"
                        : "bg-dnd-dark border-dnd-border/50 text-dnd-text-muted hover:text-dnd-text"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : `${SEGMENT_ICONS[f] || ""} ${SEGMENT_LABELS[f] || f}`}
                  </button>
                ))}
              </div>
              <select
                value={speakerFilter}
                onChange={(e) => setSpeakerFilter(e.target.value)}
                className="w-full bg-dnd-dark border border-dnd-border/50 text-gray-300 text-[10px] rounded px-2 py-0.5 focus:outline-none focus:border-dnd-purple"
              >
                <option value="all">All speakers</option>
                {speakers.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
              <div className="text-[9px] text-dnd-text-muted">
                {filteredSegments.length} segment
                {filteredSegments.length !== 1 ? "s" : ""} found
              </div>
            </div>
            <div
              ref={browseRef}
              className="flex-1 overflow-y-auto game-scroll min-h-0"
            >
              {pagedSegments.length === 0 ? (
                <div className="text-center text-[10px] text-dnd-text-muted py-8">
                  No segments match your filters
                </div>
              ) : (
                <>
                  {pagedSegments.map((seg) => (
                    <SegmentRow key={seg.segment_id} seg={seg} />
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="w-full text-center text-[10px] text-dnd-purple hover:text-dnd-gold py-3 border-t border-dnd-border/30 transition-colors"
                    >
                      Load more ({filteredSegments.length - pagedSegments.length}{" "}
                      remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {tab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 game-scroll min-h-0">
              {chatMessages.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-2xl mb-2">🔮</div>
                  <p className="text-[10px] text-dnd-text-muted mb-3">
                    Ask about the campaign world, characters, lore, or plot.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {[
                      "Who is Thjazi Fang?",
                      "Describe Dol-Makjar",
                      "What is farramh?",
                      "Who are the main characters?",
                      "What happened at the execution?",
                      "Tell me about Aramán",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleChat(q)}
                        className="text-[9px] text-dnd-purple bg-dnd-purple/10 border border-dnd-purple/30 rounded-full px-2.5 py-1 hover:bg-dnd-purple/20 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={msg.role === "user" ? "flex justify-end" : ""}
                >
                  <div
                    className={`text-xs rounded-lg px-3 py-2 max-w-[92%] ${
                      msg.role === "user"
                        ? "bg-dnd-purple/20 border border-dnd-purple/30 text-dnd-text"
                        : "bg-dnd-muted border border-dnd-border text-dnd-text"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dnd-border/50">
                        <div className="text-[9px] text-dnd-text-muted mb-1 font-medium">
                          Sources:
                        </div>
                        {msg.sources.map((s, j) => (
                          <div
                            key={j}
                            className="text-[9px] text-dnd-text-muted flex items-center gap-1"
                          >
                            <span className="text-dnd-purple font-medium">
                              {s.segment_id}
                            </span>
                            <span className="opacity-60">({s.type})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-1.5 px-2 py-1">
                  <div
                    className="w-1.5 h-1.5 bg-dnd-purple rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-dnd-purple rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-dnd-purple rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t border-dnd-border shrink-0">
              <div className="flex gap-1.5">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder="Ask about the campaign..."
                  className="flex-1 min-w-0 bg-dnd-dark border border-dnd-border text-gray-200 text-xs rounded px-2.5 py-1.5 placeholder-gray-600 focus:outline-none focus:border-dnd-purple"
                  disabled={chatLoading}
                />
                <button
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="shrink-0 bg-dnd-purple hover:bg-dnd-purple/80 disabled:opacity-40 text-white text-xs font-bold rounded px-3 py-1.5 transition-colors"
                >
                  Ask
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "cast" && (
          <div className="flex-1 overflow-y-auto game-scroll min-h-0">
            <CastTab episode={episode} />
          </div>
        )}
      </div>
    </div>
  );
}
