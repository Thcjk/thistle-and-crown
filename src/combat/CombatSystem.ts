import type { EventBus } from "@/engine/EventBus";
import type { CombatEntity } from "@/entities/core/CombatEntity";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import { Projectile } from "@/entities/projectiles/Projectile";
import { DamageSystem } from "./DamageSystem";
import { TargetingSystem } from "./TargetingSystem";
import { directionTo, distance2D, moveTowards, yawFromDirection } from "@/utils/math";
import type { TeamId } from "@/types/game.types";
import { MatchRules } from "@/match/MatchRules";

export class CombatSystem {
  constructor(
    _events: EventBus,
    private readonly damage: DamageSystem,
    private readonly targeting: TargetingSystem,
  ) {}

  updateMovement(
    entity: CombatEntity,
    dt: number,
    resolvePosition: (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) => {
      x: number;
      y: number;
      z: number;
    },
  ): void {
    if (!entity.isAlive || entity.isStunned()) {
      entity.isMoving = false;
      return;
    }
    if (entity.stats.moveSpeed <= 0 || !entity.intendedMoveTarget) {
      entity.isMoving = false;
      return;
    }

    const speed = entity.stats.moveSpeed * entity.getMoveSpeedMultiplier();
    const step = moveTowards(entity.position, entity.intendedMoveTarget, speed * dt);
    const resolved = resolvePosition(entity.position, step.position);
    const dir = directionTo(entity.position, resolved);
    if (dir.x !== 0 || dir.z !== 0) {
      entity.transform.rotationY = yawFromDirection(dir);
    }
    entity.setPosition(resolved.x, 0, resolved.z);
    entity.isMoving = !step.arrived;
    if (step.arrived) {
      entity.intendedMoveTarget = null;
      if (entity.orderMode === "attackMove") {
        entity.attackMovePoint = null;
        entity.orderMode = "hold";
      }
    }
  }

  /**
   * Attack-move: chase destination, but hard-engage the nearest valid enemy in scan range.
   */
  updateAttackMove(
    entity: CombatEntity,
    candidates: LivingEntity[],
    dt: number,
    projectiles: Projectile[],
    resolvePosition: (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) => {
      x: number;
      y: number;
      z: number;
    },
  ): void {
    if (!entity.isAlive || entity.orderMode !== "attackMove") return;

    if (entity.attackTargetId) {
      const locked = candidates.find((e) => e.id === entity.attackTargetId) ?? null;
      if (locked?.isAlive) {
        this.updateAutoAttack(entity, locked, dt, projectiles);
        return;
      }
      entity.attackTargetId = null;
    }

    const acquired = this.targeting.findNearestEnemy(
      entity,
      candidates,
      MatchRules.attackMoveScanRange,
    );
    if (acquired) {
      entity.attackTargetId = acquired.id;
      this.updateAutoAttack(entity, acquired, dt, projectiles);
      return;
    }

    if (entity.attackMovePoint) {
      entity.intendedMoveTarget = { ...entity.attackMovePoint };
      this.updateMovement(entity, dt, resolvePosition);
    }
  }

  updateAutoAttack(
    attacker: CombatEntity,
    target: LivingEntity | null,
    dt: number,
    projectiles: Projectile[],
  ): void {
    if (!attacker.isAlive || attacker.isStunned() || !target?.isAlive) return;
    if (!this.targeting.areEnemies(attacker, target)) return;
    if (target.isInvulnerable()) return;

    const range = attacker.stats.attackRange + attacker.transform.radius + target.transform.radius;
    const dist = distance2D(attacker.position, target.position);

    if (dist > range) {
      attacker.intendedMoveTarget = { ...target.position };
      attacker.isMoving = true;
      return;
    }

    attacker.intendedMoveTarget = null;
    attacker.isMoving = false;
    const dir = directionTo(attacker.position, target.position);
    attacker.transform.rotationY = yawFromDirection(dir);

    if (attacker.attackCooldown > 0) {
      attacker.attackCooldown -= dt;
      return;
    }

    const interval = 1 / Math.max(0.2, attacker.stats.attackSpeed);
    attacker.attackCooldown = interval;

    const isRanged =
      attacker.kind === "tower" ||
      (attacker.kind === "minion" && attacker.stats.attackRange > 3) ||
      attacker.stats.attackRange > 4;

    if (isRanged) {
      projectiles.push(
        new Projectile({
          teamId: attacker.teamId as TeamId | "neutral",
          sourceId: attacker.id,
          targetId: target.id,
          origin: {
            x: attacker.position.x,
            y: 1.5,
            z: attacker.position.z,
          },
          damage: attacker.stats.attackDamage,
          damageType: "physical",
          speed: attacker.kind === "tower" ? 22 : 16,
        }),
      );
      return;
    }

    this.damage.apply(
      target,
      {
        sourceId: attacker.id,
        targetId: target.id,
        amount: attacker.stats.attackDamage,
        damageType: "physical",
        canCrit: attacker.kind === "hero",
        timestamp: performance.now(),
      },
      true,
    );
    target.addThreat(attacker.id, attacker.stats.attackDamage);
  }
}
