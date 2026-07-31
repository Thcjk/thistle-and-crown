import { LivingEntity } from "@/entities/core/LivingEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { LaneId, TeamId, Vec3 } from "@/types/game.types";

/** Clan Gate / Oathstone — lane inhibitor equivalent. Destroying it empowers ally minions on that lane. */
export class LaneGate extends LivingEntity {
  readonly laneId: LaneId;
  destroyed = false;

  constructor(id: string, teamId: TeamId, laneId: LaneId, position: Vec3) {
    super(
      {
        id: generateEntityId(`gate_${id}`),
        kind: "barracks",
        teamId,
        displayName: teamId === "highland" ? "Clan Gate" : "Crown Bastion",
        definitionId: id,
      },
      position,
      {
        maxHealth: 1800,
        healthRegenPer5: 0,
        attackDamage: 0,
        attackSpeed: 0,
        armor: 25,
        magicResist: 25,
        moveSpeed: 0,
        attackRange: 0,
      },
      1.4,
    );
    this.laneId = laneId;
    this.goldReward = 80;
    this.xpReward = 60;
  }
}
