// Ability score modifier calculation (D&D 5e)
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Character token colors
export const PARTY_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
];

// Map display names
export const MAP_NAMES: Record<string, string> = {
  tavern: "The Rusty Flagon Tavern",
  dungeon: "Dark Dungeon",
  forest: "Whispering Woods",
  cave: "Echoing Caverns",
  town: "Market Square",
};

// Dice expression helper
export function parseDiceExpression(expr: string): string {
  return expr.replace(/(\d+)d(\d+)/, "$1d$2");
}

// Terrain feature catalog
import type { TerrainType } from "./types";

export interface TerrainDef {
  type: TerrainType;
  label: string;
  emoji: string;
  bg: string;
  border: string;
  blocksMovement: boolean;
  blocksSight: boolean;
  category: "structure" | "furniture" | "nature" | "hazard" | "interactable";
}

export const TERRAIN_CATALOG: Record<TerrainType, TerrainDef> = {
  wall:        { type: "wall",        label: "Wall",        emoji: "🧱", bg: "#44403C", border: "#78716C", blocksMovement: true,  blocksSight: true,  category: "structure" },
  door:        { type: "door",        label: "Door",        emoji: "🚪", bg: "#78350F", border: "#92400E", blocksMovement: true,  blocksSight: true,  category: "structure" },
  door_open:   { type: "door_open",   label: "Open Door",   emoji: "🚪", bg: "#451A03", border: "#78350F", blocksMovement: false, blocksSight: false, category: "structure" },
  pillar:      { type: "pillar",      label: "Pillar",      emoji: "🏛️", bg: "#57534E", border: "#A8A29E", blocksMovement: true,  blocksSight: true,  category: "structure" },
  stairs_up:   { type: "stairs_up",   label: "Stairs Up",   emoji: "⬆️", bg: "#44403C", border: "#D97706", blocksMovement: false, blocksSight: false, category: "structure" },
  stairs_down: { type: "stairs_down", label: "Stairs Down", emoji: "⬇️", bg: "#44403C", border: "#D97706", blocksMovement: false, blocksSight: false, category: "structure" },
  bridge:      { type: "bridge",      label: "Bridge",      emoji: "🌉", bg: "#78350F", border: "#92400E", blocksMovement: false, blocksSight: false, category: "structure" },

  table:       { type: "table",       label: "Table",       emoji: "🪑", bg: "#78350F", border: "#92400E", blocksMovement: true,  blocksSight: false, category: "furniture" },
  chair:       { type: "chair",       label: "Chair",       emoji: "💺", bg: "#78350F", border: "#713F12", blocksMovement: false, blocksSight: false, category: "furniture" },
  bed:         { type: "bed",         label: "Bed",         emoji: "🛏️", bg: "#4C1D95", border: "#6D28D9", blocksMovement: true,  blocksSight: false, category: "furniture" },
  bookshelf:   { type: "bookshelf",   label: "Bookshelf",   emoji: "📚", bg: "#78350F", border: "#92400E", blocksMovement: true,  blocksSight: true,  category: "furniture" },
  barrel:      { type: "barrel",      label: "Barrel",      emoji: "🛢️", bg: "#78350F", border: "#92400E", blocksMovement: true,  blocksSight: false, category: "furniture" },

  tree:        { type: "tree",        label: "Tree",        emoji: "🌲", bg: "#14532D", border: "#166534", blocksMovement: true,  blocksSight: true,  category: "nature" },
  bush:        { type: "bush",        label: "Bush",        emoji: "🌿", bg: "#14532D", border: "#166534", blocksMovement: false, blocksSight: true,  category: "nature" },
  rock:        { type: "rock",        label: "Rock",        emoji: "🪨", bg: "#44403C", border: "#78716C", blocksMovement: true,  blocksSight: false, category: "nature" },
  water:       { type: "water",       label: "Water",       emoji: "💧", bg: "#1E3A5F", border: "#2563EB", blocksMovement: true,  blocksSight: false, category: "nature" },
  deep_water:  { type: "deep_water",  label: "Deep Water",  emoji: "🌊", bg: "#172554", border: "#1D4ED8", blocksMovement: true,  blocksSight: false, category: "nature" },
  ice:         { type: "ice",         label: "Ice",         emoji: "🧊", bg: "#E0F2FE", border: "#7DD3FC", blocksMovement: false, blocksSight: false, category: "nature" },
  rubble:      { type: "rubble",      label: "Rubble",      emoji: "🧱", bg: "#292524", border: "#44403C", blocksMovement: false, blocksSight: false, category: "nature" },

  lava:        { type: "lava",        label: "Lava",        emoji: "🔥", bg: "#7C2D12", border: "#DC2626", blocksMovement: true,  blocksSight: false, category: "hazard" },
  pit:         { type: "pit",         label: "Pit",         emoji: "🕳️", bg: "#0C0A09", border: "#292524", blocksMovement: true,  blocksSight: false, category: "hazard" },
  trap:        { type: "trap",        label: "Trap",        emoji: "⚠️", bg: "#451A03", border: "#DC2626", blocksMovement: false, blocksSight: false, category: "hazard" },
  fire:        { type: "fire",        label: "Fire",        emoji: "🔥", bg: "#7C2D12", border: "#F59E0B", blocksMovement: true,  blocksSight: false, category: "hazard" },

  chest:       { type: "chest",       label: "Chest",       emoji: "📦", bg: "#78350F", border: "#D97706", blocksMovement: true,  blocksSight: false, category: "interactable" },
  altar:       { type: "altar",       label: "Altar",       emoji: "⛩️", bg: "#4C1D95", border: "#7C3AED", blocksMovement: true,  blocksSight: false, category: "interactable" },
  statue:      { type: "statue",      label: "Statue",      emoji: "🗿", bg: "#44403C", border: "#A8A29E", blocksMovement: true,  blocksSight: true,  category: "interactable" },
  fountain:    { type: "fountain",    label: "Fountain",    emoji: "⛲", bg: "#1E3A5F", border: "#60A5FA", blocksMovement: true,  blocksSight: false, category: "interactable" },
};

export const TERRAIN_CATEGORIES = [
  { id: "structure" as const, label: "Structure" },
  { id: "furniture" as const, label: "Furniture" },
  { id: "nature" as const, label: "Nature" },
  { id: "hazard" as const, label: "Hazard" },
  { id: "interactable" as const, label: "Objects" },
];
