import type { EventBus } from "@/engine/EventBus";
import type { Hero } from "@/entities/heroes/Hero";
import type { MapDefinition } from "@/types/data.types";
import { SPAWN_PROTECTION_SECONDS } from "@/utils/constants";

export class RespawnManager {
  constructor(
    private readonly events: EventBus,
    private readonly map: MapDefinition,
  ) {}

  update(heroes: Hero[], dt: number): void {
    for (const hero of heroes) {
      if (!hero.dead) continue;
      hero.respawnTimer -= dt;
      if (hero.respawnTimer > 0) continue;

      const spawn = this.map.bases[hero.teamId === "highland" ? "highland" : "crown"].spawn;
      hero.dead = false;
      hero.deathProcessed = false;
      hero.active = true;
      hero.stats.currentHealth = hero.stats.maxHealth;
      hero.stats.shield = 0;
      hero.statuses = [];
      hero.clearOrders();
      hero.setPosition(spawn.x, 0, spawn.z);
      hero.respawnTimer = 0;
      hero.spawnProtection = SPAWN_PROTECTION_SECONDS;
      hero.aiState = "Respawn";
      this.events.emit("heroRespawned", { entityId: hero.id });
    }
  }
}
