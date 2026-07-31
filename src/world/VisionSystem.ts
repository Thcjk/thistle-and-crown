import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { Hero } from "@/entities/heroes/Hero";
import { distance2D } from "@/utils/math";

export interface BushDefinition {
  id: string;
  position: { x: number; z: number };
  radius: number;
}

/**
 * Simplified bush visibility — units in a bush are hidden from enemies outside it.
 * Foundation for full fog-of-war later.
 */
export class VisionSystem {
  constructor(private readonly bushes: BushDefinition[]) {}

  getBushAt(x: number, z: number): string | null {
    for (const bush of this.bushes) {
      if (distance2D({ x, z }, bush.position) <= bush.radius) {
        return bush.id;
      }
    }
    return null;
  }

  /** Can observer see target? Heroes/minions in same bush always see each other. */
  canSee(observer: LivingEntity, target: LivingEntity): boolean {
    if (!target.isAlive) return false;
    if (observer.teamId === target.teamId) return true;
    if (target.kind === "tower" || target.kind === "core" || target.kind === "barracks") {
      return true;
    }

    const targetBush = this.getBushAt(target.position.x, target.position.z);
    if (!targetBush) return true;

    const observerBush = this.getBushAt(observer.position.x, observer.position.z);
    return observerBush === targetBush;
  }

  /** Visible enemy heroes for minimap/HUD (player perspective). */
  visibleEnemyHeroes(player: Hero, heroes: Hero[]): Hero[] {
    return heroes.filter(
      (h) =>
        h.isAlive &&
        h.teamId !== player.teamId &&
        this.canSee(player, h),
    );
  }
}
