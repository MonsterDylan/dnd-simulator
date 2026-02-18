"use client";

import { useState } from "react";
import { useGame } from "@/lib/GameContext";

function mapImageUrl(description: string): string {
  const prompt = encodeURIComponent(
    `DnD tabletop RPG battle map ${description}, top-down tactical view, fantasy game art, detailed, dramatic lighting`
  );
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=800&nologo=true`;
}

const PRESETS = [
  { label: "Tavern", mapId: "tavern" },
  { label: "Dungeon", mapId: "dungeon" },
  { label: "Forest", mapId: "forest" },
  { label: "Cave", mapId: "cave" },
  { label: "Town", mapId: "town" },
];

export default function SceneChanger() {
  const { dispatch } = useGame();
  const [description, setDescription] = useState("");

  function handleSetScene() {
    const d = description.trim();
    if (!d) return;
    dispatch({
      type: "SET_SCENE",
      scene: { description: d, mapId: mapImageUrl(d) },
    });
    setDescription("");
  }

  function handlePreset(preset: { label: string; mapId: string }) {
    dispatch({
      type: "SET_SCENE",
      scene: { description: preset.label, mapId: preset.mapId },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetScene();
    }
  }

  return (
    <div className="border-t border-dnd-border bg-dnd-surface px-3 py-2 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-dnd-gold text-xs font-bold tracking-wide">MAP SCENE</span>
        <span className="text-gray-500 text-xs">· AI</span>
      </div>

      {/* Input */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the scene..."
          className="flex-1 min-w-0 bg-dnd-dark border border-dnd-border text-gray-200 text-xs rounded px-2 py-1.5 placeholder-gray-600 focus:outline-none focus:border-dnd-gold"
        />
        <button
          onClick={handleSetScene}
          disabled={!description.trim()}
          className="shrink-0 bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-40 text-dnd-dark text-xs font-bold rounded px-2.5 py-1.5 transition-colors"
        >
          Set
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.mapId}
            onClick={() => handlePreset(p)}
            className="text-xs text-gray-500 hover:text-dnd-gold-light bg-dnd-dark hover:bg-dnd-dark/80 border border-dnd-border hover:border-dnd-gold/40 rounded px-2 py-0.5 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
