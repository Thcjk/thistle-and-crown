import { CombatEntity } from "@/entities/core/CombatEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { MonsterDefinition } from "@/types/data.types";
import type { Vec3 } from "@/types/game.types";
import { copyVec3 } from "@/utils/math";

export class NeutralMonster extends CombatEntity {
  readonly campId: string;
  readonly homePosition: Vec3;
  readonly leashRadius: number;
  readonly aggroRadius: number;
  readonly buffId?: string;
  returningHome = false;

  constructor(
    def: MonsterDefinition,
    campId: string,
    position: Vec3,
    leashRadius: number,
    aggroRadius: number,
  ) {
    super(
      {
        id: generateEntityId(`monster_${def.id}`),
        kind: "monster",
        teamId: "neutral",
        displayName: def.displayName,
        definitionId: def.id,
      },
      position,
      { ...def.stats },
      def.stats.attackRange > 2 ? 0.8 : 0.4,
    );
    this.campId = campId;
    this.homePosition = copyVec3(position);
    this.leashRadius = leashRadius;
    this.aggroRadius = aggroRadius;
    this.buffId = def.buffId;
    this.goldReward = def.goldReward;
    this.xpReward = def.xpReward;
  }
}
