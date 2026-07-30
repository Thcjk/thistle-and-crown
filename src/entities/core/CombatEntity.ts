import { LivingEntity } from "./LivingEntity";
import type { EntityIdentity, EntityStats } from "@/types/entity.types";
import type { Vec3 } from "@/types/game.types";

export class CombatEntity extends LivingEntity {
  attackTargetId: string | null = null;
  intendedMoveTarget: Vec3 | null = null;
  isMoving = false;
  threatTable = new Map<string, number>();

  constructor(
    identity: EntityIdentity,
    position: Vec3,
    stats: EntityStats,
    radius = 0.5,
  ) {
    super(identity, position, stats, radius);
  }

  orderMove(target: Vec3): void {
    if (this.dead || this.isStunned()) return;
    this.intendedMoveTarget = { ...target };
    this.isMoving = true;
    this.attackTargetId = null;
  }

  orderAttack(targetId: string): void {
    if (this.dead || this.isStunned()) return;
    this.attackTargetId = targetId;
    this.intendedMoveTarget = null;
    this.isMoving = false;
  }

  clearOrders(): void {
    this.intendedMoveTarget = null;
    this.attackTargetId = null;
    this.isMoving = false;
  }

  addThreat(sourceId: string, amount: number): void {
    this.threatTable.set(sourceId, (this.threatTable.get(sourceId) ?? 0) + amount);
  }
}
