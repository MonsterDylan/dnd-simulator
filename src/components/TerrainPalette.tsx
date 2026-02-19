"use client";

import { useGame } from "@/lib/GameContext";
import { TERRAIN_CATALOG, TERRAIN_CATEGORIES, type TerrainDef } from "@/lib/helpers";
import type { TerrainType } from "@/lib/types";

function TerrainButton({ def, selected, onSelect }: { def: TerrainDef; selected: boolean; onSelect: (t: TerrainType) => void }) {
  return (
    <button
      onClick={() => onSelect(def.type)}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all border ${
        selected
          ? "bg-dnd-gold/20 border-dnd-gold text-dnd-gold scale-105"
          : "bg-dnd-dark border-dnd-border text-dnd-text-muted hover:border-dnd-gold/40 hover:text-dnd-text"
      }`}
      title={`${def.label}${def.blocksMovement ? " · Blocks movement" : ""}${def.blocksSight ? " · Blocks sight" : ""}`}
    >
      <span className="text-sm leading-none">{def.emoji}</span>
      <span className="truncate">{def.label}</span>
    </button>
  );
}

export default function TerrainPalette() {
  const { state, dispatch } = useGame();

  if (!state.terrainEditMode) return null;

  const terrainCount = state.scene.terrain.length;

  return (
    <div className="border-t border-dnd-border bg-dnd-surface px-3 py-2 shrink-0 max-h-60 overflow-y-auto game-scroll">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-dnd-gold text-xs font-bold tracking-wide">TERRAIN PALETTE</span>
          {terrainCount > 0 && (
            <span className="text-[10px] text-dnd-text-muted bg-dnd-dark px-1.5 py-0.5 rounded">
              {terrainCount} placed
            </span>
          )}
        </div>
        <button
          onClick={() => dispatch({ type: "SET_TERRAIN_EDIT_MODE", enabled: false })}
          className="text-[10px] text-dnd-text-muted hover:text-dnd-red-light transition-colors"
        >
          Done
        </button>
      </div>

      <p className="text-[10px] text-dnd-text-muted mb-2">
        Select a terrain type, then click or drag on the map to place. Right-click a cell or use the eraser to remove.
      </p>

      {TERRAIN_CATEGORIES.map((cat) => {
        const items = Object.values(TERRAIN_CATALOG).filter((d) => d.category === cat.id);
        return (
          <div key={cat.id} className="mb-2">
            <div className="text-[10px] text-dnd-text-muted font-medium uppercase tracking-wider mb-1">
              {cat.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {items.map((def) => (
                <TerrainButton
                  key={def.type}
                  def={def}
                  selected={state.selectedTerrainType === def.type}
                  onSelect={(t) => dispatch({ type: "SET_SELECTED_TERRAIN", terrainType: t })}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-2 pt-2 border-t border-dnd-border flex flex-wrap gap-1.5">
        <div className="flex items-center gap-1 text-[10px] text-dnd-text-muted">
          <span className="w-2.5 h-2.5 rounded-sm bg-dnd-red/30 border border-dnd-red/50 inline-block"></span>
          Blocks movement
        </div>
        <div className="flex items-center gap-1 text-[10px] text-dnd-text-muted">
          <span className="w-2.5 h-2.5 rounded-sm bg-dnd-purple/30 border border-dnd-purple/50 inline-block"></span>
          Blocks sight
        </div>
      </div>
    </div>
  );
}
