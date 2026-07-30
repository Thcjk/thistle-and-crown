import type { MapDefinition } from "@/types/data.types";
import type { Vec3 } from "@/types/game.types";
import { distance2D, directionTo } from "@/utils/math";

export class CollisionSystem {
  constructor(private readonly map: MapDefinition) {}

  isBlocked(from: Vec3, to: Vec3): boolean {
    for (const obstacle of this.map.obstacles) {
      if (distance2D(to, obstacle.position) < obstacle.radius) {
        return true;
      }
      // Segment vs circle approximation
      if (this.segmentHitsCircle(from, to, obstacle.position, obstacle.radius * 0.9)) {
        return true;
      }
    }
    const half = this.map.size.width / 2 - 1;
    if (Math.abs(to.x) > half || Math.abs(to.z) > half) {
      return true;
    }
    return false;
  }

  resolve(from: Vec3, to: Vec3): Vec3 {
    if (!this.isBlocked(from, to)) {
      return { ...to, y: 0 };
    }
    // Slide along axes for simple navigation.
    const xOnly = { x: to.x, y: 0, z: from.z };
    if (!this.isBlocked(from, xOnly)) return xOnly;
    const zOnly = { x: from.x, y: 0, z: to.z };
    if (!this.isBlocked(from, zOnly)) return zOnly;

    // Push out of overlapping obstacle
    for (const obstacle of this.map.obstacles) {
      const d = distance2D(to, obstacle.position);
      if (d < obstacle.radius && d > 1e-4) {
        const dir = directionTo(obstacle.position, to);
        return {
          x: obstacle.position.x + dir.x * (obstacle.radius + 0.05),
          y: 0,
          z: obstacle.position.z + dir.z * (obstacle.radius + 0.05),
        };
      }
    }
    return { ...from };
  }

  private segmentHitsCircle(
    a: Vec3,
    b: Vec3,
    center: Vec3,
    radius: number,
  ): boolean {
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const acx = center.x - a.x;
    const acz = center.z - a.z;
    const abLenSq = abx * abx + abz * abz;
    if (abLenSq < 1e-8) return distance2D(a, center) < radius;
    let t = (acx * abx + acz * abz) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    const closest = { x: a.x + abx * t, z: a.z + abz * t };
    const dx = closest.x - center.x;
    const dz = closest.z - center.z;
    return dx * dx + dz * dz <= radius * radius;
  }
}
