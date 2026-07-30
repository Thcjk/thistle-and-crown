import type { Minion } from "@/entities/minions/Minion";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { TargetingSystem } from "@/combat/TargetingSystem";
import { distance2D } from "@/utils/math";

export class LaneAI {
  updateMinion(
    minion: Minion,
    entities: LivingEntity[],
    targeting: TargetingSystem,
  ): void {
    if (!minion.isAlive || minion.isStunned()) return;

    const combatRange = Math.max(minion.stats.attackRange + 1.5, 4);
    const target = targeting.selectMinionTarget(minion, entities, combatRange);
    if (target) {
      minion.orderAttack(target.id);
      return;
    }

    const wp = minion.waypoints[minion.waypointIndex];
    if (!wp) return;
    if (distance2D(minion.position, wp) < 1.2) {
      minion.waypointIndex = Math.min(
        minion.waypointIndex + 1,
        minion.waypoints.length - 1,
      );
    }
    const next = minion.waypoints[minion.waypointIndex];
    if (next) {
      minion.orderMove(next);
    }
  }
}
