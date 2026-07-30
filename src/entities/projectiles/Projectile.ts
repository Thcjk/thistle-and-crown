import { Entity, generateEntityId } from "@/entities/core/Entity";
import type { DamageType } from "@/types/combat.types";
import type { TeamId, Vec3 } from "@/types/game.types";
import { copyVec3, distance2D, directionTo } from "@/utils/math";

export class Projectile extends Entity {
  readonly sourceId: string;
  readonly targetId: string;
  readonly damage: number;
  readonly damageType: DamageType;
  readonly speed: number;
  readonly abilityId?: string;
  arrived = false;

  constructor(params: {
    teamId: TeamId | "neutral";
    sourceId: string;
    targetId: string;
    origin: Vec3;
    damage: number;
    damageType: DamageType;
    speed: number;
    abilityId?: string;
  }) {
    super(
      {
        id: generateEntityId("projectile"),
        kind: "projectile",
        teamId: params.teamId,
        displayName: "Projectile",
        definitionId: "projectile",
      },
      copyVec3(params.origin),
      0.2,
    );
    this.sourceId = params.sourceId;
    this.targetId = params.targetId;
    this.damage = params.damage;
    this.damageType = params.damageType;
    this.speed = params.speed;
    this.abilityId = params.abilityId;
  }

  update(dt: number, targetPos: Vec3): void {
    const dist = distance2D(this.position, targetPos);
    const step = this.speed * dt;
    if (dist <= step + 0.2) {
      this.setPosition(targetPos.x, 1, targetPos.z);
      this.arrived = true;
      return;
    }
    const dir = directionTo(this.position, targetPos);
    this.setPosition(
      this.position.x + dir.x * step,
      1,
      this.position.z + dir.z * step,
    );
  }
}
