"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGame } from "@/lib/GameContext";
import { sendDmInput } from "@/lib/api";
import type { NarrativeEntry } from "@/lib/types";
import { getEpisode } from "@/data/campaigns";
import { useSceneChangeDetection, SceneChangePrompt } from "./SceneChangePrompt";
import { detectMapId, generateTerrainFromDescription } from "./SceneChanger";

function NarrativeEntryView({ entry, npcImageUrl }: { entry: NarrativeEntry; npcImageUrl?: string }) {
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
          {npcImageUrl ? (
            <img
              src={npcImageUrl}
              alt={entry.npcName || "NPC"}
              className="w-7 h-7 rounded-full object-cover border-2 shrink-0 mt-1"
              style={{ borderColor: entry.npcColor || "#6B7280" }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
              style={{ backgroundColor: entry.npcColor || "#6B7280" }}
            >
              {entry.npcName?.[0] || "?"}
            </div>
          )}
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
  const sceneChange = useSceneChangeDetection();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.narrativeLog]);

  const sessionData = useMemo(() => {
    try {
      const stored = localStorage.getItem("dnd-session");
      if (!stored) return null;
      const data = JSON.parse(stored);
      return { campaignMode: !!data.campaignMode, episodeNumber: data.episodeNumber ?? 1 };
    } catch { return null; }
  }, []);

  const isCampaignMode = sessionData?.campaignMode ?? false;

  const campaignContext = useMemo(() => {
    if (!isCampaignMode || !sessionData) return undefined;

    const episode = getEpisode(sessionData.episodeNumber);
    const charProfiles: Record<string, string> = {};

    for (const member of episode.cast) {
      const firstName = member.character.split(" ")[0].toLowerCase();
      const relevantSegments = episode.segments.filter(
        (s) =>
          s.speaker.toLowerCase().includes(firstName) &&
          (s.type === "dialogue" || s.type === "narration" || s.type === "description")
      );

      const dialogueLines = relevantSegments
        .filter((s) => s.type === "dialogue")
        .slice(0, 8)
        .map((s) => s.content.slice(0, 200));

      const descriptions = relevantSegments
        .filter((s) => s.type === "description" || s.type === "narration")
        .slice(0, 3)
        .map((s) => s.content.slice(0, 200));

      const loreKeywords = new Set<string>();
      for (const seg of relevantSegments.slice(0, 20)) {
        for (const kw of seg.metadata?.lore_keywords || []) {
          loreKeywords.add(kw);
        }
      }

      charProfiles[member.character] = [
        `${member.character} (played by ${member.player}) - ${member.race || "Unknown"} ${member.class || "Unknown"}`,
        descriptions.length > 0 ? `Descriptions: ${descriptions.join(" | ")}` : "",
        dialogueLines.length > 0 ? `Sample dialogue: "${dialogueLines.join('" | "')}"` : "",
        loreKeywords.size > 0 ? `Lore: ${Array.from(loreKeywords).slice(0, 10).join(", ")}` : "",
      ].filter(Boolean).join("\n");
    }

    const worldContext = [
      `Campaign: ${episode.campaign.name}`,
      `World: ${episode.campaign.world}`,
      `DM: ${episode.campaign.dm}`,
      `System: ${episode.campaign.system}`,
      `Episode: ${episode.episode.title}`,
    ].join(", ");

    return { worldContext, charProfiles };
  }, [isCampaignMode, sessionData]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;

    const message = input.trim();
    setInput("");

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
      const tokenPositions: Record<string, [number, number]> = {};
      state.party.forEach((char) => {
        tokenPositions[char.name] = char.position;
      });

      const sceneForApi = {
        description: state.scene.description,
        mapId: state.scene.mapId,
        terrain: [],
      };

      const leanParty = state.party.map((c) => ({
        name: c.name,
        race: c.race,
        className: c.className,
        level: c.level,
        hp: c.hp,
        ac: c.ac,
        speed: c.speed,
        abilities: c.abilities,
        personalityTraits: c.personalityTraits,
        alignment: c.alignment,
        position: c.position,
        voiceId: c.voiceId,
      }));

      const contextForParty = campaignContext
        ? {
            worldContext: campaignContext.worldContext,
            charProfiles: Object.fromEntries(
              leanParty.map((c) => [
                c.name,
                campaignContext.charProfiles[c.name] || "",
              ]).filter(([, v]) => v)
            ),
          }
        : undefined;

      const response = await sendDmInput(
        state.sessionId,
        message,
        tokenPositions,
        {
          mode: state.mode,
          party: leanParty as typeof state.party,
          scene: sceneForApi,
          combat: state.combat,
        },
        contextForParty
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

      // Apply incremental monster damage from AI
      if (response.monsterUpdates && response.monsterUpdates.length > 0) {
        for (const mu of response.monsterUpdates) {
          if (mu.damage && mu.damage > 0) {
            dispatch({ type: "DAMAGE_MONSTER", index: mu.index, amount: mu.damage });
          }
          if (mu.heal && mu.heal > 0 && state.combat?.monsters?.[mu.index]) {
            const monster = state.combat.monsters[mu.index];
            const newHp = Math.min(monster.hp.max, monster.hp.current + mu.heal);
            dispatch({
              type: "UPDATE_MONSTER",
              index: mu.index,
              updates: { hp: { current: newHp, max: monster.hp.max } },
            });
          }
        }
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

      // Check for scene change in narrative
      if (response.narrative) {
        sceneChange.checkNarrative(
          response.narrative,
          response.sceneChange
        );
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Failed to send DM input:", errMsg, error);
      dispatch({
        type: "ADD_NARRATIVE",
        entry: {
          id: uuidv4(),
          type: "system",
          content: `Failed to process your input: ${errMsg}`,
          timestamp: new Date(),
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  };

  const handleAcceptSceneChange = useCallback(() => {
    if (!sceneChange.pending) return;
    const { description, mapId } = sceneChange.pending;
    const terrain = generateTerrainFromDescription(description);
    const resolvedMapId = detectMapId(description);
    dispatch({
      type: "SET_SCENE",
      scene: { description, mapId: resolvedMapId, terrain },
    });
    dispatch({
      type: "ADD_NARRATIVE",
      entry: {
        id: uuidv4(),
        type: "system",
        content: `Map updated to: ${sceneChange.pending.mapLabel}`,
        timestamp: new Date(),
      },
    });
    sceneChange.clear();
  }, [sceneChange, dispatch]);

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
        {state.narrativeLog.map((entry) => {
          const npcChar = entry.npcName
            ? state.party.find((c) => c.name === entry.npcName)
            : undefined;
          return (
            <NarrativeEntryView
              key={entry.id}
              entry={entry}
              npcImageUrl={npcChar?.imageUrl}
            />
          );
        })}

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

      {/* Scene change prompt */}
      {sceneChange.pending && (
        <SceneChangePrompt
          pending={sceneChange.pending}
          onAccept={handleAcceptSceneChange}
          onDismiss={sceneChange.dismiss}
        />
      )}

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
