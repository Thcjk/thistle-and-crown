import type { Hero } from "@/entities/heroes/Hero";
import { getAbilityDefinition } from "@/data/abilities";

export class LevelSystem {
  upgradeAbility(hero: Hero, abilityId: string): boolean {
    if (hero.skillPoints <= 0) return false;
    const runtime = hero.abilities.find((a) => a.abilityId === abilityId);
    const def = getAbilityDefinition(abilityId);
    if (!runtime || !def || def.slot === "passive") return false;
    if (runtime.level >= def.maxLevel) return false;
    // Ultimate gated until level 4 in prototype.
    if (def.slot === "R" && hero.level < 4 && runtime.level === 0) return false;
    runtime.level += 1;
    hero.skillPoints -= 1;
    return true;
  }
}
