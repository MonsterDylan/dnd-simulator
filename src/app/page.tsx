"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateParty } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";
import { CampaignCharacterSelect } from "@/components/CampaignCharacterSelect";
import { PARTY_COLORS, CR4_CHARACTER_ART } from "@/lib/helpers";
import type { Character, Scene, InventoryItem } from "@/lib/types";
import campaignData from "@/data/campaigns/campaign4-episode1.json";
import campaignIndex from "@/data/campaigns/campaign4-index.json";
import type { CampaignEpisode, CastMember } from "@/data/campaigns/campaign4-schema";

const episode = campaignData as CampaignEpisode;
const CAMPAIGN_EPISODES = campaignIndex.episodes;

function charImageUrl(_race: string, _cls: string, name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const MALE_VOICES = [
  { id: "SOYHLrjzK2X1ezoPC6cr", name: "Harry" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "g5CIjZEefAph4nQFvHAz", name: "Ethan" },
];

const FEMALE_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
];

// Player name → gender for correct voice assignment
const PLAYER_GENDER: Record<string, "male" | "female"> = {
  "Laura Bailey": "female",
  "Luis Carazo": "male",
  "Robbie Daymond": "male",
  "Aabria Iyengar": "female",
  "Taliesin Jaffe": "male",
  "Ashley Johnson": "female",
  "Matthew Mercer": "male",
  "Whitney Moore": "female",
  "Liam O'Brien": "male",
  "Marisha Ray": "female",
  "Sam Riegel": "male",
  "Alexander Ward": "male",
  "Travis Willingham": "male",
};

