"use client";

import { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { MONSTER_PRESETS, QUICK_SPAWN_PRESETS } from "@/data/monsters";
import type { Monster } from "@/lib/types";

export function MonsterSpawner() {
  const { state, dispatch } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHp, setCustomHp] = useState("10");
  const [customAc, setCustomAc] = useState("12");

  const monsterCount = state.combat?.monsters?.length ?? 0;

  const findOpenPosition = (): [number, number] => {
    const occupied = new Set<string>();
    state.party.forEach((c) => occupied.add(`${c.position[0]},${c.position[1]}`));
    state.combat?.monsters?.forEach((m) => occupied.add(`${m.position[0]},${m.position[1]}`));

    for (let y = 0; y < 16; y++) {
      for (let x = 15; x >= 0; x--) {
        if (!occupied.has(`${x},${y}`)) return [x, y];
      }
    }
    return [8, 8];
  };

  const spawnPreset = (name: string) => {
    const preset = MONSTER_PRESETS[name];
    if (!preset) return;

    const existingCount = state.combat?.monsters?.filter((m) => m.name.startsWith(name)).length ?? 0;
    const displayName = existingCount > 0 ? `${name} ${existingCount + 1}` : name;

    const monster: Monster = {
      ...preset,
      name: displayName,
      hp: { ...preset.hp },
      position: findOpenPosition(),
    };

    dispatch({ type: "ADD_MONSTER", monster });
  };

  const spawnCustom = () => {
    if (!customName.trim()) return;
    const hp = parseInt(customHp) || 10;
    const ac = parseInt(customAc) || 12;

    const monster: Monster = {
      name: customName.trim(),
      hp: { current: hp, max: hp },
      ac,
      cr: 1,
      attacks: [{ name: "Attack", bonus: 4, damage: "1d6+2" }],
      position: findOpenPosition(),
    };

    dispatch({ type: "ADD_MONSTER", monster });
    setCustomName("");
    setShowCustom(false);
  };

  return (
    <div className="border-t border-dnd-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-dnd-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">&#9876;</span>
          <span className="text-xs font-bold text-dnd-red-light uppercase tracking-wider">
            Monsters
          </span>
          {monsterCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dnd-red/20 text-dnd-red-light font-medium">
              {monsterCount}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-dnd-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_SPAWN_PRESETS.map((name) => {
              const preset = MONSTER_PRESETS[name];
              return (
                <button
                  key={name}
                  onClick={() => spawnPreset(name)}
                  className="text-left px-2 py-1.5 rounded bg-dnd-muted/50 border border-dnd-border hover:border-dnd-red/40 hover:bg-dnd-red/10 transition-colors group"
                >
                  <div className="text-[11px] font-medium text-dnd-text group-hover:text-dnd-red-light">
                    {name}
                  </div>
                  <div className="text-[9px] text-dnd-text-muted">
                    HP {preset.hp.max} | AC {preset.ac} | CR {preset.cr}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex-1 text-[10px] px-2 py-1 rounded border border-dnd-border text-dnd-text-muted hover:text-dnd-gold hover:border-dnd-gold/40 transition-colors"
            >
              {showAll ? "Hide All" : `All Monsters (${Object.keys(MONSTER_PRESETS).length})`}
            </button>
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="flex-1 text-[10px] px-2 py-1 rounded border border-dnd-border text-dnd-text-muted hover:text-dnd-gold hover:border-dnd-gold/40 transition-colors"
            >
              {showCustom ? "Cancel" : "Custom"}
            </button>
          </div>

          {showAll && (
            <div className="max-h-48 overflow-y-auto space-y-1 game-scroll">
              {Object.entries(MONSTER_PRESETS)
                .filter(([name]) => !QUICK_SPAWN_PRESETS.includes(name as typeof QUICK_SPAWN_PRESETS[number]))
                .map(([name, preset]) => (
                  <button
                    key={name}
                    onClick={() => spawnPreset(name)}
                    className="w-full text-left px-2 py-1.5 rounded bg-dnd-muted/30 border border-dnd-border hover:border-dnd-red/40 hover:bg-dnd-red/10 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-dnd-text group-hover:text-dnd-red-light">
                        {name}
                      </span>
                      <span className="text-[9px] text-dnd-text-muted">
                        HP {preset.hp.max} | AC {preset.ac} | CR {preset.cr}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {showCustom && (
            <div className="space-y-1.5 p-2 rounded bg-dnd-muted/30 border border-dnd-border">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Monster name"
                className="w-full text-xs bg-dnd-muted border border-dnd-border rounded px-2 py-1 text-dnd-text placeholder:text-dnd-text-muted/50 focus:outline-none focus:border-dnd-gold"
              />
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <label className="text-[9px] text-dnd-text-muted">HP</label>
                  <input
                    type="number"
                    value={customHp}
                    onChange={(e) => setCustomHp(e.target.value)}
                    className="w-full text-xs bg-dnd-muted border border-dnd-border rounded px-2 py-1 text-dnd-text focus:outline-none focus:border-dnd-gold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-dnd-text-muted">AC</label>
                  <input
                    type="number"
                    value={customAc}
                    onChange={(e) => setCustomAc(e.target.value)}
                    className="w-full text-xs bg-dnd-muted border border-dnd-border rounded px-2 py-1 text-dnd-text focus:outline-none focus:border-dnd-gold"
                  />
                </div>
              </div>
              <button
                onClick={spawnCustom}
                disabled={!customName.trim()}
                className="w-full text-[11px] font-medium px-2 py-1.5 rounded bg-dnd-red/20 border border-dnd-red/40 text-dnd-red-light hover:bg-dnd-red/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Spawn Custom Monster
              </button>
            </div>
          )}

          {monsterCount > 0 && (
            <div className="space-y-1 pt-1 border-t border-dnd-border/50">
              <div className="text-[10px] text-dnd-text-muted font-medium">
                Active ({monsterCount})
              </div>
              {state.combat?.monsters?.map((m, i) => {
                const hpPct = Math.round((m.hp.current / m.hp.max) * 100);
                const isBloodied = hpPct <= 50;
                return (
                  <div key={`active-${i}`} className="flex items-center gap-2 px-1.5 py-1 rounded bg-dnd-muted/30">
                    <div className="w-4 h-4 rounded-full bg-dnd-red flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-dnd-text truncate">{m.name}</div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 rounded-full bg-dnd-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isBloodied ? "bg-dnd-red" : "bg-dnd-green"
                            }`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        <span className={`text-[8px] ${isBloodied ? "text-dnd-red-light" : "text-dnd-text-muted"}`}>
                          {m.hp.current}/{m.hp.max}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch({ type: "REMOVE_MONSTER", index: i })}
                      className="text-dnd-text-muted hover:text-dnd-red-light transition-colors p-0.5"
                      title="Remove monster"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
