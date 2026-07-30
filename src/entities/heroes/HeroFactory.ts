import { Hero } from "./Hero";
import { getHeroDefinition } from "@/data/heroes";
import { getAbilityDefinition } from "@/data/abilities";
import type { TeamId, Vec3 } from "@/types/game.types";

export class HeroFactory {
  create(heroId: string, teamId: TeamId, position: Vec3, isPlayer: boolean): Hero | null {
    const def = getHeroDefinition(heroId);
    if (!def) return null;
    const hero = new Hero(def, teamId, position, isPlayer);
    for (const abilityId of def.abilityIds) {
      const ability = getAbilityDefinition(abilityId);
      if (!ability) continue;
      hero.abilities.push({
        abilityId,
        slot: ability.slot,
        level: ability.slot === "passive" ? 1 : 0,
        cooldownRemaining: 0,
      });
    }
    return hero;
  }
}
