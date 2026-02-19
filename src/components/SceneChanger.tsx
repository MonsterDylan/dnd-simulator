"use client";

import { useState } from "react";
import { useGame } from "@/lib/GameContext";
import type { TerrainFeature, TerrainType } from "@/lib/types";

function mapImageUrl(description: string): string {
  const prompt = encodeURIComponent(
    `DnD tabletop RPG battle map ${description}, top-down tactical view, fantasy game art, detailed, dramatic lighting`
  );
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=800&nologo=true`;
}

const GRID = 16;

function t(type: TerrainType, x: number, y: number, overrides?: Partial<TerrainFeature>): TerrainFeature {
  const defaults: Record<TerrainType, { blocksMovement: boolean; blocksSight: boolean }> = {
    wall: { blocksMovement: true, blocksSight: true },
    door: { blocksMovement: true, blocksSight: true },
    door_open: { blocksMovement: false, blocksSight: false },
    table: { blocksMovement: true, blocksSight: false },
    chair: { blocksMovement: false, blocksSight: false },
    water: { blocksMovement: true, blocksSight: false },
    deep_water: { blocksMovement: true, blocksSight: false },
    lava: { blocksMovement: true, blocksSight: false },
    pit: { blocksMovement: true, blocksSight: false },
    pillar: { blocksMovement: true, blocksSight: true },
    tree: { blocksMovement: true, blocksSight: true },
    bush: { blocksMovement: false, blocksSight: true },
    rock: { blocksMovement: true, blocksSight: false },
    chest: { blocksMovement: true, blocksSight: false },
    stairs_up: { blocksMovement: false, blocksSight: false },
    stairs_down: { blocksMovement: false, blocksSight: false },
    trap: { blocksMovement: false, blocksSight: false },
    fire: { blocksMovement: true, blocksSight: false },
    barrel: { blocksMovement: true, blocksSight: false },
    bookshelf: { blocksMovement: true, blocksSight: true },
    bed: { blocksMovement: true, blocksSight: false },
    rubble: { blocksMovement: false, blocksSight: false },
    ice: { blocksMovement: false, blocksSight: false },
    bridge: { blocksMovement: false, blocksSight: false },
    altar: { blocksMovement: true, blocksSight: false },
    statue: { blocksMovement: true, blocksSight: true },
    fountain: { blocksMovement: true, blocksSight: false },
  };
  const d = defaults[type];
  return { type, position: [x, y], blocksMovement: d.blocksMovement, blocksSight: d.blocksSight, ...overrides };
}

function wallRect(x1: number, y1: number, x2: number, y2: number, doorPositions: [number, number][] = []): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  const doorSet = new Set(doorPositions.map(([dx, dy]) => `${dx},${dy}`));
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      if (x > x1 && x < x2 && y > y1 && y < y2) continue;
      if (doorSet.has(`${x},${y}`)) {
        features.push(t("door", x, y));
      } else {
        features.push(t("wall", x, y));
      }
    }
  }
  return features;
}

function generateTavernTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Outer walls with doors
  features.push(...wallRect(1, 1, 14, 14, [[8, 14]]));
  // Bar counter (horizontal)
  for (let x = 3; x <= 7; x++) features.push(t("table", x, 3));
  features.push(t("barrel", 2, 2));
  features.push(t("barrel", 2, 3));
  features.push(t("barrel", 2, 4));
  // Tables with chairs
  for (const [tx, ty] of [[4, 7], [4, 11], [9, 7], [9, 11]] as [number, number][]) {
    features.push(t("table", tx, ty));
    features.push(t("chair", tx - 1, ty));
    features.push(t("chair", tx + 1, ty));
    features.push(t("chair", tx, ty - 1));
    features.push(t("chair", tx, ty + 1));
  }
  // Fireplace
  features.push(t("fire", 12, 3));
  features.push(t("fire", 13, 3));
  // Stairs to upstairs rooms
  features.push(t("stairs_up", 12, 12));
  features.push(t("bookshelf", 13, 7));
  features.push(t("bookshelf", 13, 8));
  return features;
}

function generateDungeonTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Main chamber walls
  features.push(...wallRect(0, 0, 15, 15, [[7, 0], [15, 7]]));
  // Inner room divider
  for (let y = 2; y <= 6; y++) features.push(t("wall", 8, y));
  features.push(t("door", 8, 4));
  // Corridor walls
  for (let y = 9; y <= 13; y++) features.push(t("wall", 5, y));
  features.push(t("door", 5, 11));
  // Pillars in main hall
  for (const [px, py] of [[3, 3], [3, 6], [6, 3], [6, 6]] as [number, number][]) {
    features.push(t("pillar", px, py));
  }
  // Hazards
  features.push(t("trap", 10, 4));
  features.push(t("pit", 12, 10));
  features.push(t("pit", 12, 11));
  // Treasure
  features.push(t("chest", 13, 2));
  features.push(t("chest", 13, 3));
  // Rubble
  features.push(t("rubble", 2, 10));
  features.push(t("rubble", 3, 11));
  features.push(t("rubble", 1, 12));
  // Altar
  features.push(t("altar", 3, 13));
  // Stairs
  features.push(t("stairs_down", 14, 13));
  features.push(t("stairs_up", 1, 1));
  return features;
}

function generateForestTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Dense tree line borders
  const treePositions: [number, number][] = [
    [0,0],[1,0],[2,0],[0,1],[0,2],
    [13,0],[14,0],[15,0],[15,1],[15,2],
    [0,13],[0,14],[0,15],[1,15],[2,15],
    [13,15],[14,15],[15,15],[15,13],[15,14],
    // Scattered trees
    [3,2],[5,1],[7,3],[10,2],[12,4],
    [2,5],[6,6],[11,5],[13,7],
    [1,8],[4,9],[8,8],[14,9],
    [3,12],[7,13],[10,12],[12,13],
  ];
  for (const [x, y] of treePositions) features.push(t("tree", x, y));
  // Bushes
  for (const [x, y] of [[4,3],[9,4],[2,7],[11,8],[6,12],[13,11]] as [number, number][]) {
    features.push(t("bush", x, y));
  }
  // Stream running through
  for (let y = 0; y <= 15; y++) {
    const x = Math.round(8 + Math.sin(y * 0.5) * 2);
    if (!treePositions.some(([tx, ty]) => tx === x && ty === y)) {
      features.push(t("water", x, y));
    }
  }
  // Rocks
  features.push(t("rock", 5, 5));
  features.push(t("rock", 12, 10));
  features.push(t("rock", 3, 10));
  // Bridge over stream
  features.push(t("bridge", 8, 7));
  features.push(t("bridge", 8, 8));
  return features;
}

function generateCaveTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Irregular cave walls (rougher outline)
  const wallCells = new Set<string>();
  for (let x = 0; x <= 15; x++) {
    for (let y = 0; y <= 15; y++) {
      const distFromCenter = Math.sqrt((x - 7.5) ** 2 + (y - 7.5) ** 2);
      const noise = Math.sin(x * 1.3) * Math.cos(y * 0.9) * 1.5;
      if (distFromCenter + noise > 6.5) {
        wallCells.add(`${x},${y}`);
      }
    }
  }
  // Entrance at bottom
  for (let x = 6; x <= 9; x++) wallCells.delete(`${x},15`);
  for (let x = 6; x <= 9; x++) wallCells.delete(`${x},14`);

  for (const key of wallCells) {
    const [x, y] = key.split(",").map(Number);
    features.push(t("rock", x, y));
  }
  // Stalactites (pillars)
  features.push(t("pillar", 5, 6));
  features.push(t("pillar", 10, 5));
  features.push(t("pillar", 8, 10));
  features.push(t("pillar", 4, 9));
  // Underground pool
  for (const [x, y] of [[6,8],[7,8],[8,8],[6,9],[7,9],[8,9],[7,10]] as [number, number][]) {
    features.push(t("deep_water", x, y));
  }
  // Lava crack
  features.push(t("lava", 10, 8));
  features.push(t("lava", 11, 8));
  features.push(t("lava", 11, 9));
  // Treasure
  features.push(t("chest", 9, 4));
  return features;
}

function generateTownTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Building 1 - top left (shop)
  features.push(...wallRect(1, 1, 5, 5, [[3, 5]]));
  features.push(t("barrel", 2, 2));
  features.push(t("table", 3, 3));
  features.push(t("chest", 4, 2));
  // Building 2 - top right (house)
  features.push(...wallRect(10, 1, 14, 5, [[12, 5]]));
  features.push(t("bed", 11, 2));
  features.push(t("table", 12, 3));
  features.push(t("chair", 13, 3));
  features.push(t("bookshelf", 13, 2));
  // Building 3 - bottom left (tavern)
  features.push(...wallRect(1, 10, 6, 14, [[4, 10]]));
  features.push(t("table", 3, 12));
  features.push(t("chair", 2, 12));
  features.push(t("chair", 4, 12));
  features.push(t("barrel", 2, 13));
  features.push(t("barrel", 5, 13));
  // Fountain in town center
  features.push(t("fountain", 8, 8));
  // Market stalls (tables)
  features.push(t("table", 7, 6));
  features.push(t("table", 9, 6));
  features.push(t("barrel", 7, 10));
  features.push(t("barrel", 9, 10));
  // Statue
  features.push(t("statue", 12, 10));
  // Trees along road
  features.push(t("tree", 0, 7));
  features.push(t("tree", 0, 8));
  features.push(t("tree", 15, 7));
  features.push(t("tree", 15, 8));
  features.push(t("bush", 6, 0));
  features.push(t("bush", 9, 0));
  features.push(t("bush", 6, 15));
  features.push(t("bush", 9, 15));
  return features;
}

const PRESET_TERRAIN_GENERATORS: Record<string, () => TerrainFeature[]> = {
  tavern: generateTavernTerrain,
  dungeon: generateDungeonTerrain,
  forest: generateForestTerrain,
  cave: generateCaveTerrain,
  town: generateTownTerrain,
};

function generateTerrainFromDescription(description: string): TerrainFeature[] {
  const lower = description.toLowerCase();

  // Match keywords to preset generators
  const keywords: [string[], string][] = [
    [["tavern", "inn", "bar", "pub", "alehouse"], "tavern"],
    [["dungeon", "crypt", "tomb", "catacomb", "prison", "cell", "vault"], "dungeon"],
    [["forest", "wood", "grove", "glade", "jungle", "swamp"], "forest"],
    [["cave", "cavern", "mine", "tunnel", "underground"], "cave"],
    [["town", "village", "city", "market", "square", "street", "hamlet"], "town"],
  ];

  for (const [words, presetKey] of keywords) {
    if (words.some((w) => lower.includes(w))) {
      const gen = PRESET_TERRAIN_GENERATORS[presetKey];
      if (gen) return gen();
    }
  }

  // Specific terrain types for other descriptions
  if (lower.includes("castle") || lower.includes("fortress") || lower.includes("keep")) {
    return generateCastleTerrain();
  }
  if (lower.includes("temple") || lower.includes("shrine") || lower.includes("church") || lower.includes("chapel")) {
    return generateTempleTerrain();
  }
  if (lower.includes("camp") || lower.includes("clearing") || lower.includes("rest")) {
    return generateCampTerrain();
  }
  if (lower.includes("bridge") || lower.includes("river") || lower.includes("lake") || lower.includes("shore")) {
    return generateRiverTerrain();
  }

  // Fallback: sparse generic terrain
  return generateGenericTerrain();
}

function generateCastleTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Outer walls
  features.push(...wallRect(0, 0, 15, 15, [[7, 15], [8, 15]]));
  // Corner towers
  for (const [cx, cy] of [[1,1],[14,1],[1,14],[14,14]] as [number, number][]) {
    features.push(t("pillar", cx, cy));
  }
  // Inner room (throne room)
  features.push(...wallRect(4, 2, 11, 7, [[7, 7], [8, 7]]));
  features.push(t("altar", 7, 3));
  features.push(t("statue", 5, 3));
  features.push(t("statue", 10, 3));
  features.push(t("pillar", 5, 5));
  features.push(t("pillar", 10, 5));
  // Side room
  features.push(...wallRect(1, 9, 5, 13, [[3, 9]]));
  features.push(t("chest", 2, 11));
  features.push(t("chest", 4, 11));
  features.push(t("bookshelf", 2, 12));
  // Guard room
  features.push(...wallRect(10, 9, 14, 13, [[12, 9]]));
  features.push(t("table", 12, 11));
  features.push(t("barrel", 11, 12));
  features.push(t("barrel", 13, 12));
  features.push(t("stairs_down", 13, 10));
  return features;
}

function generateTempleTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  features.push(...wallRect(2, 1, 13, 14, [[7, 14], [8, 14]]));
  // Central aisle pillars
  for (let y = 3; y <= 11; y += 2) {
    features.push(t("pillar", 4, y));
    features.push(t("pillar", 11, y));
  }
  // Altar at far end
  features.push(t("altar", 7, 2));
  features.push(t("altar", 8, 2));
  features.push(t("fire", 6, 2));
  features.push(t("fire", 9, 2));
  // Pews
  for (let y = 5; y <= 11; y += 2) {
    for (let x = 5; x <= 6; x++) features.push(t("chair", x, y));
    for (let x = 9; x <= 10; x++) features.push(t("chair", x, y));
  }
  features.push(t("fountain", 7, 12));
  features.push(t("statue", 3, 2));
  features.push(t("statue", 12, 2));
  return features;
}

function generateCampTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // Scattered trees around perimeter
  for (const [x, y] of [[0,1],[1,0],[14,0],[15,1],[0,14],[1,15],[14,15],[15,14],[3,1],[12,1],[3,14],[12,14]] as [number, number][]) {
    features.push(t("tree", x, y));
  }
  // Campfire in center
  features.push(t("fire", 7, 7));
  features.push(t("fire", 8, 7));
  // Log seats (rocks)
  features.push(t("rock", 6, 6));
  features.push(t("rock", 9, 6));
  features.push(t("rock", 6, 9));
  features.push(t("rock", 9, 9));
  // Tents (represented as beds)
  features.push(t("bed", 3, 5));
  features.push(t("bed", 12, 5));
  features.push(t("bed", 3, 10));
  features.push(t("bed", 12, 10));
  // Supply area
  features.push(t("barrel", 7, 4));
  features.push(t("barrel", 8, 4));
  features.push(t("chest", 7, 3));
  features.push(t("bush", 5, 2));
  features.push(t("bush", 10, 2));
  features.push(t("bush", 5, 13));
  features.push(t("bush", 10, 13));
  return features;
}

function generateRiverTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // River running vertically with curves
  for (let y = 0; y <= 15; y++) {
    const centerX = Math.round(7 + Math.sin(y * 0.4) * 2.5);
    features.push(t("deep_water", centerX, y));
    features.push(t("water", centerX - 1, y));
    features.push(t("water", centerX + 1, y));
  }
  // Bridge
  for (let x = 4; x <= 11; x++) {
    const y = 8;
    const cx = Math.round(7 + Math.sin(y * 0.4) * 2.5);
    if (Math.abs(x - cx) <= 1) {
      features.push(t("bridge", x, y));
    }
  }
  // Trees on banks
  for (const [x, y] of [[2,2],[3,5],[1,9],[2,13],[4,11],[12,1],[13,4],[14,8],[12,12],[13,14]] as [number, number][]) {
    features.push(t("tree", x, y));
  }
  // Rocks near water
  features.push(t("rock", 4, 3));
  features.push(t("rock", 11, 6));
  features.push(t("rock", 3, 12));
  features.push(t("bush", 1, 5));
  features.push(t("bush", 14, 10));
  return features;
}

function generateGenericTerrain(): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  // A few scattered rocks and bushes
  features.push(t("rock", 3, 3));
  features.push(t("rock", 12, 4));
  features.push(t("rock", 5, 12));
  features.push(t("bush", 7, 2));
  features.push(t("bush", 10, 9));
  features.push(t("bush", 2, 8));
  features.push(t("tree", 1, 1));
  features.push(t("tree", 14, 14));
  features.push(t("pillar", 7, 7));
  return features;
}

const PRESETS = [
  { label: "Tavern", mapId: "tavern" },
  { label: "Dungeon", mapId: "dungeon" },
  { label: "Forest", mapId: "forest" },
  { label: "Cave", mapId: "cave" },
  { label: "Town", mapId: "town" },
];

export default function SceneChanger() {
  const { dispatch } = useGame();
  const [description, setDescription] = useState("");

  function handleSetScene() {
    const d = description.trim();
    if (!d) return;
    const terrain = generateTerrainFromDescription(d);
    dispatch({
      type: "SET_SCENE",
      scene: { description: d, mapId: mapImageUrl(d), terrain },
    });
    setDescription("");
  }

  function handlePreset(preset: { label: string; mapId: string }) {
    const gen = PRESET_TERRAIN_GENERATORS[preset.mapId];
    const terrain = gen ? gen() : [];
    dispatch({
      type: "SET_SCENE",
      scene: { description: preset.label, mapId: preset.mapId, terrain },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetScene();
    }
  }

  return (
    <div className="border-t border-dnd-border bg-dnd-surface px-3 py-2 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-dnd-gold text-xs font-bold tracking-wide">MAP SCENE</span>
        <span className="text-gray-500 text-xs">· AI + Terrain</span>
      </div>

      {/* Input */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the scene..."
          className="flex-1 min-w-0 bg-dnd-dark border border-dnd-border text-gray-200 text-xs rounded px-2 py-1.5 placeholder-gray-600 focus:outline-none focus:border-dnd-gold"
        />
        <button
          onClick={handleSetScene}
          disabled={!description.trim()}
          className="shrink-0 bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-40 text-dnd-dark text-xs font-bold rounded px-2.5 py-1.5 transition-colors"
        >
          Set
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.mapId}
            onClick={() => handlePreset(p)}
            className="text-xs text-gray-500 hover:text-dnd-gold-light bg-dnd-dark hover:bg-dnd-dark/80 border border-dnd-border hover:border-dnd-gold/40 rounded px-2 py-0.5 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
