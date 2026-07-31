import { HeroBotAI } from "./HeroBotAI";
import type { Hero } from "@/entities/heroes/Hero";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { NeutralMonster } from "@/entities/monsters/NeutralMonster";
import type { AbilitySystem } from "@/combat/AbilitySystem";
import type { TargetingSystem } from "@/combat/TargetingSystem";
import type { ItemSystem } from "@/progression/ItemSystem";
import type { MapDefinition } from "@/types/data.types";
import type { BotDifficulty, TeamId, Vec3 } from "@/types/game.types";

export class AIController {
  private bots = new Map<string, HeroBotAI>();

  register(hero: Hero, map: MapDefinition, difficulty: BotDifficulty = "normal"): void {
    if (hero.isPlayer) return;
    this.bots.set(hero.id, new HeroBotAI(hero, map, difficulty));
  }

  update(params: {
    dt: number;
    heroes: Hero[];
    entities: LivingEntity[];
    monsters: NeutralMonster[];
    map: MapDefinition;
    abilitySystem: AbilitySystem;
    targeting: TargetingSystem;
    itemSystem: ItemSystem;
    isBlocked: (from: Vec3, to: Vec3) => boolean;
    isInHealZone: (teamId: TeamId, pos: Vec3) => boolean;
    elapsedSeconds: number;
    playerPosition: Vec3 | null;
  }): void {
    for (const hero of params.heroes) {
      if (hero.isPlayer) continue;
      const bot = this.bots.get(hero.id);
      bot?.update({
        dt: params.dt,
        entities: params.entities,
        monsters: params.monsters,
        map: params.map,
        abilitySystem: params.abilitySystem,
        targeting: params.targeting,
        itemSystem: params.itemSystem,
        isBlocked: params.isBlocked,
        isInHealZone: params.isInHealZone,
        elapsedSeconds: params.elapsedSeconds,
        playerPosition: params.playerPosition,
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
