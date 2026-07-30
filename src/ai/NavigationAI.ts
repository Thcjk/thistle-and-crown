import type { Vec3 } from "@/types/game.types";
import { directionTo, distance2D } from "@/utils/math";

/** Simple steering helpers for future pathfinding upgrades. */
export class NavigationAI {
  steerAway(from: Vec3, obstacle: Vec3, strength = 1): Vec3 {
    const dir = directionTo(obstacle, from);
    return {
      x: from.x + dir.x * strength,
      y: from.y,
      z: from.z + dir.z * strength,
    };
  }

  hasArrived(position: Vec3, target: Vec3, threshold = 0.75): boolean {
    return distance2D(position, target) <= threshold;
  }
}
