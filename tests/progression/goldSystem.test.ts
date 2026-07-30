import { describe, expect, it } from "vitest";
import { EventBus } from "@/engine/EventBus";
import { GoldSystem } from "@/progression/GoldSystem";
import { Hero } from "@/entities/heroes/Hero";
import { brennaStonehand } from "@/data/heroes/brennaStonehand";

describe("GoldSystem", () => {
  it("spends gold only when affordable", () => {
    const bus = new EventBus();
    const gold = new GoldSystem(bus);
    const hero = new Hero(brennaStonehand, "highland", { x: 0, y: 0, z: 0 }, true);
    hero.gold = 100;
    expect(gold.trySpend(hero, 150)).toBe(false);
    expect(hero.gold).toBe(100);
    expect(gold.trySpend(hero, 40)).toBe(true);
    expect(hero.gold).toBe(60);
  });
});
