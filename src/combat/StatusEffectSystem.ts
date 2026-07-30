import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { StatusEffect, StatusEffectType } from "@/types/combat.types";

export class StatusEffectSystem {
  apply(
    target: LivingEntity,
    params: {
      id: string;
      type: StatusEffectType;
      sourceId: string;
      magnitude: number;
      duration: number;
      maxStacks?: number;
    },
  ): void {
    if (!target.isAlive) return;
    const effect: StatusEffect = {
      id: params.id,
      type: params.type,
      sourceId: params.sourceId,
      magnitude: params.magnitude,
      remaining: params.duration,
      maxStacks: params.maxStacks ?? 1,
      stacks: 1,
    };
    target.addOrStackStatus(effect);
  }

  tick(entity: LivingEntity, dt: number): void {
    entity.tickStatuses(dt);
  }
}
