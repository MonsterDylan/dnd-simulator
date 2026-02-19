"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/GameContext";
import { detectMapId, generateTerrainFromDescription } from "./SceneChanger";
import { MAP_NAMES } from "@/lib/helpers";

const SCENE_KEYWORDS = [
  "you arrive at", "you enter", "you step into", "you find yourself",
  "you walk into", "you push open", "you open the door", "the scene changes",
  "you emerge into", "you descend into", "you ascend to", "leads you to",
  "you cross into", "you make your way to", "you travel to", "you reach",
  "before you lies", "around you is", "opens up to", "the door opens",
  "stepping inside", "stepping outside", "outside the", "inside the",
  "you leave the", "exiting the", "entering the",
];

function detectSceneChangeFromNarrative(narrative: string): string | null {
  const lower = narrative.toLowerCase();
  const hasTransition = SCENE_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hasTransition) return null;

  const sentences = narrative.split(/[.!?]+/).filter(Boolean);
  for (const sentence of sentences) {
    const sl = sentence.toLowerCase();
    if (SCENE_KEYWORDS.some((kw) => sl.includes(kw))) {
      return sentence.trim();
    }
  }
  return null;
}

interface PendingSceneChange {
  description: string;
  mapId: string;
  mapLabel: string;
}

export function useSceneChangeDetection() {
  const [pending, setPending] = useState<PendingSceneChange | null>(null);
  const processedNarratives = useRef(new Set<string>());

  const checkNarrative = useCallback(
    (narrative: string, explicitHint?: string) => {
      const key = narrative.slice(0, 100);
      if (processedNarratives.current.has(key)) return;
      processedNarratives.current.add(key);

      const sceneText = explicitHint || detectSceneChangeFromNarrative(narrative);
      if (!sceneText) return;

      const fullContext = explicitHint ? `${explicitHint} ${narrative}` : narrative;
      const mapId = detectMapId(fullContext);

      const currentMapLabel = MAP_NAMES[mapId] || mapId;

      setPending({
        description: sceneText,
        mapId,
        mapLabel: currentMapLabel,
      });
    },
    []
  );

  const dismiss = useCallback(() => setPending(null), []);
  const clear = useCallback(() => {
    setPending(null);
  }, []);

  return { pending, checkNarrative, dismiss, clear };
}

interface SceneChangePromptProps {
  pending: PendingSceneChange;
  onAccept: () => void;
  onDismiss: () => void;
}

export function SceneChangePrompt({ pending, onAccept, onDismiss }: SceneChangePromptProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleAccept = async () => {
    setIsApplying(true);
    onAccept();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 30000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="mx-3 mb-2 animate-fade-in">
      <div className="bg-dnd-gold/10 border border-dnd-gold/40 rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-dnd-gold/20 flex items-center gap-2">
          <svg className="w-4 h-4 text-dnd-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-xs font-bold text-dnd-gold tracking-wide">SCENE CHANGE DETECTED</span>
        </div>

        <div className="px-3 py-2">
          <p className="text-xs text-gray-300 mb-1 leading-relaxed line-clamp-2 italic">
            &ldquo;{pending.description}&rdquo;
          </p>
          <p className="text-[11px] text-gray-500 mb-2">
            Suggested map: <span className="text-dnd-gold font-medium">{pending.mapLabel}</span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isApplying}
              className="flex-1 bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-50 text-dnd-dark text-xs font-bold rounded px-3 py-1.5 transition-colors"
            >
              {isApplying ? "Updating..." : "Update Map"}
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded border border-dnd-border hover:border-gray-500 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
