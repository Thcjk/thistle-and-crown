import type { EventBus } from "@/engine/EventBus";
import type { Hero } from "@/entities/heroes/Hero";
import type { HeroDefinition } from "@/types/data.types";
import { getHeroDefinition } from "@/data/heroes";
import { getXpRequired } from "@/data/balance/progression";
import { MAX_HERO_LEVEL } from "@/utils/constants";
import { distance2D } from "@/utils/math";

export class ExperienceSystem {
  constructor(private readonly events: EventBus) {}

  grantKillXp(
    killer: Hero | null,
    amount: number,
    deathPosition: { x: number; y: number; z: number },
    allies: Hero[],
  ): void {
    const nearby = allies.filter(
      (h) => h.isAlive && distance2D(h.position, deathPosition) <= 12,
    );
    const recipients =
      nearby.length > 0 ? nearby : killer && !killer.dead ? [killer] : [];
    if (recipients.length === 0) return;
    const share = amount / recipients.length;
    for (const hero of recipients) {
      this.add(hero, share);
    }
  }

  add(hero: Hero, amount: number): void {
    if (amount <= 0 || hero.level >= MAX_HERO_LEVEL) return;
    hero.experience += amount;
    this.events.emit("experienceChanged", {
      entityId: hero.id,
      experience: hero.experience,
      level: hero.level,
    });
    this.tryLevelUp(hero);
  }

  private tryLevelUp(hero: Hero): void {
    const def = getHeroDefinition(hero.heroDefId) as HeroDefinition | undefined;
    while (hero.canLevelUp()) {
      hero.experience -= getXpRequired(hero.level);
      hero.applyLevelStats(def?.growthStats ?? {});
      this.events.emit("levelUp", { entityId: hero.id, level: hero.level });
      // Auto-learn first unleveled ability for prototype UX.
      const next = hero.abilities.find((a) => a.slot !== "passive" && a.level === 0);
      if (next && hero.skillPoints > 0) {
        next.level = 1;
        hero.skillPoints -= 1;
      } else {
        const upgradable = hero.abilities.find(
          (a) => a.slot !== "passive" && a.level > 0 && a.level < 4,
        );
        if (upgradable && hero.skillPoints > 0) {
          upgradable.level += 1;
          hero.skillPoints -= 1;
        }
      }
    }
  }
}
