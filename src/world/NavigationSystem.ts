import type { MapDefinition } from "@/types/data.types";
import type { LaneId, TeamId, Vec3 } from "@/types/game.types";
import { logger } from "@/utils/logger";

export class NavigationSystem {
  constructor(private readonly map: MapDefinition) {}

  getLanePath(teamId: TeamId, laneId: LaneId): Vec3[] {
    const lane = this.map.lanes.find((l) => l.teamId === teamId && l.laneId === laneId);
    if (!lane || lane.points.length === 0) {
      logger.warn("Navigation", `Missing lane path for ${teamId}/${laneId}`);
      return [this.map.bases[teamId].spawn];
    }
    return lane.points.map((p) => ({ ...p }));
  }
}
