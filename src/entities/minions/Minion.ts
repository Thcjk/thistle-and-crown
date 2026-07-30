import { CombatEntity } from "@/entities/core/CombatEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { MinionDefinition } from "@/types/data.types";
import type { LaneId, Vec3 } from "@/types/game.types";

export class Minion extends CombatEntity {
  readonly role: MinionDefinition["role"];
  readonly laneId: LaneId;
  waypointIndex = 0;
  waypoints: Vec3[] = [];

  constructor(def: MinionDefinition, laneId: LaneId, position: Vec3, waypoints: Vec3[]) {
    super(
      {
        id: generateEntityId(`minion_${def.role}`),
        kind: "minion",
        teamId: def.teamId,
        displayName: def.displayName,
        definitionId: def.id,
      },
      position,
      { ...def.stats },
      def.role === "banner" ? 0.45 : 0.35,
    );
    this.role = def.role;
    this.laneId = laneId;
    this.waypoints = waypoints.map((p) => ({ ...p }));
    this.goldReward = def.goldReward;
    this.xpReward = def.xpReward;
  }
}
