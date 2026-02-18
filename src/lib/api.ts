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
} from "./types";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL!;

async function webhookFetch<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Webhook request failed: ${res.status}`);
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
  gameState?: DmInputRequest["gameState"]
): Promise<DmInputResponse> {
  return webhookFetch<DmInputResponse>({
    action: "dm_input",
    sessionId,
    message,
    tokenPositions,
    gameState,
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
