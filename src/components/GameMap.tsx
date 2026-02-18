"use client";

import { useState, useCallback } from "react";
import { useGame } from "@/lib/GameContext";
import { MAP_NAMES } from "@/lib/helpers";

const GRID_SIZE = 16;
const CELL_SIZE = 36;

export function GameMap() {
  const { state, dispatch } = useGame();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const isImageUrl = (state.scene.mapId ?? "").startsWith("http");
  const mapClass = `rounded-lg border border-dnd-border relative select-none ${
    isImageUrl ? "" : `map-${state.scene.mapId || "tavern"}`
  }`;

  const handleMouseDown = useCallback(
    (charName: string, e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(charName);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
      setDragPos({
        x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, y)),
      });
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging && dragPos) {
      dispatch({
        type: "UPDATE_CHARACTER_POSITION",
        name: dragging,
        position: [dragPos.x, dragPos.y],
      });
    }
    setDragging(null);
    setDragPos(null);
  }, [dragging, dragPos, dispatch]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      {/* Map label */}
      <div className="text-sm text-dnd-text-muted mb-2">
        {MAP_NAMES[state.scene.mapId] || state.scene.mapId}
      </div>

      {/* Grid */}
      <div
        className={mapClass}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          ...(isImageUrl ? {
            backgroundImage: `url(${state.scene.mapId})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : {}),
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid lines */}
        <svg
          className="absolute inset-0 pointer-events-none opacity-15"
          width="100%"
          height="100%"
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <g key={i}>
              <line
                x1={i * CELL_SIZE}
                y1={0}
                x2={i * CELL_SIZE}
                y2={GRID_SIZE * CELL_SIZE}
                stroke="white"
                strokeWidth={0.5}
              />
              <line
                x1={0}
                y1={i * CELL_SIZE}
                x2={GRID_SIZE * CELL_SIZE}
                y2={i * CELL_SIZE}
                stroke="white"
                strokeWidth={0.5}
              />
            </g>
          ))}
        </svg>

        {/* Monster Tokens */}
        {state.combat?.monsters?.map((monster, i) => (
          <div
            key={`monster-${i}`}
            className="absolute flex items-center justify-center cursor-default"
            style={{
              left: monster.position[0] * CELL_SIZE + 2,
              top: monster.position[1] * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
            <div
              className="w-full h-full rounded-full bg-dnd-red border-2 border-dnd-red-light flex items-center justify-center text-white text-xs font-bold"
              title={`${monster.name} (HP: ${monster.hp.current}/${monster.hp.max})`}
            >
              {monster.name[0]}
            </div>
          </div>
        ))}

        {/* Party Tokens */}
        {state.party.map((char) => {
          const pos =
            dragging === char.name && dragPos
              ? dragPos
              : { x: char.position[0], y: char.position[1] };

          const isActiveTurn =
            state.mode === "combat" &&
            state.combat?.initiativeOrder[state.combat.currentTurn]?.name ===
              char.name;

          return (
            <div
              key={char.id}
              className={`absolute flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
                dragging === char.name ? "z-20 scale-110" : "z-10"
              } ${isActiveTurn ? "token-active" : ""}`}
              style={{
                left: pos.x * CELL_SIZE + 2,
                top: pos.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                transition: dragging === char.name ? "none" : "left 0.2s, top 0.2s",
              }}
              onMouseDown={(e) => handleMouseDown(char.name, e)}
            >
              {char.imageUrl && (
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="w-full h-full rounded-full object-cover shadow-lg border-2"
                  style={{ borderColor: char.color }}
                  title={`${char.name} (${char.race} ${char.className})`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = "flex";
                  }}
                />
              )}
              <div
                className="w-full h-full rounded-full border-2 border-white/30 items-center justify-center text-white text-xs font-bold shadow-lg"
                style={{
                  backgroundColor: char.color,
                  display: char.imageUrl ? "none" : "flex",
                }}
                title={`${char.name} (${char.race} ${char.className})`}
              >
                {char.name[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
