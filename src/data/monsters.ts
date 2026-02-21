import type { Monster } from "@/lib/types";

export type MonsterPreset = Omit<Monster, "position">;

export const MONSTER_PRESETS: Record<string, MonsterPreset> = {
  Goblin: {
    name: "Goblin",
    hp: { current: 7, max: 7 },
    ac: 15,
    cr: 0.25,
    attacks: [
      { name: "Scimitar", bonus: 4, damage: "1d6+2 slashing" },
      { name: "Shortbow", bonus: 4, damage: "1d6+2 piercing" },
    ],
    specialAbilities: ["Nimble Escape"],
  },
  Hobgoblin: {
    name: "Hobgoblin",
    hp: { current: 11, max: 11 },
    ac: 18,
    cr: 0.5,
    attacks: [
      { name: "Longsword", bonus: 3, damage: "1d10+1 slashing" },
      { name: "Longbow", bonus: 3, damage: "1d8+1 piercing" },
    ],
    specialAbilities: ["Martial Advantage"],
  },
  Orc: {
    name: "Orc",
    hp: { current: 15, max: 15 },
    ac: 13,
    cr: 0.5,
    attacks: [
      { name: "Greataxe", bonus: 5, damage: "1d12+3 slashing" },
      { name: "Javelin", bonus: 5, damage: "1d6+3 piercing" },
    ],
    specialAbilities: ["Aggressive"],
  },
  Ogre: {
    name: "Ogre",
    hp: { current: 59, max: 59 },
    ac: 11,
    cr: 2,
    attacks: [
      { name: "Greatclub", bonus: 6, damage: "2d8+4 bludgeoning" },
      { name: "Javelin", bonus: 6, damage: "2d6+4 piercing" },
    ],
  },
  Skeleton: {
    name: "Skeleton",
    hp: { current: 13, max: 13 },
    ac: 13,
    cr: 0.25,
    attacks: [
      { name: "Shortsword", bonus: 4, damage: "1d6+2 piercing" },
      { name: "Shortbow", bonus: 4, damage: "1d6+2 piercing" },
    ],
    specialAbilities: ["Vulnerability to bludgeoning"],
  },
  Zombie: {
    name: "Zombie",
    hp: { current: 22, max: 22 },
    ac: 8,
    cr: 0.25,
    attacks: [{ name: "Slam", bonus: 3, damage: "1d6+1 bludgeoning" }],
    specialAbilities: ["Undead Fortitude"],
  },
  Wolf: {
    name: "Wolf",
    hp: { current: 11, max: 11 },
    ac: 13,
    cr: 0.25,
    attacks: [{ name: "Bite", bonus: 4, damage: "2d4+2 piercing" }],
    specialAbilities: ["Pack Tactics", "Keen Hearing and Smell"],
  },
  "Giant Spider": {
    name: "Giant Spider",
    hp: { current: 26, max: 26 },
    ac: 14,
    cr: 1,
    attacks: [{ name: "Bite", bonus: 5, damage: "1d8+3 piercing + 2d6 poison" }],
    specialAbilities: ["Spider Climb", "Web Sense", "Web Walker"],
  },
  Bandit: {
    name: "Bandit",
    hp: { current: 11, max: 11 },
    ac: 12,
    cr: 0.125,
    attacks: [
      { name: "Scimitar", bonus: 3, damage: "1d6+1 slashing" },
      { name: "Light Crossbow", bonus: 3, damage: "1d8+1 piercing" },
    ],
  },
  Kobold: {
    name: "Kobold",
    hp: { current: 5, max: 5 },
    ac: 12,
    cr: 0.125,
    attacks: [
      { name: "Dagger", bonus: 4, damage: "1d4+2 piercing" },
      { name: "Sling", bonus: 4, damage: "1d4+2 bludgeoning" },
    ],
    specialAbilities: ["Pack Tactics", "Sunlight Sensitivity"],
  },
  Troll: {
    name: "Troll",
    hp: { current: 84, max: 84 },
    ac: 15,
    cr: 5,
    attacks: [
      { name: "Claw", bonus: 7, damage: "2d6+4 slashing" },
      { name: "Bite", bonus: 7, damage: "1d6+4 piercing" },
    ],
    specialAbilities: ["Regeneration (10 HP/turn)", "Keen Smell"],
  },
  Owlbear: {
    name: "Owlbear",
    hp: { current: 59, max: 59 },
    ac: 13,
    cr: 3,
    attacks: [
      { name: "Beak", bonus: 7, damage: "1d10+5 piercing" },
      { name: "Claws", bonus: 7, damage: "2d8+5 slashing" },
    ],
    specialAbilities: ["Keen Sight and Smell"],
  },
  Mimic: {
    name: "Mimic",
    hp: { current: 58, max: 58 },
    ac: 12,
    cr: 2,
    attacks: [
      { name: "Pseudopod", bonus: 5, damage: "1d8+3 bludgeoning" },
      { name: "Bite", bonus: 5, damage: "1d8+3 piercing + 1d8 acid" },
    ],
    specialAbilities: ["Shapechanger", "Adhesive", "Grappler"],
  },
  "Gelatinous Cube": {
    name: "Gelatinous Cube",
    hp: { current: 84, max: 84 },
    ac: 6,
    cr: 2,
    attacks: [{ name: "Pseudopod", bonus: 4, damage: "3d6 acid" }],
    specialAbilities: ["Transparent", "Engulf"],
  },
  "Young Dragon": {
    name: "Young Dragon",
    hp: { current: 136, max: 136 },
    ac: 18,
    cr: 10,
    attacks: [
      { name: "Bite", bonus: 10, damage: "2d10+6 piercing" },
      { name: "Claw", bonus: 10, damage: "2d6+6 slashing" },
      { name: "Breath Weapon", bonus: 0, damage: "12d6 fire (DC 17 Dex save)" },
    ],
    specialAbilities: ["Multiattack (3)", "Frightful Presence"],
  },
};

export const QUICK_SPAWN_PRESETS = [
  "Goblin",
  "Ogre",
  "Skeleton",
  "Wolf",
  "Bandit",
  "Young Dragon",
] as const;
