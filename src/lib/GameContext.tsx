"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { GameState, NarrativeEntry, Character, CombatState, Scene } from "./types";

// Actions
type GameAction =
  | { type: "SET_PARTY"; party: Character[]; sessionId: string; scene: Scene; voiceAssignments: Record<string, string> }
  | { type: "SET_MODE"; mode: GameState["mode"] }
  | { type: "ADD_NARRATIVE"; entry: NarrativeEntry }
  | { type: "ADD_NARRATIVES"; entries: NarrativeEntry[] }
  | { type: "UPDATE_PARTY"; updates: Record<string, Partial<Character>> }
  | { type: "UPDATE_CHARACTER_POSITION"; name: string; position: [number, number] }
  | { type: "SET_COMBAT"; combat: CombatState | null }
  | { type: "SET_SCENE"; scene: Scene }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "TOGGLE_AUDIO" }
  | { type: "RESET" };

const initialState: GameState = {
  sessionId: "",
  mode: "setup",
  party: [],
  scene: { description: "", mapId: "tavern" },
  combat: null,
  narrativeLog: [],
  isLoading: false,
  audioEnabled: true,
  voiceAssignments: {},
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PARTY":
      return {
        ...state,
        party: action.party,
        sessionId: action.sessionId,
        scene: action.scene,
        voiceAssignments: action.voiceAssignments,
        mode: "exploration",
      };

    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "ADD_NARRATIVE":
      return {
        ...state,
        narrativeLog: [...state.narrativeLog, action.entry],
      };

    case "ADD_NARRATIVES":
      return {
        ...state,
        narrativeLog: [...state.narrativeLog, ...action.entries],
      };

    case "UPDATE_PARTY":
      return {
        ...state,
        party: state.party.map((char) => {
          const update = action.updates[char.name];
          return update ? { ...char, ...update } : char;
        }),
      };

    case "UPDATE_CHARACTER_POSITION":
      return {
        ...state,
        party: state.party.map((char) =>
          char.name === action.name ? { ...char, position: action.position } : char
        ),
      };

    case "SET_COMBAT":
      return {
        ...state,
        combat: action.combat,
        mode: action.combat ? "combat" : "exploration",
      };

    case "SET_SCENE":
      return { ...state, scene: action.scene };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "TOGGLE_AUDIO":
      return { ...state, audioEnabled: !state.audioEnabled };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
