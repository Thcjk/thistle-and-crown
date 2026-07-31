import type { EventBus } from "@/engine/EventBus";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { Hero } from "@/entities/heroes/Hero";
import { DEFAULT_RESPAWN_BASE, DEFAULT_RESPAWN_PER_LEVEL } from "@/utils/constants";

export class DeathSystem {
  constructor(private readonly events: EventBus) {}

  processDeath(entity: LivingEntity, killerId: string | null): void {
    if (!entity.dead || entity.deathProcessed) return;
    entity.deathProcessed = true;
    entity.active = entity.kind === "hero";
    entity.clearOrders();
    this.events.emit("entityDied", { entityId: entity.id, killerId });

    if (entity.kind === "hero") {
      const hero = entity as Hero;
      hero.deaths += 1;
      hero.respawnTimer =
        DEFAULT_RESPAWN_BASE + hero.level * DEFAULT_RESPAWN_PER_LEVEL;
      hero.aiState = "Dead";
    } else if (entity.kind === "tower" || entity.kind === "core") {
      entity.markedForRemoval = entity.kind === "tower";
    } else if (entity.kind === "barracks") {
      entity.markedForRemoval = true;
    } else {
      entity.markedForRemoval = true;
    }
  }
}
