import type { HeroDefinition } from "@/types/data.types";

export const aldricVale: HeroDefinition = {
  id: "aldric_vale",
  displayName: "Sir Aldric Vale",
  faction: "iron_crown",
  role: ["vanguard", "tank", "control"],
  modelAssetId: "hero_aldric",
  baseStats: {
    maxHealth: 720,
    healthRegenPer5: 6,
    attackDamage: 58,
    attackSpeed: 0.7,
    armor: 38,
    magicResist: 30,
    moveSpeed: 5.2,
    attackRange: 2.0,
  },
  growthStats: {
    maxHealth: 95,
    attackDamage: 3.5,
    armor: 4,
    magicResist: 2.5,
  },
  abilityIds: [
    "aldric_iron_resolve",
    "aldric_bulwark_slam",
    "aldric_crown_guard",
    "aldric_vanguard_rush",
    "aldric_oath_of_the_crown",
  ],
  portraitColor: "#8b3a3a",
};
