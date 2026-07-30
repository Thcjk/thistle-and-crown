import type { EventBus } from "@/engine/EventBus";
import type { Hero } from "@/entities/heroes/Hero";
import { getItemDefinition } from "@/data/items/prototypeItems";
import { GoldSystem } from "./GoldSystem";
import { MAX_INVENTORY_SLOTS } from "@/utils/constants";
import { logger } from "@/utils/logger";

export class ItemSystem {
  constructor(
    private readonly events: EventBus,
    private readonly gold: GoldSystem,
  ) {}

  tryPurchase(hero: Hero, itemId: string, inShopZone: boolean): boolean {
    if (!inShopZone) {
      logger.info("Shop", "Purchase blocked – leave the Clanheart / Bastion heal zone");
      return false;
    }
    const item = getItemDefinition(itemId);
    if (!item) {
      logger.warn("Shop", `Unknown item ${itemId}`);
      return false;
    }
    const emptySlot = hero.inventory.findIndex((s) => s === null);
    if (emptySlot < 0 || emptySlot >= MAX_INVENTORY_SLOTS) {
      return false;
    }
    if (!this.gold.trySpend(hero, item.cost)) {
      return false;
    }
    hero.inventory[emptySlot] = itemId;
    this.applyStats(hero, item.stats, 1);
    this.events.emit("itemPurchased", { entityId: hero.id, itemId });
    return true;
  }

  private applyStats(
    hero: Hero,
    stats: Partial<Hero["stats"]>,
    sign: 1 | -1,
  ): void {
    const ratio = hero.healthRatio;
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value !== "number") continue;
      const k = key as keyof typeof hero.stats;
      if (typeof hero.stats[k] === "number") {
        (hero.stats[k] as number) += value * sign;
      }
    }
    hero.stats.currentHealth = Math.min(
      hero.stats.maxHealth,
      Math.max(1, hero.stats.maxHealth * ratio),
    );
  }
}
