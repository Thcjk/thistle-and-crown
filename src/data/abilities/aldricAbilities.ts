import type { AbilityDefinition } from "@/types/data.types";

export const aldricAbilities: AbilityDefinition[] = [
  {
    id: "aldric_bulwark_slam",
    displayName: "Bulwark Slam",
    description: "Slam the ground nearby, damaging and briefly slowing enemies.",
    slot: "Q",
    targeting: "self",
    cooldown: 8,
    manaCost: 0,
    range: 0,
    radius: 3.2,
    damage: 90,
    damageType: "physical",
    duration: 1.5,
    slowPercent: 0.3,
    maxLevel: 4,
  },
];
