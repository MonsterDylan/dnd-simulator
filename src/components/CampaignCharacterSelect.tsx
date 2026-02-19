"use client";

import { useState, useMemo } from "react";
import type { CastMember } from "@/data/campaigns/campaign4-schema";
import { CR4_CHARACTER_ART } from "@/lib/helpers";

const MIN_PARTY = 2;
const MAX_PARTY = 12;

const CLASS_ICONS: Record<string, string> = {
  Fighter: "⚔️",
  Wizard: "🧙",
  Rogue: "🗡️",
  Cleric: "✝️",
  Ranger: "🏹",
  Paladin: "🛡️",
  Barbarian: "🪓",
  Bard: "🎵",
  Druid: "🌿",
  Sorcerer: "✨",
  Warlock: "🔮",
  Monk: "👊",
};

function getClassIcon(cls: string): string {
  const primary = cls.split("/")[0].split("(")[0].trim();
  return CLASS_ICONS[primary] || "⚔️";
}

function getRaceIcon(race: string | null): string {
  const map: Record<string, string> = {
    Human: "👤",
    Elf: "🧝",
    Halfling: "🧒",
    Orc: "👹",
    Dwarf: "⛏️",
    Gnome: "🎩",
    Tiefling: "😈",
  };
  return map[race || "Human"] || "👤";
}

export function CampaignCharacterSelect({
  cast,
  onConfirm,
  onBack,
}: {
  cast: CastMember[];
  onConfirm: (selected: CastMember[]) => void;
  onBack: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else if (next.size < MAX_PARTY) {
        next.add(idx);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(cast.map((_, i) => i)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const canConfirm = selectedIds.size >= MIN_PARTY;

  const selectedCast = useMemo(
    () => cast.filter((_, i) => selectedIds.has(i)),
    [cast, selectedIds]
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-dnd-text mb-1">
          Assemble Your Party
        </h2>
        <p className="text-dnd-text-muted text-sm">
          Critical Role Campaign 4 — Select{" "}
          <span className="text-dnd-gold font-medium">{MIN_PARTY}–{MAX_PARTY}</span>{" "}
          characters to join the adventure
        </p>
      </div>

      {/* Selection count & controls */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <span className="text-sm text-dnd-text-muted">
            Selected:{" "}
            <span
              className={`font-bold text-base ${
                canConfirm ? "text-dnd-green" : "text-dnd-red"
              }`}
            >
              {selectedIds.size}
            </span>
            <span className="text-dnd-text-muted"> / {cast.length}</span>
          </span>
          {!canConfirm && selectedIds.size > 0 && (
            <span className="text-xs text-dnd-red">
              Need at least {MIN_PARTY} characters
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-dnd-border text-dnd-text-muted hover:text-dnd-gold hover:border-dnd-gold transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-dnd-border text-dnd-text-muted hover:text-dnd-red hover:border-dnd-red transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {cast.map((member, i) => {
          const isSelected = selectedIds.has(i);

          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`group relative rounded-xl p-4 text-left transition-all duration-200 border-2 ${
                isSelected
                  ? "border-dnd-gold bg-dnd-gold/10 shadow-lg shadow-dnd-gold/10"
                  : "border-dnd-border bg-dnd-surface hover:border-dnd-border hover:bg-dnd-muted"
              }`}
            >
              {/* Selection indicator */}
              <div
                className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-dnd-gold bg-dnd-gold"
                    : "border-dnd-border group-hover:border-dnd-text-muted"
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-dnd-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Portrait */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    isSelected ? "border-dnd-gold" : "border-dnd-border"
                  }`}
                >
                  <img
                    src={CR4_CHARACTER_ART[member.character] || ""}
                    alt={member.character}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <h3
                    className={`font-bold text-sm truncate transition-colors ${
                      isSelected ? "text-dnd-gold" : "text-dnd-text"
                    }`}
                  >
                    {member.character}
                  </h3>
                  <p className="text-dnd-text-muted text-xs truncate">
                    {member.player}
                  </p>
                </div>
              </div>

              {/* Class & Race tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dnd-muted text-dnd-text text-xs">
                  {getRaceIcon(member.race)} {member.race || "Unknown"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dnd-muted text-dnd-text text-xs">
                  {getClassIcon(member.class || "Fighter")}{" "}
                  {member.class || "Fighter"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected party preview */}
      {selectedIds.size > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-dnd-surface border border-dnd-border">
          <h3 className="text-xs font-medium text-dnd-text-muted uppercase tracking-wider mb-3">
            Your Party
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedCast.map((member) => (
              <span
                key={member.character}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dnd-gold/15 border border-dnd-gold/30 text-dnd-gold text-sm font-medium"
              >
                {getClassIcon(member.class || "Fighter")} {member.character}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          className="border border-dnd-border text-dnd-text-muted hover:text-dnd-text hover:border-dnd-gold px-6 py-3 rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => canConfirm && onConfirm(selectedCast)}
          disabled={!canConfirm}
          className={`font-bold px-8 py-3 rounded-xl transition-all shadow-lg ${
            canConfirm
              ? "bg-dnd-purple hover:bg-dnd-purple/80 text-white shadow-dnd-purple/20 cursor-pointer"
              : "bg-dnd-muted text-dnd-text-muted cursor-not-allowed shadow-none"
          }`}
        >
          {canConfirm
            ? `Begin with ${selectedIds.size} Character${selectedIds.size !== 1 ? "s" : ""}`
            : `Select at least ${MIN_PARTY} Characters`}
        </button>
      </div>
    </div>
  );
}
