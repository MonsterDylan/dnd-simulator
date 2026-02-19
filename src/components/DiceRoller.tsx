"use client";

import { useState } from "react";
import { rollDice } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { useGame } from "@/lib/GameContext";

const DICE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export function DiceRoller() {
  const { dispatch } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDie, setSelectedDie] = useState("d20");
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleRoll = async () => {
    const modStr =
      modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : "";
    const expression = `${quantity}${selectedDie}${modStr}`;

    setIsRolling(true);
    setLastResult(null);

    try {
      const result = await rollDice(expression);

      if ("error" in result || result.total === undefined) {
        console.error("Dice roll error:", result);
        return;
      }

      setLastResult(result.total);

      // Add to narrative log
      dispatch({
        type: "ADD_NARRATIVE",
        entry: {
          id: uuidv4(),
          type: "combat_result",
          content: `DM rolled ${expression}`,
          rolls: [result],
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to roll dice:", error);
    } finally {
      setTimeout(() => setIsRolling(false), 500);
    }
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      {/* Popover */}
      {isOpen && (
        <div className="mb-2 bg-dnd-surface/95 backdrop-blur-sm border border-dnd-border rounded-xl p-4 shadow-xl w-64">
          <div className="text-sm font-bold text-dnd-gold mb-3">
            Dice Roller
          </div>

          {/* Dice Type */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DICE_TYPES.map((die) => (
              <button
                key={die}
                onClick={() => setSelectedDie(die)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedDie === die
                    ? "bg-dnd-gold text-dnd-text-dark"
                    : "bg-dnd-muted text-dnd-text-muted hover:text-dnd-text"
                }`}
              >
                {die}
              </button>
            ))}
          </div>

          {/* Quantity & Modifier */}
          <div className="flex gap-2 mb-3">
            <div>
              <label className="text-[10px] text-dnd-text-muted">Qty</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))
                }
                className="w-14 bg-dnd-muted border border-dnd-border rounded px-2 py-1 text-sm text-dnd-text text-center focus:outline-none focus:border-dnd-gold"
              />
            </div>
            <div>
              <label className="text-[10px] text-dnd-text-muted">Mod</label>
              <input
                type="number"
                min={-20}
                max={20}
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="w-14 bg-dnd-muted border border-dnd-border rounded px-2 py-1 text-sm text-dnd-text text-center focus:outline-none focus:border-dnd-gold"
              />
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-50 text-dnd-text-dark font-bold py-2 rounded-lg transition-colors"
          >
            {isRolling ? "Rolling..." : `Roll ${quantity}${selectedDie}${
              modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ""
            }`}
          </button>

          {/* Result */}
          {lastResult !== null && (
            <div
              className={`mt-3 text-center ${isRolling ? "dice-rolling" : ""}`}
            >
              <div className="text-3xl font-bold text-dnd-gold">
                {lastResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 rounded-full bg-dnd-gold hover:bg-dnd-gold-light text-dnd-text-dark font-bold text-sm shadow-lg shadow-dnd-gold/30 transition-all ${
          isOpen ? "rotate-45" : ""
        }`}
      >
        {isOpen ? "✕" : "D20"}
      </button>
    </div>
  );
}
