import type { Hero } from "@/entities/heroes/Hero";

export class CooldownSystem {
  tick(hero: Hero, dt: number): void {
    for (const ability of hero.abilities) {
      if (ability.cooldownRemaining > 0) {
        ability.cooldownRemaining = Math.max(0, ability.cooldownRemaining - dt);
      }
    }
    if (hero.attackCooldown > 0) {
      hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
    }
  }

  start(hero: Hero, abilityId: string, duration: number): boolean {
    const ability = hero.abilities.find((a) => a.abilityId === abilityId);
    if (!ability) return false;
    if (ability.cooldownRemaining > 0) return false;
    ability.cooldownRemaining = duration;
    return true;
  }

  isReady(hero: Hero, abilityId: string): boolean {
    const ability = hero.abilities.find((a) => a.abilityId === abilityId);
    if (!ability) return false;
    if (ability.slot === "passive") return true;
    return ability.level > 0 && ability.cooldownRemaining <= 0;
  }
}
