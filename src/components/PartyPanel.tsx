"use client";

import { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { abilityModifier, formatModifier } from "@/lib/helpers";
import type { Character } from "@/lib/types";

const ABILITY_LABELS: { key: keyof Character["abilities"]; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color =
    pct > 50 ? "bg-dnd-green" : pct > 25 ? "bg-dnd-gold" : "bg-dnd-red";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-dnd-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-dnd-text-muted w-12 text-right">
        {current}/{max}
      </span>
    </div>
  );
}

function CharacterAccordion({ character }: { character: Character }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-dnd-border">
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-dnd-muted/50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: character.color }}
        >
          {character.name[0]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-dnd-text truncate">
            {character.name}
          </div>
          <div className="text-xs text-dnd-text-muted">
            {character.race} {character.className}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-dnd-red font-medium">
            {character.hp.current}/{character.hp.max}
          </span>
          <svg
            className={`w-4 h-4 text-dnd-text-muted transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* HP Bar */}
          <div>
            <div className="text-xs text-dnd-text-muted mb-1">Hit Points</div>
            <HpBar current={character.hp.current} max={character.hp.max} />
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 text-xs">
            <div>
              <span className="text-dnd-text-muted">AC </span>
              <span className="text-dnd-blue font-medium">{character.ac}</span>
            </div>
            <div>
              <span className="text-dnd-text-muted">SPD </span>
              <span className="text-dnd-gold font-medium">{character.speed}ft</span>
            </div>
            <div>
              <span className="text-dnd-text-muted">Prof </span>
              <span className="text-dnd-purple font-medium">+{character.proficiencyBonus}</span>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_LABELS.map(({ key, label }) => {
              const score = character.abilities[key];
              const mod = abilityModifier(score);
              return (
                <div
                  key={key}
                  className="bg-dnd-muted rounded py-1 text-center"
                >
                  <div className="text-[9px] text-dnd-text-muted">{label}</div>
                  <div className="text-xs font-bold text-dnd-text">{score}</div>
                  <div className="text-[9px] text-dnd-gold">
                    {formatModifier(mod)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spell Slots */}
          {character.spellSlots && character.spellSlots.length > 0 && (
            <div>
              <div className="text-xs text-dnd-text-muted mb-1">Spell Slots</div>
              <div className="flex gap-2 flex-wrap">
                {character.spellSlots.map((slot) => (
                  <div key={slot.level} className="flex items-center gap-1">
                    <span className="text-[10px] text-dnd-text-muted">
                      Lv{slot.level}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < slot.total - slot.used
                              ? "bg-dnd-purple"
                              : "bg-dnd-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Preview */}
          {character.inventory.length > 0 && (
            <div>
              <div className="text-xs text-dnd-text-muted mb-1">Equipment</div>
              <div className="text-xs text-dnd-text space-y-0.5">
                {character.inventory.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="text-dnd-text-muted">x{item.quantity}</span>
                    )}
                  </div>
                ))}
                {character.inventory.length > 5 && (
                  <div className="text-dnd-text-muted italic">
                    +{character.inventory.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PartyPanel() {
  const { state } = useGame();

  return (
    <div>
      <div className="px-4 py-3 border-b border-dnd-border">
        <h2 className="text-sm font-bold text-dnd-gold">Party</h2>
      </div>
      {state.party.map((char) => (
        <CharacterAccordion key={char.id} character={char} />
      ))}
    </div>
  );
}
