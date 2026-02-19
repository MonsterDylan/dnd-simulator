"use client";

import type { Character } from "@/lib/types";
import { abilityModifier, formatModifier } from "@/lib/helpers";

const ABILITY_NAMES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
const ABILITY_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export function CharacterCard({
  character,
  color,
}: {
  character: Character;
  color: string;
}) {
  return (
    <div className="bg-dnd-surface border border-dnd-border rounded-xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-12 h-12 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: color }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: color }}
          >
            {character.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-dnd-text font-semibold text-lg truncate">
            {character.name}
          </h3>
          <p className="text-dnd-text-muted text-sm">
            {character.race} {character.className} (Lv. {character.level})
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-dnd-red font-medium">HP</span>
          <span className="text-dnd-text">{character.hp.max}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-dnd-blue font-medium">AC</span>
          <span className="text-dnd-text">{character.ac}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-dnd-gold font-medium">SPD</span>
          <span className="text-dnd-text">{character.speed}ft</span>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-1.5">
        {ABILITY_NAMES.map((name, i) => {
          const score = character.abilities[ABILITY_KEYS[i]];
          const mod = abilityModifier(score);
          return (
            <div
              key={name}
              className="bg-dnd-muted rounded-lg py-1.5 text-center"
            >
              <div className="text-dnd-text-muted text-[10px] font-medium">
                {name}
              </div>
              <div className="text-dnd-text font-bold text-sm">{score}</div>
              <div className="text-dnd-gold text-[10px]">
                {formatModifier(mod)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Background & Personality */}
      <div className="text-sm">
        <span className="text-dnd-text-muted">Background:</span>{" "}
        <span className="text-dnd-text">{character.background}</span>
      </div>
      {character.personalityTraits && (
        <p className="text-dnd-text-muted text-xs italic line-clamp-2">
          &ldquo;{character.personalityTraits}&rdquo;
        </p>
      )}
    </div>
  );
}
