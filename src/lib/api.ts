import type {
  GeneratePartyRequest,
  GeneratePartyResponse,
  DmInputRequest,
  DmInputResponse,
  RollDiceRequest,
  RollDiceResponse,
  LookupResource,
  LookupRequest,
  LookupResponse,
  CampaignLoreRequest,
  CampaignLoreResponse,
  GenerateMapRequest,
  GenerateMapResponse,
  TerrainType,
} from "./types";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? "";

async function webhookFetch<T>(body: Record<string, unknown>): Promise<T> {
  if (!WEBHOOK_URL) {
    throw new Error("NEXT_PUBLIC_WEBHOOK_URL is not configured");
  }

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook request failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function generateParty(
  partySize = 4
): Promise<GeneratePartyResponse> {
  return webhookFetch<GeneratePartyResponse>({
    action: "generate_party",
    preferences: { partySize },
  } satisfies GeneratePartyRequest);
}

export async function sendDmInput(
  sessionId: string,
  message: string,
  tokenPositions?: Record<string, [number, number]>,
  gameState?: DmInputRequest["gameState"],
  campaignContext?: DmInputRequest["campaignContext"]
): Promise<DmInputResponse> {
  return webhookFetch<DmInputResponse>({
    action: "dm_input",
    sessionId,
    message,
    tokenPositions,
    gameState,
    campaignContext,
  } satisfies DmInputRequest);
}

export async function rollDice(
  expression: string,
  purpose = "Manual roll"
): Promise<RollDiceResponse> {
  return webhookFetch<RollDiceResponse>({
    action: "roll_dice",
    expression,
    purpose,
  } satisfies RollDiceRequest);
}

export async function lookupResource(
  resource: LookupResource,
  query: string
): Promise<LookupResponse> {
  return webhookFetch<LookupResponse>({
    action: "lookup",
    resource,
    query,
  } satisfies LookupRequest);
}

// Backwards-compatible alias
export const lookupMonster = (query: string) =>
  lookupResource("monster", query);

export async function queryCampaignLore(
  sessionId: string,
  question: string,
  campaignNumber = 4,
  episodeNumber = 1
): Promise<CampaignLoreResponse> {
  return webhookFetch<CampaignLoreResponse>({
    action: "campaign_lore",
    sessionId,
    question,
    campaignNumber,
    episodeNumber,
  } satisfies CampaignLoreRequest);
}

const ALL_TERRAIN_TYPES: TerrainType[] = [
  "wall", "door", "door_open", "table", "chair", "water", "deep_water",
  "lava", "pit", "pillar", "tree", "bush", "rock", "chest", "stairs_up",
  "stairs_down", "trap", "fire", "barrel", "bookshelf", "bed", "rubble",
  "ice", "bridge", "altar", "statue", "fountain",
];

export async function generateMap(
  sessionId: string,
  sceneDescription: string,
  gridSize = 16
): Promise<GenerateMapResponse> {
  return webhookFetch<GenerateMapResponse>({
    action: "generate_map",
    sessionId,
    sceneDescription,
    availableTerrainTypes: ALL_TERRAIN_TYPES,
    gridSize,
  } satisfies GenerateMapRequest);
}
