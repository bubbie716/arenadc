export const PLATFORM_FEE_PERCENT = 10;

export const RULESETS = [
  { id: "no_armor_fists", label: "No Armor Fists" },
  { id: "no_armor_sword", label: "No Armor Sword" },
  { id: "diamond_armor", label: "Diamond Armor" },
  { id: "iron_armor", label: "Iron Armor" },
  { id: "wood_sword", label: "Wood Sword" },
  { id: "bow_only", label: "Bow Only" },
  { id: "no_healing", label: "No Healing" },
  { id: "custom", label: "Custom Rules" },
] as const;

export const FORMATS = [
  { id: "bo1", label: "BO1" },
  { id: "bo3", label: "BO3" },
  { id: "bo5", label: "BO5" },
  { id: "bo7", label: "BO7" },
  { id: "first_to_10", label: "First to 10" },
] as const;

export const V1_RULES = [
  "Fighters must wager the exact same RMD amount.",
  "Funds are escrowed when a fight is accepted.",
  "Scheduling fights is free — no fee until payout.",
  "Platform takes a 10% fee from the fighter wager pot.",
  "Winner receives the pot minus the platform fee.",
  "No spectator betting in V1 — fighter-vs-fighter only.",
  "Wagered fights must use approved arenas only.",
  "Mutual confirmation allows instant payout.",
  "Disputes require POV proof links submitted within 15 minutes.",
] as const;
