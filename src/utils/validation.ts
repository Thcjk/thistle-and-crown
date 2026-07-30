import type { AbilityDefinition, HeroDefinition, ItemDefinition } from "@/types/data.types";
import { logger } from "./logger";

export function validateHeroDefinition(hero: HeroDefinition): string[] {
  const errors: string[] = [];
  if (!hero.id) errors.push("Hero missing id");
  if (!hero.displayName) errors.push(`Hero ${hero.id}: missing displayName`);
  if (!hero.baseStats) errors.push(`Hero ${hero.id}: missing baseStats`);
  if (hero.baseStats) {
    if (hero.baseStats.maxHealth <= 0) {
      errors.push(`Hero ${hero.id}: maxHealth must be > 0`);
    }
    if (hero.baseStats.moveSpeed <= 0) {
      errors.push(`Hero ${hero.id}: moveSpeed must be > 0`);
    }
  }
  if (!hero.abilityIds?.length) {
    errors.push(`Hero ${hero.id}: abilityIds must not be empty`);
  }
  return errors;
}

export function validateAbilityDefinition(ability: AbilityDefinition): string[] {
  const errors: string[] = [];
  if (!ability.id) errors.push("Ability missing id");
  if (ability.cooldown < 0) errors.push(`Ability ${ability.id}: cooldown < 0`);
  if (ability.maxLevel < 1) errors.push(`Ability ${ability.id}: maxLevel < 1`);
  return errors;
}

export function validateItemDefinition(item: ItemDefinition): string[] {
  const errors: string[] = [];
  if (!item.id) errors.push("Item missing id");
  if (item.cost < 0) errors.push(`Item ${item.id}: cost < 0`);
  return errors;
}

export function assertValidOrWarn<T>(
  _value: T,
  errors: string[],
  scope: string,
): boolean {
  if (errors.length === 0) {
    return true;
  }
  logger.error(scope, `Invalid definition skipped: ${errors.join("; ")}`);
  return false;
}
