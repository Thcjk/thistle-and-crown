import type { CombatEntity } from "@/entities/core/CombatEntity";
import { directionTo, distance2D } from "@/utils/math";

/** Soft push between living units so they do not stack perfectly. */
export class SeparationSystem {
  apply(entities: CombatEntity[], strength = 0.35): void {
    for (let i = 0; i < entities.length; i += 1) {
      const a = entities[i]!;
      if (!a.isAlive || a.stats.moveSpeed <= 0) continue;
      for (let j = i + 1; j < entities.length; j += 1) {
        const b = entities[j]!;
        if (!b.isAlive || b.stats.moveSpeed <= 0) continue;
        const minDist = a.transform.radius + b.transform.radius + 0.15;
        const dist = distance2D(a.position, b.position);
        if (dist >= minDist || dist < 1e-4) continue;
        const push = (minDist - dist) * strength * 0.5;
        const dir = directionTo(b.position, a.position);
        a.setPosition(a.position.x + dir.x * push, 0, a.position.z + dir.z * push);
        b.setPosition(b.position.x - dir.x * push, 0, b.position.z - dir.z * push);
      }
    }
  }
}