function uid() {
  return "xxxx-xxxx-xxxx".replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function mod(score: number) {
  return Math.floor((score - 10) / 2);
}

function r4d6() {
  const r = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
  r.sort((a, b) => a - b);
  return r[1] + r[2] + r[3];
}

const CLASS_HIT_DICE: Record<string, number> = {
  Fighter: 10, Wizard: 6, Rogue: 8, Cleric: 8, Ranger: 10, Paladin: 10,
  Barbarian: 12, Bard: 8, Druid: 8, Sorcerer: 6, Warlock: 8, Monk: 8,
};

const CLASS_GEAR: Record<string, InventoryItem[]> = {
  Fighter:   [{ name: "Longsword", quantity: 1, type: "weapon" }, { name: "Chain Mail", quantity: 1, type: "armor" }, { name: "Shield", quantity: 1, type: "armor" }],
  Paladin:   [{ name: "Warhammer", quantity: 1, type: "weapon" }, { name: "Chain Mail", quantity: 1, type: "armor" }, { name: "Holy Symbol", quantity: 1, type: "gear" }],
  Rogue:     [{ name: "Rapier", quantity: 1, type: "weapon" }, { name: "Shortbow", quantity: 1, type: "weapon" }, { name: "Thieves' Tools", quantity: 1, type: "gear" }],
  Wizard:    [{ name: "Quarterstaff", quantity: 1, type: "weapon" }, { name: "Spellbook", quantity: 1, type: "gear" }, { name: "Arcane Focus", quantity: 1, type: "gear" }],
  Cleric:    [{ name: "Mace", quantity: 1, type: "weapon" }, { name: "Scale Mail", quantity: 1, type: "armor" }, { name: "Holy Symbol", quantity: 1, type: "gear" }],
  Druid:     [{ name: "Scimitar", quantity: 1, type: "weapon" }, { name: "Wooden Shield", quantity: 1, type: "armor" }, { name: "Druidic Focus", quantity: 1, type: "gear" }],
  Bard:      [{ name: "Rapier", quantity: 1, type: "weapon" }, { name: "Lute", quantity: 1, type: "gear" }, { name: "Leather Armor", quantity: 1, type: "armor" }],
  Ranger:    [{ name: "Longbow", quantity: 1, type: "weapon" }, { name: "Shortsword", quantity: 2, type: "weapon" }, { name: "Leather Armor", quantity: 1, type: "armor" }],
  Barbarian: [{ name: "Greataxe", quantity: 1, type: "weapon" }, { name: "Javelin", quantity: 4, type: "weapon" }, { name: "Explorer's Pack", quantity: 1, type: "gear" }],
  Sorcerer:  [{ name: "Dagger", quantity: 2, type: "weapon" }, { name: "Arcane Focus", quantity: 1, type: "gear" }, { name: "Explorer's Pack", quantity: 1, type: "gear" }],
  Warlock:   [{ name: "Light Crossbow", quantity: 1, type: "weapon" }, { name: "Arcane Focus", quantity: 1, type: "gear" }, { name: "Leather Armor", quantity: 1, type: "armor" }],
  Monk:      [{ name: "Shortsword", quantity: 1, type: "weapon" }, { name: "Dart", quantity: 10, type: "weapon" }, { name: "Explorer's Pack", quantity: 1, type: "gear" }],
};

function buildCampaignParty(selectedCast: CastMember[], selectedEp: number): { party: Character[]; sessionId: string; scene: Scene; voiceAssignments: Record<string, string> } {
  const sessionId = uid() + "-" + uid();
  const party: Character[] = [];
  const voiceAssignments: Record<string, string> = {};

  for (let i = 0; i < selectedCast.length; i++) {
    const member = selectedCast[i];
    const primaryClass = (member.class || "Fighter").split("/")[0].trim();
    const race = member.race || "Human";
    const hd = CLASS_HIT_DICE[primaryClass] || 8;

    const abilities = {
      strength: r4d6(), dexterity: r4d6(), constitution: r4d6(),
      intelligence: r4d6(), wisdom: r4d6(), charisma: r4d6(),
    };

    const hp = Math.max(hd + mod(abilities.constitution), 1);
    let ac = 10 + mod(abilities.dexterity);
    if (["Fighter", "Paladin"].includes(primaryClass)) ac = 16;
    else if (["Ranger", "Rogue"].includes(primaryClass)) ac = 12 + mod(abilities.dexterity);
    else if (primaryClass === "Cleric") ac = 14 + Math.min(2, mod(abilities.dexterity));
    else if (primaryClass === "Barbarian") ac = 10 + mod(abilities.dexterity) + mod(abilities.constitution);

    const speed = race === "Dwarf" || race === "Halfling" || race === "Gnome" ? 25 : 30;
    const gender = PLAYER_GENDER[member.player] || "male";
    const voicePool = gender === "female" ? FEMALE_VOICES : MALE_VOICES;
    const poolIndex = gender === "female"
      ? selectedCast.filter((m, j) => j < i && PLAYER_GENDER[m.player] === "female").length
      : selectedCast.filter((m, j) => j < i && PLAYER_GENDER[m.player] !== "female").length;
    const voiceId = voicePool[poolIndex % voicePool.length].id;

    const gear = CLASS_GEAR[primaryClass] || CLASS_GEAR.Fighter;
    const inventory: InventoryItem[] = [
      ...gear,
      { name: "Backpack", quantity: 1, type: "gear" },
      { name: "Rations", quantity: 5, type: "gear" },
      { name: "Healing Potion", quantity: 1, type: "potion" },
    ];

    const char: Character = {
      id: uid(),
      name: member.character,
      race,
      className: primaryClass,
      level: 1,
      background: "Adventurer",
      personalityTraits: `Played by ${member.player} in Critical Role Campaign 4.`,
      alignment: "Neutral Good",
      abilities,
      hp: { current: hp, max: hp, temp: 0 },
      ac,
      speed,
      proficiencyBonus: 2,
      savingThrows: [],
      skills: [],
      inventory,
      position: [3 + i * 2, 8] as [number, number],
      voiceId,
      color: PARTY_COLORS[i % PARTY_COLORS.length],
      imageUrl: CR4_CHARACTER_ART[member.character] || charImageUrl(race, primaryClass, member.character),
    };

    party.push(char);
    voiceAssignments[member.character] = voiceId;
  }

  const ep = CAMPAIGN_EPISODES.find(e => e.number === selectedEp) ?? CAMPAIGN_EPISODES[0];
  const scene: Scene = {
    description: ep.scene_description,
    mapId: ep.scene_map,
    terrain: [],
  };

  return { party, sessionId, scene, voiceAssignments };
}

type GameMode = null | "random" | "campaign_episode" | "campaign_select" | "campaign";

export default function Home() {
  const router = useRouter();
  const [party, setParty] = useState<Character[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [scene, setScene] = useState<Scene | null>(null);
  const [voiceAssignments, setVoiceAssignments] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<GameMode>(null);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  const handleGenerateRandom = async () => {
    setMode("random");
    setIsGenerating(true);
    setError("");
    try {
      const res = await generateParty(4);
      const partyWithImages = res.party.map((char) => ({
        ...char,
        imageUrl: charImageUrl(char.race, char.className, char.name),
      }));
      setParty(partyWithImages);
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

  const handleCampaignSelect = () => {
    setMode("campaign_episode");
    setError("");
  };

  const handleEpisodeConfirm = (epNum: number) => {
    setSelectedEpisode(epNum);
    setMode("campaign_select");
  };

  const handleConfirmCampaignParty = (selected: CastMember[]) => {
    setMode("campaign");
    setIsGenerating(true);
    setError("");
    try {
      const result = buildCampaignParty(selected, selectedEpisode);
      setParty(result.party);
      setSessionId(result.sessionId);
      setScene(result.scene);
      setVoiceAssignments(result.voiceAssignments);
    } catch (err) {
      console.error("Failed to build campaign party:", err);
      setError("Failed to build campaign party.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartGame = () => {
    localStorage.setItem(
      "dnd-session",
      JSON.stringify({ sessionId, party, scene, voiceAssignments, campaignMode: mode === "campaign", episodeNumber: selectedEpisode })
    );
    router.push("/game");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-dnd-gold mb-3 tracking-tight">
          Critical Role Campaign Simulator
        </h1>
        <p className="text-dnd-text-muted text-lg max-w-md mx-auto">
          AI-powered D&D with voice-enabled NPC party members.
          You are the Dungeon Master.
        </p>
      </div>

      {/* Mode Selection */}
      {party.length === 0 && !isGenerating && mode !== "campaign_select" && mode !== "campaign_episode" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <button
              onClick={handleGenerateRandom}
              className="bg-dnd-gold hover:bg-dnd-gold-light text-dnd-text-dark font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-dnd-gold/20"
            >
              Generate Random Party
            </button>
            <button
              onClick={handleCampaignSelect}
              className="bg-dnd-purple hover:bg-dnd-purple/80 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-dnd-purple/20 border border-dnd-purple"
            >
              Campaign Mode
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-dnd-text-muted max-w-sm">
              <span className="text-dnd-gold">Random</span> generates fresh D&D characters.{" "}
              <span className="text-dnd-purple">Campaign Mode</span> loads characters from
              Critical Role Campaign 4 with transcript-based lore.
            </p>
          </div>
        </div>
      )}

      {/* Episode Selection */}
      {mode === "campaign_episode" && (
        <div className="w-full max-w-4xl mt-6">
          <h2 className="text-2xl font-bold text-dnd-gold mb-2 text-center">Select Episode</h2>
          <p className="text-dnd-text-muted text-sm text-center mb-6">
            Choose which episode to start your campaign from. Each episode picks up where the story left off.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {CAMPAIGN_EPISODES.map((ep) => (
              <button
                key={ep.number}
                onClick={() => handleEpisodeConfirm(ep.number)}
                disabled={!ep.available}
                className={`text-left p-4 rounded-xl border transition-all ${
                  !ep.available
                    ? "border-dnd-border/30 opacity-40 cursor-not-allowed"
                    : "border-dnd-border hover:border-dnd-gold hover:shadow-lg hover:shadow-dnd-gold/10 cursor-pointer"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-dnd-gold font-bold text-lg">EP {ep.number}</span>
                  <span className="text-dnd-text font-semibold text-sm">{ep.title}</span>
                  <span className="ml-auto text-dnd-text-muted text-xs">{ep.duration}</span>
                </div>
                <p className="text-dnd-text-muted text-xs leading-relaxed line-clamp-2">
                  {ep.scene_description}
                </p>
                {!ep.available && (
                  <span className="text-dnd-text-muted text-xs italic mt-1 block">Processing...</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => { setMode(null); setError(""); }}
              className="border border-dnd-border text-dnd-text-muted hover:text-dnd-text hover:border-dnd-gold px-6 py-3 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Campaign Character Selection */}
      {mode === "campaign_select" && (
        <div className="w-full mt-6">
          <div className="text-center mb-4">
            <p className="text-dnd-purple text-sm">
              Episode {selectedEpisode}: {CAMPAIGN_EPISODES.find(e => e.number === selectedEpisode)?.title}
            </p>
          </div>
          <CampaignCharacterSelect
            cast={episode.cast}
            onConfirm={handleConfirmCampaignParty}
            onBack={() => { setMode("campaign_episode"); setError(""); }}
          />
        </div>
      )}

      {/* Loading */}
      {isGenerating && party.length === 0 && (
        <div className="flex items-center gap-3 text-dnd-text-muted">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {mode === "campaign" ? "Loading Campaign Party..." : "Summoning Adventurers..."}
        </div>
      )}

      {error && (
        <p className="text-dnd-red mt-4 text-sm">{error}</p>
      )}

      {/* Party Cards */}
      {party.length > 0 && (
        <div className={`w-full mt-8 ${party.length <= 4 ? "max-w-4xl" : "max-w-6xl"}`}>
          <h2 className="text-2xl font-bold text-dnd-text mb-1 text-center">
            {mode === "campaign" ? "Campaign 4 Party" : "Your Adventuring Party"}
          </h2>
          {mode === "campaign" && (
            <p className="text-center text-xs text-dnd-purple mb-4">
              Critical Role Campaign 4 — Episode {selectedEpisode}: {CAMPAIGN_EPISODES.find(e => e.number === selectedEpisode)?.title ?? episode.episode.title} — Aramán
            </p>
          )}
          <div className={`grid grid-cols-1 gap-4 mb-8 ${
            party.length <= 4 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
          }`}>
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
              onClick={() => { setParty([]); setMode(null); }}
              className="border border-dnd-border text-dnd-text-muted hover:text-dnd-text hover:border-dnd-gold px-6 py-3 rounded-xl transition-colors"
            >
              Back
            </button>
            {mode === "random" && (
              <button
                onClick={handleGenerateRandom}
                disabled={isGenerating}
                className="border border-dnd-border text-dnd-text-muted hover:text-dnd-text hover:border-dnd-gold px-6 py-3 rounded-xl transition-colors"
              >
                Reroll Party
              </button>
            )}
            {mode === "campaign" && (
              <button
                onClick={() => { setParty([]); setMode("campaign_select"); }}
                className="border border-dnd-purple text-dnd-purple hover:bg-dnd-purple/10 px-6 py-3 rounded-xl transition-colors"
              >
                Change Party
              </button>
            )}
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
