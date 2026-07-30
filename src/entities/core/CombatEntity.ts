import { LivingEntity } from "./LivingEntity";
import type { EntityIdentity, EntityStats } from "@/types/entity.types";
import type { Vec3 } from "@/types/game.types";

export type OrderMode = "none" | "move" | "attack" | "attackMove" | "hold";

export class CombatEntity extends LivingEntity {
  attackTargetId: string | null = null;
  intendedMoveTarget: Vec3 | null = null;
  isMoving = false;
  orderMode: OrderMode = "none";
  /** Destination for attack-move; unit attacks enemies acquired en route. */
  attackMovePoint: Vec3 | null = null;
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
    this.attackMovePoint = null;
    this.orderMode = "move";
  }

  orderAttack(targetId: string): void {
    if (this.dead || this.isStunned()) return;
    this.attackTargetId = targetId;
    this.intendedMoveTarget = null;
    this.attackMovePoint = null;
    this.isMoving = false;
    this.orderMode = "attack";
  }

  orderAttackMove(point: Vec3): void {
    if (this.dead || this.isStunned()) return;
    this.attackMovePoint = { ...point };
    this.intendedMoveTarget = { ...point };
    this.attackTargetId = null;
    this.isMoving = true;
    this.orderMode = "attackMove";
  }

  orderStop(): void {
    if (this.dead) return;
    this.clearOrders();
    this.orderMode = "hold";
  }

  clearOrders(): void {
    this.intendedMoveTarget = null;
    this.attackTargetId = null;
    this.attackMovePoint = null;
    this.isMoving = false;
    this.orderMode = "none";
  }

  addThreat(sourceId: string, amount: number): void {
    this.threatTable.set(sourceId, (this.threatTable.get(sourceId) ?? 0) + amount);
  }
}
