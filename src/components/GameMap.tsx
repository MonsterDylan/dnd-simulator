"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGame } from "@/lib/GameContext";
import { MAP_NAMES, TERRAIN_CATALOG } from "@/lib/helpers";

const GRID_SIZE = 16;
const CELL_SIZE = 36;

interface MonsterPopupState {
  index: number;
  screenX: number;
  screenY: number;
}

export function GameMap() {
  const { state, dispatch } = useGame();
  const [dragging, setDragging] = useState<string | null>(null);
  const [draggingMonster, setDraggingMonster] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [painting, setPainting] = useState(false);
  const [monsterPopup, setMonsterPopup] = useState<MonsterPopupState | null>(null);
  const [damageInput, setDamageInput] = useState("");

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
      setMonsterPopup(null);
    },
    [state.terrainEditMode]
  );

  const handleMonsterMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      if (state.terrainEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setDraggingMonster(index);
      setMonsterPopup(null);
    },
    [state.terrainEditMode]
  );

  const handleMonsterClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      if (state.terrainEditMode) return;
      e.stopPropagation();
      setMonsterPopup({
        index,
        screenX: e.clientX,
        screenY: e.clientY,
      });
      setDamageInput("");
    },
    [state.terrainEditMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging && draggingMonster === null) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
      setDragPos({
        x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, y)),
      });
    },
    [dragging, draggingMonster]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging && dragPos) {
      dispatch({
        type: "UPDATE_CHARACTER_POSITION",
        name: dragging,
        position: [dragPos.x, dragPos.y],
      });
    }
    if (draggingMonster !== null && dragPos) {
      dispatch({
        type: "UPDATE_MONSTER_POSITION",
        index: draggingMonster,
        position: [dragPos.x, dragPos.y],
      });
    }
    setDragging(null);
    setDraggingMonster(null);
    setDragPos(null);
    setPainting(false);
  }, [dragging, draggingMonster, dragPos, dispatch]);

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
        className={`${mapClass} map-popup-anchor`}
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
        {state.combat?.monsters?.map((monster, i) => {
          const isDraggingThis = draggingMonster === i;
          const pos =
            isDraggingThis && dragPos
              ? dragPos
              : { x: monster.position[0], y: monster.position[1] };
          const hpPct = monster.hp.max > 0 ? (monster.hp.current / monster.hp.max) * 100 : 0;
          const isBloodied = hpPct <= 50;

          return (
            <div
              key={`monster-${i}`}
              className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10 ${
                isDraggingThis ? "z-20 scale-110" : ""
              }`}
              style={{
                left: pos.x * CELL_SIZE + 1,
                top: pos.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                transition: isDraggingThis ? "none" : "left 0.2s, top 0.2s",
              }}
              onMouseDown={(e) => handleMonsterMouseDown(i, e)}
              onClick={(e) => handleMonsterClick(i, e)}
            >
              <div
                className={`w-[28px] h-[28px] rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold ${
                  isBloodied
                    ? "bg-dnd-red border-red-400 animate-pulse"
                    : "bg-dnd-red border-dnd-red-light"
                }`}
              >
                {monster.name[0]}
              </div>
              <div
                className="w-[28px] h-[3px] rounded-full overflow-hidden mt-[1px]"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hpPct}%`,
                    backgroundColor: isBloodied ? "#ef4444" : "#22c55e",
                  }}
                />
              </div>
            </div>
          );
        })}

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
        {/* Monster Popup */}
        {monsterPopup && state.combat?.monsters?.[monsterPopup.index] && (() => {
          const m = state.combat.monsters[monsterPopup.index];
          const hpPct = m.hp.max > 0 ? Math.round((m.hp.current / m.hp.max) * 100) : 0;
          const isBloodied = hpPct <= 50;
          const popupLeft = Math.min(
            monsterPopup.screenX - (document.querySelector(".map-popup-anchor")?.getBoundingClientRect().left ?? 0),
            GRID_SIZE * CELL_SIZE - 200
          );
          const popupTop = Math.min(
            monsterPopup.screenY - (document.querySelector(".map-popup-anchor")?.getBoundingClientRect().top ?? 0) - 10,
            GRID_SIZE * CELL_SIZE - 200
          );
          return (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMonsterPopup(null)}
              />
              <div
                className="absolute z-40 bg-dnd-surface border border-dnd-border rounded-lg shadow-xl p-3 w-52"
                style={{ left: Math.max(0, popupLeft), top: Math.max(0, popupTop) }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-dnd-red-light">{m.name}</h4>
                  <button
                    onClick={() => setMonsterPopup(null)}
                    className="text-dnd-text-muted hover:text-dnd-text"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-dnd-text-muted w-6">HP</span>
                    <div className="flex-1 h-2 rounded-full bg-dnd-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${hpPct}%`,
                          backgroundColor: isBloodied ? "#ef4444" : "#22c55e",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono ${isBloodied ? "text-dnd-red-light" : "text-dnd-text"}`}>
                      {m.hp.current}/{m.hp.max}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-dnd-text-muted">
                    <span>AC {m.ac}</span>
                    <span>CR {m.cr}</span>
                  </div>
                  {m.attacks.length > 0 && (
                    <div className="text-[9px] text-dnd-text-muted">
                      {m.attacks.map((a, idx) => (
                        <div key={idx}>{a.name}: +{a.bonus}, {a.damage}</div>
                      ))}
                    </div>
                  )}
                  {m.specialAbilities && m.specialAbilities.length > 0 && (
                    <div className="text-[9px] text-dnd-purple italic">
                      {m.specialAbilities.join(", ")}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 mb-1.5">
                  <input
                    type="number"
                    value={damageInput}
                    onChange={(e) => setDamageInput(e.target.value)}
                    placeholder="Dmg"
                    className="w-16 text-xs bg-dnd-muted border border-dnd-border rounded px-1.5 py-1 text-dnd-text text-center focus:outline-none focus:border-dnd-gold"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const dmg = parseInt(damageInput);
                        if (dmg > 0) {
                          dispatch({ type: "DAMAGE_MONSTER", index: monsterPopup.index, amount: dmg });
                          setDamageInput("");
                          if (m.hp.current - dmg <= 0) setMonsterPopup(null);
                        }
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dmg = parseInt(damageInput);
                      if (dmg > 0) {
                        dispatch({ type: "DAMAGE_MONSTER", index: monsterPopup.index, amount: dmg });
                        setDamageInput("");
                        if (m.hp.current - dmg <= 0) setMonsterPopup(null);
                      }
                    }}
                    disabled={!damageInput || parseInt(damageInput) <= 0}
                    className="flex-1 text-[10px] font-medium px-2 py-1 rounded bg-dnd-gold/20 border border-dnd-gold/40 text-dnd-gold hover:bg-dnd-gold/30 disabled:opacity-30 transition-colors"
                  >
                    Deal Damage
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "REMOVE_MONSTER", index: monsterPopup.index });
                    setMonsterPopup(null);
                  }}
                  className="w-full text-[10px] font-medium px-2 py-1 rounded bg-dnd-red/20 border border-dnd-red/40 text-dnd-red-light hover:bg-dnd-red/30 transition-colors"
                >
                  Kill / Remove
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
