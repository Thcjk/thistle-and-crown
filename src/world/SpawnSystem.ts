import type { MapDefinition } from "@/types/data.types";
import type { TeamId, Vec3 } from "@/types/game.types";
import { logger } from "@/utils/logger";

export class SpawnSystem {
  constructor(private readonly map: MapDefinition) {}

  getHeroSpawn(teamId: TeamId): Vec3 {
    const base = this.map.bases[teamId];
    if (!base) {
      logger.error("Spawn", `Missing base for ${teamId}`);
      return { x: 0, y: 0, z: 0 };
    }
    return { ...base.spawn };
  }

  isInHealZone(teamId: TeamId, position: Vec3): boolean {
    const base = this.map.bases[teamId];
    const dx = position.x - base.spawn.x;
    const dz = position.z - base.spawn.z;
    return Math.hypot(dx, dz) <= base.healRadius;
  }
}
