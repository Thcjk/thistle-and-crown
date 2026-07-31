import type { HeroDefinition } from "@/types/data.types";

export const elaraMistbow: HeroDefinition = {
  id: "elara_mistbow",
  displayName: "Elara Mistbow",
  faction: "highland_covenant",
  role: ["marksman", "mage", "kiter"],
  modelAssetId: "hero_elara",
  baseStats: {
    maxHealth: 520,
    healthRegenPer5: 4,
    attackDamage: 54,
    attackSpeed: 0.82,
    armor: 22,
    magicResist: 30,
    moveSpeed: 5.35,
    attackRange: 5.8,
    abilityPower: 0,
  },
  growthStats: {
    maxHealth: 72,
    attackDamage: 3.2,
    armor: 2.5,
    magicResist: 2.8,
    abilityPower: 2,
  },
  abilityIds: [
    "elara_mistveil",
    "elara_piercing_arrow",
    "elara_mist_ward",
    "elara_glade_step",
    "elara_rain_of_runes",
  ],
  portraitColor: "#4a7a8a",
};
