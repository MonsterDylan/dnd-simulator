"use client";

import { useGame } from "@/lib/GameContext";

export function CombatTracker() {
  const { state } = useGame();
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
    </div>
  );
}
