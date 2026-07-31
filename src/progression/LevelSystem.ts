import type { Hero } from "@/entities/heroes/Hero";
import { getAbilityDefinition } from "@/data/abilities";
import { canUnlockUltimate } from "@/data/balance/progression";

export class LevelSystem {
  upgradeAbility(hero: Hero, abilityId: string): boolean {
    if (hero.skillPoints <= 0) return false;
    const runtime = hero.abilities.find((a) => a.abilityId === abilityId);
    const def = getAbilityDefinition(abilityId);
    if (!runtime || !def || def.slot === "passive") return false;
    if (runtime.level >= def.maxLevel) return false;
    if (def.slot === "R") {
      if (!canUnlockUltimate(hero.level) && runtime.level === 0) return false;
      if (runtime.level >= 1 && hero.level < 11) return false;
    }
    runtime.level += 1;
    hero.skillPoints -= 1;
    return true;
  }
}
