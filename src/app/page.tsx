"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateParty } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";
import { PARTY_COLORS } from "@/lib/helpers";
import type { Character, Scene } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [party, setParty] = useState<Character[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [scene, setScene] = useState<Scene | null>(null);
  const [voiceAssignments, setVoiceAssignments] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await generateParty(4);
      setParty(res.party);
      setSessionId(res.sessionId);
      setScene(res.scene);
      setVoiceAssignments(res.voiceAssignments);
    } catch (err) {
      console.error("Failed to generate party:", err);
      setError("Failed to generate party. Make sure the n8n workflow is active.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartGame = () => {
    // Store session data in localStorage for the game page to pick up
    localStorage.setItem(
      "dnd-session",
      JSON.stringify({ sessionId, party, scene, voiceAssignments })
    );
    router.push("/game");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-dnd-gold mb-3 tracking-tight">
          D&D Simulator
        </h1>
        <p className="text-dnd-text-muted text-lg max-w-md mx-auto">
          AI-powered Dungeons & Dragons with voice-enabled NPC party members.
          You are the Dungeon Master.
        </p>
      </div>

      {/* Generate Button */}
      {party.length === 0 && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-dnd-text-dark font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-dnd-gold/20"
        >
          {isGenerating ? (
            <span className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Summoning Adventurers...
            </span>
          ) : (
            "Generate Random Party"
          )}
        </button>
      )}

      {error && (
        <p className="text-dnd-red mt-4 text-sm">{error}</p>
      )}

      {/* Party Cards */}
      {party.length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-2xl font-bold text-dnd-text mb-4 text-center">
            Your Adventuring Party
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {party.map((char, i) => (
              <CharacterCard
                key={char.id}
                character={char}
                color={PARTY_COLORS[i % PARTY_COLORS.length]}
              />
            ))}
          </div>

          {/* Scene Preview */}
          {scene && (
            <div className="parchment-text text-center mb-8 max-w-2xl mx-auto">
              <p className="text-sm font-medium">{scene.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="border border-dnd-border text-dnd-text-muted hover:text-dnd-text hover:border-dnd-gold px-6 py-3 rounded-xl transition-colors"
            >
              Reroll Party
            </button>
            <button
              onClick={handleStartGame}
              className="bg-dnd-gold hover:bg-dnd-gold-light text-dnd-text-dark font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-dnd-gold/20"
            >
              Begin Adventure
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
