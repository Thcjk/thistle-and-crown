import { Entity } from "./Entity";
import type { EntityIdentity, EntityStats, RuntimeStats } from "@/types/entity.types";
import type { StatusEffect } from "@/types/combat.types";
import type { Vec3 } from "@/types/game.types";
import { clamp } from "@/utils/math";

export class LivingEntity extends Entity {
  readonly baseStats: EntityStats;
  stats: RuntimeStats;
  dead = false;
  deathProcessed = false;
  targetId: string | null = null;
  attackCooldown = 0;
  statuses: StatusEffect[] = [];
  lastAttackerId: string | null = null;
  attackTargetId: string | null = null;
  goldReward = 0;
  xpReward = 0;

  constructor(
    identity: EntityIdentity,
    position: Vec3,
    stats: EntityStats,
    radius = 0.5,
  ) {
    super(identity, position, radius);
    this.baseStats = { ...stats };
    this.stats = {
      ...stats,
      currentHealth: stats.maxHealth,
      shield: 0,
      level: 1,
    };
  }

  get isAlive(): boolean {
    return !this.dead && this.active;
  }

  get healthRatio(): number {
    return this.stats.maxHealth <= 0 ? 0 : this.stats.currentHealth / this.stats.maxHealth;
  }

  isStunned(): boolean {
    return this.statuses.some((s) => s.type === "stun" && s.remaining > 0);
  }

  isInvulnerable(): boolean {
    return this.statuses.some((s) => s.type === "invulnerable" && s.remaining > 0);
  }

  getMoveSpeedMultiplier(): number {
    let mult = 1;
    for (const status of this.statuses) {
      if (status.remaining <= 0) continue;
      if (status.type === "slow") mult *= 1 - status.magnitude;
      if (status.type === "moveSpeedBonus") mult *= 1 + status.magnitude;
    }
    return Math.max(0.2, mult);
  }

  getArmorBonus(): number {
    let bonus = 0;
    for (const status of this.statuses) {
      if (status.type === "armorBonus" && status.remaining > 0) {
        bonus += status.magnitude * status.stacks;
      }
    }
    return bonus;
  }

  getDamageReduction(): number {
    let reduction = 0;
    for (const status of this.statuses) {
      if (status.type === "damageReduction" && status.remaining > 0) {
        reduction += status.magnitude;
      }
    }
    return clamp(reduction, 0, 0.8);
  }

  heal(amount: number): number {
    if (!this.isAlive || amount <= 0) return 0;
    const before = this.stats.currentHealth;
    this.stats.currentHealth = Math.min(
      this.stats.maxHealth,
      this.stats.currentHealth + amount,
    );
    return this.stats.currentHealth - before;
  }

  applyShield(amount: number): void {
    if (!this.isAlive) return;
    this.stats.shield = Math.max(this.stats.shield, amount);
  }

  tickStatuses(dt: number): void {
    for (const status of this.statuses) {
      status.remaining -= dt;
    }
    this.statuses = this.statuses.filter((s) => s.remaining > 0);
    if (this.stats.shield < 0) this.stats.shield = 0;
  }

  addOrStackStatus(effect: StatusEffect): void {
    const existing = this.statuses.find((s) => s.id === effect.id);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, effect.remaining);
      existing.stacks = Math.min(existing.maxStacks, existing.stacks + 1);
      existing.magnitude = effect.magnitude;
      return;
    }
    this.statuses.push({ ...effect });
  }

  clearOrders(): void {
    // Overridden by combat entities.
  }

  addThreat(_sourceId: string, _amount: number): void {
    // Overridden by combat entities.
  }
}
