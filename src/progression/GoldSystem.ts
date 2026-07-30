import type { EventBus } from "@/engine/EventBus";
import type { Hero } from "@/entities/heroes/Hero";
import { PASSIVE_GOLD_PER_SECOND } from "@/utils/constants";

export class GoldSystem {
  constructor(private readonly events: EventBus) {}

  tickPassive(heroes: Hero[], dt: number): void {
    for (const hero of heroes) {
      if (!hero.isAlive && hero.dead) continue;
      this.add(hero, PASSIVE_GOLD_PER_SECOND * dt);
    }
  }

  add(hero: Hero, amount: number): void {
    if (amount === 0) return;
    hero.gold = Math.max(0, hero.gold + amount);
    this.events.emit("goldChanged", {
      entityId: hero.id,
      gold: hero.gold,
      delta: amount,
    });
  }

  trySpend(hero: Hero, cost: number): boolean {
    if (hero.gold < cost) return false;
    this.add(hero, -cost);
    return true;
  }
}
