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
