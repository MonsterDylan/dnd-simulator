"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGame } from "@/lib/GameContext";
import { MAP_NAMES, TERRAIN_CATALOG } from "@/lib/helpers";

const GRID_SIZE = 16;
const CELL_SIZE = 36;

export function GameMap() {
  const { state, dispatch } = useGame();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [painting, setPainting] = useState(false);

  const isImageUrl = (state.scene.mapId ?? "").startsWith("http");

  useEffect(() => {
    if (!isImageUrl) {
      setImageLoading(false);
      return;
    }
    setImageLoading(true);
    const img = new Image();
    img.onload = () => setImageLoading(false);
    img.onerror = () => setImageLoading(false);
    img.src = state.scene.mapId;
  }, [state.scene.mapId, isImageUrl]);

  const mapClass = `rounded-lg border border-dnd-border relative select-none ${
    isImageUrl ? "" : `map-${state.scene.mapId || "tavern"}`
  }`;

  const terrainMap = useMemo(() => {
    const map = new Map<string, (typeof state.scene.terrain)[0]>();
    for (const t of state.scene.terrain) {
      map.set(`${t.position[0]},${t.position[1]}`, t);
    }
    return map;
  }, [state.scene.terrain]);

  const handleTerrainClick = useCallback(
    (x: number, y: number) => {
      if (!state.terrainEditMode) return;

      if (eraseMode) {
        dispatch({ type: "REMOVE_TERRAIN", position: [x, y] });
        return;
      }

      if (!state.selectedTerrainType) return;

      const def = TERRAIN_CATALOG[state.selectedTerrainType];
      dispatch({
        type: "PLACE_TERRAIN",
        feature: {
          type: state.selectedTerrainType,
          position: [x, y],
          blocksMovement: def.blocksMovement,
          blocksSight: def.blocksSight,
        },
      });
    },
    [state.terrainEditMode, state.selectedTerrainType, eraseMode, dispatch]
  );

  const handleCellMouseDown = useCallback(
    (x: number, y: number) => {
      if (!state.terrainEditMode) return;
      setPainting(true);
      handleTerrainClick(x, y);
    },
    [state.terrainEditMode, handleTerrainClick]
  );

  const handleCellMouseEnter = useCallback(
    (x: number, y: number) => {
      if (!painting || !state.terrainEditMode) return;
      handleTerrainClick(x, y);
    },
    [painting, state.terrainEditMode, handleTerrainClick]
  );

  const handleMouseDown = useCallback(
    (charName: string, e: React.MouseEvent) => {
      if (state.terrainEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(charName);
    },
    [state.terrainEditMode]
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
    setPainting(false);
  }, [dragging, dragPos, dispatch]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      {/* Map label + terrain edit toggle */}
      <div className="flex items-center gap-3 mb-2">
        <div className="text-sm text-dnd-text-muted">
          {MAP_NAMES[state.scene.mapId] || state.scene.description || state.scene.mapId}
        </div>
        <button
          onClick={() => {
            dispatch({ type: "SET_TERRAIN_EDIT_MODE", enabled: !state.terrainEditMode });
            setEraseMode(false);
          }}
          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
            state.terrainEditMode
              ? "bg-dnd-gold/20 border-dnd-gold text-dnd-gold"
              : "bg-dnd-surface border-dnd-border text-dnd-text-muted hover:text-dnd-gold hover:border-dnd-gold/40"
          }`}
        >
          {state.terrainEditMode ? "Editing Terrain" : "Edit Terrain"}
        </button>
        {state.terrainEditMode && (
          <>
            <button
              onClick={() => setEraseMode(!eraseMode)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                eraseMode
                  ? "bg-dnd-red/20 border-dnd-red text-dnd-red-light"
                  : "bg-dnd-surface border-dnd-border text-dnd-text-muted hover:text-dnd-red-light hover:border-dnd-red/40"
              }`}
            >
              Eraser
            </button>
            <button
              onClick={() => dispatch({ type: "CLEAR_TERRAIN" })}
              className="text-xs px-2 py-0.5 rounded border border-dnd-border text-dnd-text-muted hover:text-dnd-red-light hover:border-dnd-red/40 transition-colors"
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Grid */}
      <div
        className={mapClass}
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          ...(isImageUrl
            ? {
                backgroundImage: `url(${state.scene.mapId})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}),
          cursor: state.terrainEditMode
            ? eraseMode
              ? "crosshair"
              : state.selectedTerrainType
              ? "cell"
              : "default"
            : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading overlay for AI images */}
        {isImageUrl && imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 rounded-lg">
            <div className="text-dnd-gold text-sm animate-pulse">Generating map...</div>
          </div>
        )}

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

        {/* Terrain edit grid overlay (clickable cells) */}
        {state.terrainEditMode && (
          <div className="absolute inset-0 z-5">
            {Array.from({ length: GRID_SIZE }).map((_, y) =>
              Array.from({ length: GRID_SIZE }).map((_, x) => (
                <div
                  key={`cell-${x}-${y}`}
                  className="absolute hover:bg-white/10 transition-colors"
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  onMouseDown={() => handleCellMouseDown(x, y)}
                  onMouseEnter={() => handleCellMouseEnter(x, y)}
                />
              ))
            )}
          </div>
        )}

        {/* Terrain Features */}
        {state.scene.terrain.map((feature) => {
          const def = TERRAIN_CATALOG[feature.type];
          if (!def) return null;
          return (
            <div
              key={`terrain-${feature.position[0]}-${feature.position[1]}`}
              className="absolute flex items-center justify-center pointer-events-none z-[2] terrain-tile"
              style={{
                left: feature.position[0] * CELL_SIZE,
                top: feature.position[1] * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
              title={`${def.label}${feature.blocksMovement ? " (blocks movement)" : ""}${feature.blocksSight ? " (blocks sight)" : ""}`}
            >
              <div
                className="w-full h-full flex items-center justify-center rounded-sm"
                style={{
                  backgroundColor: def.bg,
                  border: `1px solid ${def.border}`,
                  opacity: 0.85,
                }}
              >
                <span className="text-sm leading-none select-none" role="img">{def.emoji}</span>
              </div>
            </div>
          );
        })}

        {/* Monster Tokens */}
        {state.combat?.monsters?.map((monster, i) => (
          <div
            key={`monster-${i}`}
            className="absolute flex items-center justify-center cursor-default z-10"
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
              className={`absolute flex items-center justify-center cursor-grab active:cursor-grabbing transition-all z-10 ${
                dragging === char.name ? "z-20 scale-110" : ""
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
