export const PLATFORM_FEE_PERCENT = 10;

export const RULESETS = [
  { id: "fists_only", label: "Fists Only" },
  { id: "wooden_sword_only", label: "Wooden Sword Only" },
  { id: "diamond_sword_only", label: "Diamond Sword Only" },
  { id: "iron_armor_iron_sword", label: "Iron Armor + Iron Sword" },
  { id: "diamond_armor_diamond_sword", label: "Diamond Armor + Diamond Sword" },
  { id: "diamond_armor_diamond_axe", label: "Diamond Armor + Diamond Axe" },
  { id: "bow_only", label: "Bow Only" },
  { id: "diamond_armor_diamond_sword_gapples", label: "Diamond Armor + Diamond Sword + Gapples" },
] as const;

/** Labels for rulesets stored before the kit list was updated. */
export const LEGACY_RULESET_LABELS: Record<string, string> = {
  no_armor_fists: "No Armor Fists",
  no_armor_sword: "No Armor Sword",
  diamond_armor: "Diamond Armor",
  iron_armor: "Iron Armor",
  wood_sword: "Wood Sword",
  no_healing: "No Healing",
  custom: "Custom Rules",
};

export const FORMATS = [
  { id: "sudden_death", label: "Sudden Death" },
  { id: "best_of_3", label: "Best of 3" },
  { id: "best_of_5", label: "Best of 5" },
  { id: "best_of_7", label: "Best of 7" },
  { id: "first_to_10", label: "First to 10" },
] as const;

/** Labels for formats stored before the format list was updated. */
export const LEGACY_FORMAT_LABELS: Record<string, string> = {
  bo1: "BO1",
  bo3: "BO3",
  bo5: "BO5",
  bo7: "BO7",
};

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
