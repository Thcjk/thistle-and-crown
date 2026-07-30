import type { AbilityDefinition } from "@/types/data.types";
import { assertValidOrWarn, validateAbilityDefinition } from "@/utils/validation";
import { brennaAbilities } from "./brennaAbilities";
import { aldricAbilities } from "./aldricAbilities";

const raw = [...brennaAbilities, ...aldricAbilities];
export const abilitiesById: Record<string, AbilityDefinition> = {};

for (const ability of raw) {
  const errors = validateAbilityDefinition(ability);
  if (assertValidOrWarn(ability, errors, "AbilityData")) {
    abilitiesById[ability.id] = ability;
  }
}

export function getAbilityDefinition(id: string): AbilityDefinition | undefined {
  return abilitiesById[id];
}
