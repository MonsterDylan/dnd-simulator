"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGame } from "@/lib/GameContext";
import { PARTY_COLORS } from "@/lib/helpers";
import { PartyPanel } from "@/components/PartyPanel";
import { GameMap } from "@/components/GameMap";
import { NarrativeLog } from "@/components/NarrativeLog";
import { CombatTracker } from "@/components/CombatTracker";
import { DiceRoller } from "@/components/DiceRoller";
import ReferenceChat from "@/components/ReferenceChat";
import SceneChanger from "@/components/SceneChanger";
import TerrainPalette from "@/components/TerrainPalette";
import CampaignLore from "@/components/CampaignLore";
import { MonsterSpawner } from "@/components/MonsterSpawner";

function GameContent() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const initialized = useRef(false);

  // Load session from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    const stored = localStorage.getItem("dnd-session");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const data = JSON.parse(stored);
      initialized.current = true;
      setIsCampaignMode(!!data.campaignMode);
      const partyWithColors = data.party.map(
        (char: Record<string, unknown>, i: number) => ({
          ...char,
          color: PARTY_COLORS[i % PARTY_COLORS.length],
        })
      );
      dispatch({
        type: "SET_PARTY",
        party: partyWithColors,
        sessionId: data.sessionId,
        scene: data.scene,
        voiceAssignments: data.voiceAssignments || {},
      });
      dispatch({
        type: "ADD_NARRATIVE",
        entry: {
          id: "scene-intro",
          type: "narration",
          content: data.scene.description,
          timestamp: new Date(),
        },
      });
    } catch {
      router.push("/");
    }
  }, [dispatch, router]);

  if (state.mode === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-dnd-text-muted">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading adventure...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 bg-dnd-surface border-b border-dnd-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-dnd-gold font-bold text-sm">CR Campaign Simulator</h1>
          {isCampaignMode && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-dnd-purple/20 text-dnd-purple border border-dnd-purple/30">
              Campaign 4
            </span>
          )}
          <span className="text-dnd-text-muted text-xs">|</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              state.mode === "combat"
                ? "bg-dnd-red/20 text-dnd-red-light"
                : "bg-dnd-green/20 text-dnd-green"
            }`}
          >
            {state.mode === "combat" ? "Combat" : "Exploration"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: "TOGGLE_AUDIO" })}
            className="text-dnd-text-muted hover:text-dnd-text text-xs px-2 py-1 rounded"
            title={state.audioEnabled ? "Mute NPC voices" : "Unmute NPC voices"}
          >
            {state.audioEnabled ? "Sound On" : "Sound Off"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("dnd-session");
              router.push("/");
            }}
            className="text-dnd-text-muted hover:text-dnd-red text-xs px-2 py-1 rounded"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Content: 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Party + Tools (fully scrollable) */}
        <div className="w-72 bg-dnd-surface border-r border-dnd-border flex flex-col shrink-0 overflow-y-auto game-scroll">
          <PartyPanel />
          <MonsterSpawner />
          <SceneChanger />
          <TerrainPalette />
          {isCampaignMode && <CampaignLore />}
          <ReferenceChat />
        </div>

        {/* Center Panel: Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <GameMap />
            <DiceRoller />
          </div>
          {state.mode === "combat" && state.combat && (
            <CombatTracker />
          )}
        </div>

        {/* Right Panel: Narrative */}
        <div className="w-96 bg-dnd-surface border-l border-dnd-border flex flex-col shrink-0">
          <NarrativeLog />
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
