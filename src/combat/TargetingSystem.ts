import type { CombatEntity } from "@/entities/core/CombatEntity";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import { distance2D } from "@/utils/math";
import { MINION_AGGRO_PRIORITY, TOWER_AGGRO_PRIORITY } from "@/utils/constants";

export class TargetingSystem {
  areEnemies(a: LivingEntity, b: LivingEntity): boolean {
    if (!a.isAlive || !b.isAlive) return false;
    if (a.teamId === "neutral" || b.teamId === "neutral") {
      return a.teamId !== b.teamId;
    }
    return a.teamId !== b.teamId;
  }

  findNearestEnemy(
    source: LivingEntity,
    candidates: LivingEntity[],
    range: number,
  ): LivingEntity | null {
    let best: LivingEntity | null = null;
    let bestDist = range;
    for (const other of candidates) {
      if (!this.areEnemies(source, other)) continue;
      const d = distance2D(source.position, other.position);
      if (d <= bestDist) {
        bestDist = d;
        best = other;
      }
    }
    return best;
  }

  selectMinionTarget(
    minion: CombatEntity,
    candidates: LivingEntity[],
    range: number,
  ): LivingEntity | null {
    const enemies = candidates.filter(
      (c) => this.areEnemies(minion, c) && distance2D(minion.position, c.position) <= range,
    );
    for (const priority of MINION_AGGRO_PRIORITY) {
      const match = enemies.find((e) => {
        switch (priority) {
          case "attackingAlliedHero":
            return e.kind === "hero" && e.attackTargetId !== null;
          case "attackingSelf":
            return e.attackTargetId === minion.id;
          case "enemyMinion":
            return e.kind === "minion";
          case "enemyHero":
            return e.kind === "hero";
          case "enemyTower":
            return e.kind === "tower";
          case "enemyCore":
            return e.kind === "core";
          default:
            return false;
        }
      });
      if (match) return match;
    }
    return enemies[0] ?? null;
  }

  selectTowerTarget(
    tower: CombatEntity,
    candidates: LivingEntity[],
    alliedHeroIds: Set<string>,
  ): LivingEntity | null {
    const range = tower.stats.attackRange;
    const enemies = candidates.filter(
      (c) => this.areEnemies(tower, c) && distance2D(tower.position, c.position) <= range,
    );

    for (const priority of TOWER_AGGRO_PRIORITY) {
      let match: LivingEntity | undefined;
      if (priority === "attackingAlliedHero") {
        match = enemies.find((e) => {
          const atk = e.attackTargetId;
          return atk !== null && alliedHeroIds.has(atk);
        });
      } else if (priority === "enemyMinion") {
        match = enemies.find((e) => e.kind === "minion");
      } else if (priority === "enemyHero") {
        match = enemies.find((e) => e.kind === "hero");
      } else {
        match = enemies[0];
      }
      if (match) return match;
    }
    return null;
  }
}
