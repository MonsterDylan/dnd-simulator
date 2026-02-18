"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGame } from "@/lib/GameContext";
import { sendDmInput } from "@/lib/api";
import type { NarrativeEntry } from "@/lib/types";

function NarrativeEntryView({ entry }: { entry: NarrativeEntry }) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  const playAudio = useCallback(() => {
    if (!entry.audioBase64) return;
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${entry.audioBase64}`);
      audio.onended = () => setAudioPlaying(false);
      audio.onerror = () => setAudioPlaying(false);
      setAudioPlaying(true);
      audio.play();
    } catch {
      setAudioPlaying(false);
    }
  }, [entry.audioBase64]);

  switch (entry.type) {
    case "dm_input":
      return (
        <div className="flex justify-end">
          <div className="bg-dnd-gold/20 border border-dnd-gold/30 rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]">
            <div className="text-[10px] text-dnd-gold font-medium mb-1">
              Dungeon Master
            </div>
            <p className="text-sm text-dnd-text">{entry.content}</p>
          </div>
        </div>
      );

    case "narration":
      return (
        <div className="parchment-text">
          <p className="text-sm leading-relaxed">{entry.content}</p>
        </div>
      );

    case "npc_dialogue":
      return (
        <div className="flex items-start gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
            style={{ backgroundColor: entry.npcColor || "#6B7280" }}
          >
            {entry.npcName?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-xs font-medium"
                style={{ color: entry.npcColor || "#D1D5DB" }}
              >
                {entry.npcName}
              </span>
              {entry.audioBase64 && (
                <button
                  onClick={playAudio}
                  className={`text-dnd-text-muted hover:text-dnd-gold transition-colors ${
                    audioPlaying ? "text-dnd-gold animate-pulse" : ""
                  }`}
                  title="Play voice"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="bg-dnd-muted border border-dnd-border rounded-2xl rounded-tl-sm px-3 py-2">
              <p className="text-sm text-dnd-text">{entry.content}</p>
            </div>
          </div>
        </div>
      );

    case "combat_result":
      return (
        <div className="bg-dnd-muted/50 border border-dnd-border rounded-lg px-3 py-2">
          <p className="text-xs font-mono text-dnd-text">{entry.content}</p>
          {entry.rolls?.map((roll, i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-dnd-text-muted">
                {roll.purpose}:
              </span>
              <span className="text-xs font-mono text-dnd-gold">
                {roll.expression} = [{Array.isArray(roll.individual) ? roll.individual.join(", ") : roll.individual}]
                {roll.modifier !== 0 &&
                  ` ${roll.modifier > 0 ? "+" : ""}${roll.modifier}`}{" "}
                = <strong>{roll.total}</strong>
              </span>
            </div>
          ))}
        </div>
      );

    case "system":
      return (
        <div className="text-center">
          <span className="text-xs text-dnd-text-muted italic">
            {entry.content}
          </span>
        </div>
      );

    default:
      return null;
  }
}

export function NarrativeLog() {
  const { state, dispatch } = useGame();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.narrativeLog]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;

    const message = input.trim();
    setInput("");

    // Add DM message to log
    dispatch({
      type: "ADD_NARRATIVE",
      entry: {
        id: uuidv4(),
        type: "dm_input",
        content: message,
        timestamp: new Date(),
      },
    });

    dispatch({ type: "SET_LOADING", isLoading: true });

    try {
      // Build token positions map
      const tokenPositions: Record<string, [number, number]> = {};
      state.party.forEach((char) => {
        tokenPositions[char.name] = char.position;
      });

      const response = await sendDmInput(
        state.sessionId,
        message,
        tokenPositions,
        {
          mode: state.mode,
          party: state.party,
          scene: state.scene,
          combat: state.combat,
        }
      );

      // Build narrative entries from response
      const entries: NarrativeEntry[] = [];

      // Add main narrative
      if (response.narrative) {
        entries.push({
          id: uuidv4(),
          type: "narration",
          content: response.narrative,
          timestamp: new Date(),
        });
      }

      // Add NPC actions and dialogue
      if (response.npcActions) {
        for (const action of response.npcActions) {
          const char = state.party.find((c) => c.name === action.npcName);

          if (action.action) {
            entries.push({
              id: uuidv4(),
              type: "combat_result",
              content: `${action.npcName}: ${action.action}`,
              rolls: action.rolls,
              timestamp: new Date(),
            });
          }

          if (action.dialogue) {
            entries.push({
              id: uuidv4(),
              type: "npc_dialogue",
              content: action.dialogue,
              npcName: action.npcName,
              npcColor: char?.color,
              audioBase64: action.audioBase64,
              timestamp: new Date(),
            });
          }
        }
      }

      dispatch({ type: "ADD_NARRATIVES", entries });

      // Update game mode
      if (response.mode) {
        dispatch({ type: "SET_MODE", mode: response.mode });
      }

      // Update combat state
      if (response.combatState) {
        dispatch({ type: "SET_COMBAT", combat: response.combatState });
      }

      // Update party stats
      if (response.partyUpdates) {
        dispatch({ type: "UPDATE_PARTY", updates: response.partyUpdates });
      }

      // Update map
      if (response.mapId) {
        dispatch({
          type: "SET_SCENE",
          scene: { ...state.scene, mapId: response.mapId },
        });
      }
    } catch (error) {
      console.error("Failed to send DM input:", error);
      dispatch({
        type: "ADD_NARRATIVE",
        entry: {
          id: uuidv4(),
          type: "system",
          content:
            "Failed to process your input. Please try again.",
          timestamp: new Date(),
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-dnd-border shrink-0">
        <h2 className="text-sm font-bold text-dnd-gold">Adventure Log</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 game-scroll">
        {state.narrativeLog.map((entry) => (
          <NarrativeEntryView key={entry.id} entry={entry} />
        ))}

        {state.isLoading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-dnd-gold rounded-full typing-dot" />
              <div className="w-2 h-2 bg-dnd-gold rounded-full typing-dot" />
              <div className="w-2 h-2 bg-dnd-gold rounded-full typing-dot" />
            </div>
            <span className="text-xs text-dnd-text-muted">NPCs are responding...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dnd-border shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Narrate as the Dungeon Master..."
            disabled={state.isLoading}
            rows={2}
            className="flex-1 bg-dnd-muted border border-dnd-border rounded-lg px-3 py-2 text-sm text-dnd-text placeholder:text-dnd-text-muted/50 resize-none focus:outline-none focus:border-dnd-gold transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || state.isLoading}
            className="bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-30 disabled:cursor-not-allowed text-dnd-text-dark font-bold px-4 rounded-lg transition-colors self-end h-10"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
