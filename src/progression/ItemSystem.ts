import type { EventBus } from "@/engine/EventBus";
import type { Hero } from "@/entities/heroes/Hero";
import { getItemDefinition, getItemUpgradeCost } from "@/data/items/prototypeItems";
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
      logger.info("Shop", "Purchase blocked – not in base shop zone");
      return false;
    }
    const item = getItemDefinition(itemId);
    if (!item) return false;

    const emptySlot = hero.inventory.findIndex((s) => s === null);
    if (emptySlot < 0) return false;

    const cost = getItemUpgradeCost(hero.inventory, itemId);
    if (!this.gold.trySpend(hero, cost)) return false;

    // Consume owned components listed in buildsFrom.
    if (item.buildsFrom?.length) {
      for (const compId of item.buildsFrom) {
        const idx = hero.inventory.indexOf(compId);
        if (idx >= 0) {
          const comp = getItemDefinition(compId);
          if (comp) this.applyStats(hero, comp.stats, -1);
          hero.inventory[idx] = null;
        }
      }
    }

    hero.inventory[emptySlot] = itemId;
    this.applyStats(hero, item.stats, 1);
    this.events.emit("itemPurchased", { entityId: hero.id, itemId });
    return true;
  }

  trySell(hero: Hero, slotIndex: number, inShopZone: boolean): boolean {
    if (!inShopZone || slotIndex < 0 || slotIndex >= MAX_INVENTORY_SLOTS) return false;
    const itemId = hero.inventory[slotIndex];
    if (!itemId) return false;
    const item = getItemDefinition(itemId);
    if (!item) return false;

    const refund = Math.floor(item.cost * (item.sellRatio ?? 0.7));
    this.applyStats(hero, item.stats, -1);
    hero.inventory[slotIndex] = null;
    this.gold.add(hero, refund);
    this.events.emit("itemSold", { entityId: hero.id, itemId, refund });
    return true;
  }

  /** Bot auto-buy: pick best affordable item not yet owned. */
  botAutoBuy(hero: Hero, inShopZone: boolean): string | null {
    if (!inShopZone) return null;
    const owned = new Set(hero.inventory.filter(Boolean));
    const candidates = [
      "wardens_buckler",
      "highland_iron",
      "fleetfoot_brogues",
      "clan_blade_shard",
      "warden_plate",
      "highland_waterskin",
    ];
    for (const itemId of candidates) {
      if (owned.has(itemId)) continue;
      const cost = getItemUpgradeCost(hero.inventory, itemId);
      if (hero.gold >= cost && this.tryPurchase(hero, itemId, true)) {
        return itemId;
      }
    }
    return null;
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
