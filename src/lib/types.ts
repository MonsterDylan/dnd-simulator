export interface Character {
  id: string;
  name: string;
  race: string;
  className: string;
  level: number;
  background: string;
  personalityTraits: string;
  alignment: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp: { current: number; max: number; temp: number };
  ac: number;
  speed: number;
  proficiencyBonus: number;
  savingThrows: string[];
  skills: string[];
  spellSlots?: { level: number; total: number; used: number }[];
  knownSpells?: Spell[];
  inventory: InventoryItem[];
  position: [number, number];
  voiceId: string;
  color: string;
  imageUrl?: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  damage?: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  type: "weapon" | "armor" | "potion" | "gear" | "treasure";
  description?: string;
}

export interface Monster {
  name: string;
  hp: { current: number; max: number };
  ac: number;
  cr: number;
  attacks: { name: string; bonus: number; damage: string }[];
  position: [number, number];
  specialAbilities?: string[];
}

export interface DiceRoll {
  expression: string;
  individual: number[];
  modifier: number;
  total: number;
  purpose: string;
}

export interface NarrativeEntry {
  id: string;
  type: "narration" | "npc_dialogue" | "combat_result" | "system" | "dm_input";
  content: string;
  npcName?: string;
  npcColor?: string;
  audioBase64?: string;
  rolls?: DiceRoll[];
  timestamp: Date;
}

export interface NpcAction {
  npcName: string;
  action: string;
  dialogue?: string;
  audioBase64?: string;
  rolls?: DiceRoll[];
}

export interface CombatState {
  initiativeOrder: { name: string; initiative: number; isParty: boolean }[];
  currentTurn: number;
  round: number;
  monsters: Monster[];
}

export type TerrainType =
  | "wall"
  | "door"
  | "door_open"
  | "table"
  | "chair"
  | "water"
  | "deep_water"
  | "lava"
  | "pit"
  | "pillar"
  | "tree"
  | "bush"
  | "rock"
  | "chest"
  | "stairs_up"
  | "stairs_down"
  | "trap"
  | "fire"
  | "barrel"
  | "bookshelf"
  | "bed"
  | "rubble"
  | "ice"
  | "bridge"
  | "altar"
  | "statue"
  | "fountain";

export interface TerrainFeature {
  type: TerrainType;
  position: [number, number];
  blocksMovement: boolean;
  blocksSight: boolean;
  label?: string;
}

export interface Scene {
  description: string;
  mapId: string;
  terrain: TerrainFeature[];
}

/** Scene data as received from external sources (terrain may be missing) */
export type SceneInput = Omit<Scene, "terrain"> & { terrain?: TerrainFeature[] };

export interface GameState {
  sessionId: string;
  mode: "setup" | "exploration" | "combat";
  party: Character[];
  scene: Scene;
  combat: CombatState | null;
  narrativeLog: NarrativeEntry[];
  isLoading: boolean;
  audioEnabled: boolean;
  voiceAssignments: Record<string, string>;
  terrainEditMode: boolean;
  selectedTerrainType: TerrainType | null;
}

// API request/response types
export interface GeneratePartyRequest {
  action: "generate_party";
  preferences: { partySize: number };
}

export interface GeneratePartyResponse {
  sessionId: string;
  party: Character[];
  scene: Scene;
  voiceAssignments: Record<string, string>;
}

export interface DmInputRequest {
  action: "dm_input";
  sessionId: string;
  message: string;
  tokenPositions?: Record<string, [number, number]>;
  gameState?: {
    mode: string;
    party: Character[];
    scene: Scene;
    combat: CombatState | null;
  };
}

export interface DmInputResponse {
  sessionId: string;
  mode: "exploration" | "combat";
  narrative: string;
  npcActions: NpcAction[];
  combatState?: CombatState;
  partyUpdates?: Record<string, Partial<Character>>;
  mapId?: string;
}

export interface RollDiceRequest {
  action: "roll_dice";
  expression: string;
  purpose?: string;
}

export interface RollDiceResponse {
  expression: string;
  individual: number[];
  modifier: number;
  total: number;
  purpose: string;
}

export type LookupResource =
  | "monster"
  | "spell"
  | "armor"
  | "background"
  | "class"
  | "magicItem"
  | "race"
  | "weapon";

export interface LookupRequest {
  action: "lookup";
  resource: LookupResource;
  query: string;
}

export interface LookupResponse {
  resource: string;
  items: unknown[];
  count: number;
}

// Legacy alias kept for backwards compatibility
export interface LookupMonsterRequest {
  action: "lookup_monster";
  query: string;
}

export interface LookupMonsterResponse {
  monsters: Monster[];
}

// Campaign Lore types
export interface CampaignLoreRequest {
  action: "campaign_lore";
  sessionId: string;
  question: string;
  campaignNumber: number;
  episodeNumber: number;
}

export interface CampaignLoreResponse {
  answer: string;
  sources: { segment_id: string; content: string; type: string }[];
}
