import { CombatEntity } from "@/entities/core/CombatEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { LaneId, TeamId, Vec3 } from "@/types/game.types";

export class Tower extends CombatEntity {
  readonly laneId: LaneId;
  readonly attackRangeVisual = 9;
  destroyed = false;

  constructor(id: string, teamId: TeamId, laneId: LaneId, position: Vec3) {
    super(
      {
        id: generateEntityId(`tower_${id}`),
        kind: "tower",
        teamId,
        displayName: `${teamId === "highland" ? "Clan" : "Royal"} Tower`,
        definitionId: id,
      },
      position,
      {
        maxHealth: 2200,
        healthRegenPer5: 0,
        attackDamage: 110,
        attackSpeed: 0.7,
        armor: 40,
        magicResist: 40,
        moveSpeed: 0,
        attackRange: 9,
      },
      1.2,
    );
    this.laneId = laneId;
    this.goldReward = 120;
    this.xpReward = 0;
  }
}
