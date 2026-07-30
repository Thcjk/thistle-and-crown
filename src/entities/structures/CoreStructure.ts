import { CombatEntity } from "@/entities/core/CombatEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { TeamId, Vec3 } from "@/types/game.types";

export class CoreStructure extends CombatEntity {
  readonly coreName: string;

  constructor(teamId: TeamId, position: Vec3) {
    const coreName = teamId === "highland" ? "Clanheart" : "Royal Bastion";
    super(
      {
        id: generateEntityId(`core_${teamId}`),
        kind: "core",
        teamId,
        displayName: coreName,
        definitionId: `core_${teamId}`,
      },
      position,
      {
        maxHealth: 3500,
        healthRegenPer5: 0,
        attackDamage: 0,
        attackSpeed: 0,
        armor: 35,
        magicResist: 35,
        moveSpeed: 0,
        attackRange: 0,
      },
      2.2,
    );
    this.coreName = coreName;
    this.goldReward = 0;
    this.xpReward = 0;
  }
}
