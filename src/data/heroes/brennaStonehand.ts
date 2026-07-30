import type { HeroDefinition } from "@/types/data.types";

export const brennaStonehand: HeroDefinition = {
  id: "brenna_stonehand",
  displayName: "Brenna Stonehand",
  faction: "highland_covenant",
  role: ["bruiser", "frontliner", "initiator"],
  modelAssetId: "hero_brenna",
  baseStats: {
    maxHealth: 650,
    healthRegenPer5: 5,
    attackDamage: 62,
    attackSpeed: 0.75,
    armor: 32,
    magicResist: 28,
    moveSpeed: 5.5,
    attackRange: 2.2,
  },
  growthStats: {
    maxHealth: 85,
    attackDamage: 4,
    armor: 3.5,
    magicResist: 2.5,
    healthRegenPer5: 0.6,
  },
  abilityIds: [
    "brenna_clan_resolve",
    "brenna_cleaving_arc",
    "brenna_stoneguard",
    "brenna_highland_charge",
    "brenna_oath_of_the_clans",
  ],
  portraitColor: "#3d6b5a",
};
