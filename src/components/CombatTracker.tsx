"use client";

import { useGame } from "@/lib/GameContext";

export function CombatTracker() {
  const { state, dispatch } = useGame();
  const combat = state.combat;
  if (!combat) return null;

  return (
    <div className="bg-dnd-surface border-t border-dnd-border px-4 py-3 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-dnd-red-light uppercase tracking-wider">
            Combat
          </span>
          <span className="text-xs text-dnd-text-muted">
            Round {combat.round}
          </span>
        </div>
        <span className="text-xs text-dnd-gold font-medium">
          {combat.initiativeOrder[combat.currentTurn]?.name}&apos;s Turn
        </span>
      </div>

      {/* Initiative Order */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {combat.initiativeOrder.map((entry, i) => {
          const isActive = i === combat.currentTurn;
          const char = state.party.find((c) => c.name === entry.name);
          const bgColor = entry.isParty
            ? char?.color || "#6B7280"
            : "#DC2626";

          return (
            <div
              key={`${entry.name}-${i}`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0 transition-all ${
                isActive
                  ? "ring-2 ring-dnd-gold bg-dnd-muted scale-105"
                  : "bg-dnd-muted/50"
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: bgColor }}
              >
                {entry.name[0]}
              </div>
              <span
                className={`text-[10px] ${
                  isActive ? "text-dnd-gold font-medium" : "text-dnd-text-muted"
                }`}
              >
                {entry.name.split(" ")[0]}
              </span>
              <span className="text-[9px] text-dnd-text-muted">
                ({entry.initiative})
              </span>
            </div>
          );
        })}
      </div>

      {/* Monster HP Bars */}
      {combat.monsters.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dnd-border/50 space-y-1">
          <div className="text-[10px] text-dnd-text-muted font-medium uppercase tracking-wider mb-1">
            Monsters
          </div>
          {combat.monsters.map((monster, i) => {
            const hpPct = monster.hp.max > 0
              ? Math.round((monster.hp.current / monster.hp.max) * 100)
              : 0;
            const isBloodied = hpPct <= 50;

            return (
              <div key={`tracker-monster-${i}`} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-dnd-red flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                  {monster.name[0]}
                </div>
                <span className="text-[10px] text-dnd-text w-20 truncate">{monster.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-dnd-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isBloodied ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
                <span className={`text-[9px] font-mono w-12 text-right ${
                  isBloodied ? "text-dnd-red-light" : "text-dnd-text-muted"
                }`}>
                  {monster.hp.current}/{monster.hp.max}
                </span>
                {isBloodied && (
                  <span className="text-[8px] text-dnd-red-light font-medium">BLOODIED</span>
                )}
                <button
                  onClick={() => dispatch({ type: "REMOVE_MONSTER", index: i })}
                  className="text-dnd-text-muted hover:text-dnd-red-light transition-colors p-0.5 shrink-0"
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
  );
}
