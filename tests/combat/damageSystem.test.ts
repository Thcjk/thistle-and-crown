import { describe, expect, it } from "vitest";
import { EventBus } from "@/engine/EventBus";
import { DamageSystem } from "@/combat/DamageSystem";
import { LivingEntity } from "@/entities/core/LivingEntity";

function makeTarget(): LivingEntity {
  return new LivingEntity(
    {
      id: "t1",
      kind: "minion",
      teamId: "crown",
      displayName: "Target",
      definitionId: "test",
    },
    { x: 0, y: 0, z: 0 },
    {
      maxHealth: 100,
      healthRegenPer5: 0,
      attackDamage: 10,
      attackSpeed: 1,
      armor: 0,
      magicResist: 0,
      moveSpeed: 4,
      attackRange: 1,
    },
  );
}

describe("DamageSystem", () => {
  it("applies physical damage and clamps health", () => {
    const bus = new EventBus();
    const system = new DamageSystem(bus);
    const target = makeTarget();
    const result = system.apply(
      target,
      {
        sourceId: "s1",
        targetId: "t1",
        amount: 40,
        damageType: "physical",
        timestamp: 0,
      },
      true,
    );
    expect(result.applied).toBe(40);
    expect(target.stats.currentHealth).toBe(60);
  });

  it("absorbs damage with shields", () => {
    const bus = new EventBus();
    const system = new DamageSystem(bus);
    const target = makeTarget();
    target.stats.shield = 25;
    const result = system.apply(
      target,
      {
        sourceId: "s1",
        targetId: "t1",
        amount: 40,
        damageType: "true",
        timestamp: 0,
      },
      true,
    );
    expect(result.absorbedByShield).toBe(25);
    expect(target.stats.currentHealth).toBe(85);
  });

  it("marks target dead at zero health", () => {
    const bus = new EventBus();
    const system = new DamageSystem(bus);
    const target = makeTarget();
    const result = system.apply(
      target,
      {
        sourceId: "s1",
        targetId: "t1",
        amount: 999,
        damageType: "true",
        timestamp: 0,
      },
      true,
    );
    expect(result.killed).toBe(true);
    expect(target.dead).toBe(true);
    expect(target.stats.currentHealth).toBe(0);
  });

  it("ignores damage on dead targets", () => {
    const bus = new EventBus();
    const system = new DamageSystem(bus);
    const target = makeTarget();
    target.dead = true;
    const result = system.apply(
      target,
      {
        sourceId: "s1",
        targetId: "t1",
        amount: 10,
        damageType: "true",
        timestamp: 0,
      },
      true,
    );
    expect(result.applied).toBe(0);
  });
});
