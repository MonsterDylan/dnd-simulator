"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { GameState, NarrativeEntry, Character, CombatState, SceneInput, TerrainFeature, TerrainType, Monster } from "./types";

type GameAction =
  | { type: "SET_PARTY"; party: Character[]; sessionId: string; scene: SceneInput; voiceAssignments: Record<string, string> }
  | { type: "SET_MODE"; mode: GameState["mode"] }
  | { type: "ADD_NARRATIVE"; entry: NarrativeEntry }
  | { type: "ADD_NARRATIVES"; entries: NarrativeEntry[] }
  | { type: "UPDATE_PARTY"; updates: Record<string, Partial<Character>> }
  | { type: "UPDATE_CHARACTER_POSITION"; name: string; position: [number, number] }
  | { type: "SET_COMBAT"; combat: CombatState | null }
  | { type: "SET_SCENE"; scene: SceneInput }
  | { type: "SET_TERRAIN"; terrain: TerrainFeature[] }
  | { type: "PLACE_TERRAIN"; feature: TerrainFeature }
  | { type: "REMOVE_TERRAIN"; position: [number, number] }
  | { type: "CLEAR_TERRAIN" }
  | { type: "SET_TERRAIN_EDIT_MODE"; enabled: boolean }
  | { type: "SET_SELECTED_TERRAIN"; terrainType: TerrainType | null }
  | { type: "ADD_MONSTER"; monster: Monster }
  | { type: "REMOVE_MONSTER"; index: number }
  | { type: "DAMAGE_MONSTER"; index: number; amount: number }
  | { type: "UPDATE_MONSTER_POSITION"; index: number; position: [number, number] }
  | { type: "UPDATE_MONSTER"; index: number; updates: Partial<Monster> }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "TOGGLE_AUDIO" }
  | { type: "RESET" };

const initialState: GameState = {
  sessionId: "",
  mode: "setup",
  party: [],
  scene: { description: "", mapId: "tavern", terrain: [] },
  combat: null,
  narrativeLog: [],
  isLoading: false,
  audioEnabled: true,
  voiceAssignments: {},
  terrainEditMode: false,
  selectedTerrainType: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PARTY":
      return {
        ...state,
        party: action.party,
        sessionId: action.sessionId,
        scene: { ...action.scene, terrain: action.scene.terrain ?? [] },
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
      return { ...state, scene: { ...action.scene, terrain: action.scene.terrain ?? state.scene.terrain } };

    case "SET_TERRAIN":
      return { ...state, scene: { ...state.scene, terrain: action.terrain } };

    case "PLACE_TERRAIN": {
      const filtered = state.scene.terrain.filter(
        (t) => !(t.position[0] === action.feature.position[0] && t.position[1] === action.feature.position[1])
      );
      return { ...state, scene: { ...state.scene, terrain: [...filtered, action.feature] } };
    }

    case "REMOVE_TERRAIN":
      return {
        ...state,
        scene: {
          ...state.scene,
          terrain: state.scene.terrain.filter(
            (t) => !(t.position[0] === action.position[0] && t.position[1] === action.position[1])
          ),
        },
      };

    case "CLEAR_TERRAIN":
      return { ...state, scene: { ...state.scene, terrain: [] } };

    case "SET_TERRAIN_EDIT_MODE":
      return { ...state, terrainEditMode: action.enabled, selectedTerrainType: action.enabled ? state.selectedTerrainType : null };

    case "SET_SELECTED_TERRAIN":
      return { ...state, selectedTerrainType: action.terrainType };

    case "ADD_MONSTER": {
      const currentCombat = state.combat ?? {
        initiativeOrder: [],
        currentTurn: 0,
        round: 1,
        monsters: [],
      };
      return {
        ...state,
        combat: {
          ...currentCombat,
          monsters: [...currentCombat.monsters, action.monster],
        },
        mode: "combat",
      };
    }

    case "REMOVE_MONSTER": {
      if (!state.combat) return state;
      const remaining = state.combat.monsters.filter((_, i) => i !== action.index);
      return {
        ...state,
        combat: { ...state.combat, monsters: remaining },
        ...(remaining.length === 0 && state.combat.initiativeOrder.every(e => e.isParty)
          ? { mode: "exploration" as const }
          : {}),
      };
    }

    case "DAMAGE_MONSTER": {
      if (!state.combat) return state;
      const monsters = state.combat.monsters.map((m, i) => {
        if (i !== action.index) return m;
        const newHp = Math.max(0, m.hp.current - action.amount);
        return { ...m, hp: { ...m.hp, current: newHp } };
      });
      const deadIndex = monsters.findIndex((m, i) => i === action.index && m.hp.current <= 0);
      const alive = deadIndex >= 0 ? monsters.filter((_, i) => i !== deadIndex) : monsters;
      return {
        ...state,
        combat: { ...state.combat, monsters: alive },
        ...(alive.length === 0 && state.combat.initiativeOrder.every(e => e.isParty)
          ? { mode: "exploration" as const }
          : {}),
      };
    }

    case "UPDATE_MONSTER_POSITION": {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          monsters: state.combat.monsters.map((m, i) =>
            i === action.index ? { ...m, position: action.position } : m
          ),
        },
      };
    }

    case "UPDATE_MONSTER": {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          monsters: state.combat.monsters.map((m, i) =>
            i === action.index ? { ...m, ...action.updates } : m
          ),
        },
      };
    }

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
