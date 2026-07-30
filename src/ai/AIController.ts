import { HeroBotAI } from "./HeroBotAI";
import type { Hero } from "@/entities/heroes/Hero";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { AbilitySystem } from "@/combat/AbilitySystem";
import type { TargetingSystem } from "@/combat/TargetingSystem";
import type { MapDefinition } from "@/types/data.types";
import type { Vec3 } from "@/types/game.types";

export class AIController {
  private bots = new Map<string, HeroBotAI>();

  register(hero: Hero, map: MapDefinition): void {
    if (hero.isPlayer) return;
    this.bots.set(hero.id, new HeroBotAI(hero, map));
  }

  update(params: {
    dt: number;
    heroes: Hero[];
    entities: LivingEntity[];
    map: MapDefinition;
    abilitySystem: AbilitySystem;
    targeting: TargetingSystem;
    isBlocked: (from: Vec3, to: Vec3) => boolean;
  }): void {
    for (const hero of params.heroes) {
      if (hero.isPlayer) continue;
      const bot = this.bots.get(hero.id);
      bot?.update({
        dt: params.dt,
        entities: params.entities,
        map: params.map,
        abilitySystem: params.abilitySystem,
        targeting: params.targeting,
        isBlocked: params.isBlocked,
      });
    }
  }

  getState(heroId: string): string {
    return this.bots.get(heroId)?.state ?? "-";
  }

  clear(): void {
    this.bots.clear();
  }
}
