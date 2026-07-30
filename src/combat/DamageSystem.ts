import type { EventBus } from "@/engine/EventBus";
import type { DamageEvent, DamageResult } from "@/types/combat.types";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import { clamp } from "@/utils/math";

export class DamageSystem {
  constructor(private readonly events: EventBus) {}

  apply(target: LivingEntity, event: DamageEvent, sourceAlive: boolean): DamageResult {
    if (!target.isAlive || target.isInvulnerable()) {
      return { applied: 0, killed: false, absorbedByShield: 0, event };
    }
    if (!sourceAlive && event.sourceId !== "world" && event.sourceId !== "fountain") {
      return { applied: 0, killed: false, absorbedByShield: 0, event };
    }

    let amount = Math.max(0, event.amount);
    if (event.damageType === "physical") {
      const armor = target.stats.armor + target.getArmorBonus();
      amount *= this.mitigation(armor);
    } else if (event.damageType === "magical") {
      amount *= this.mitigation(target.stats.magicResist);
    }

    amount *= 1 - target.getDamageReduction();
    amount = Math.max(0, amount);

    let absorbed = 0;
    if (target.stats.shield > 0) {
      absorbed = Math.min(target.stats.shield, amount);
      target.stats.shield -= absorbed;
      amount -= absorbed;
    }

    target.stats.currentHealth = clamp(
      target.stats.currentHealth - amount,
      0,
      target.stats.maxHealth,
    );
    target.lastAttackerId = event.sourceId;

    this.events.emit("damageDealt", {
      sourceId: event.sourceId,
      targetId: event.targetId,
      amount: amount + absorbed,
      damageType: event.damageType,
    });

    const killed = target.stats.currentHealth <= 0;
    if (killed && !target.deathProcessed) {
      target.dead = true;
    }

    return {
      applied: amount,
      killed,
      absorbedByShield: absorbed,
      event: { ...event, amount: amount + absorbed },
    };
  }

  private mitigation(resist: number): number {
    // Soft diminishing mitigation suitable for prototype balance.
    return 100 / (100 + Math.max(0, resist));
  }
}
