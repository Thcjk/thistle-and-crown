import type { EventBus } from "@/engine/EventBus";
import type { AbilityDefinition } from "@/types/data.types";
import type { Hero } from "@/entities/heroes/Hero";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { Vec3 } from "@/types/game.types";
import { getAbilityDefinition } from "@/data/abilities";
import { DamageSystem } from "./DamageSystem";
import { CooldownSystem } from "./CooldownSystem";
import { StatusEffectSystem } from "./StatusEffectSystem";
import { TargetingSystem } from "./TargetingSystem";
import { directionTo, distance2D, isInCone, moveTowards, yawFromDirection } from "@/utils/math";
import { logger } from "@/utils/logger";

export interface AbilityCastRequest {
  caster: Hero;
  abilityId: string;
  aimPoint?: Vec3;
  targetId?: string;
}

export class AbilitySystem {
  constructor(
    private readonly events: EventBus,
    private readonly damage: DamageSystem,
    private readonly cooldowns: CooldownSystem,
    private readonly statuses: StatusEffectSystem,
    private readonly targeting: TargetingSystem,
  ) {}

  tryCast(
    request: AbilityCastRequest,
    entities: LivingEntity[],
    isBlocked: (from: Vec3, to: Vec3) => boolean,
  ): boolean {
    const { caster, abilityId } = request;
    if (!caster.isAlive || caster.isStunned()) return false;

    const def = getAbilityDefinition(abilityId);
    if (!def || def.slot === "passive") return false;
    if (!this.cooldowns.isReady(caster, abilityId)) return false;

    const ok = this.execute(def, request, entities, isBlocked);
    if (!ok) return false;

    this.cooldowns.start(caster, abilityId, def.cooldown);
    this.events.emit("abilityCast", { casterId: caster.id, abilityId });
    this.events.emit("abilityCooldownStarted", {
      casterId: caster.id,
      abilityId,
      duration: def.cooldown,
    });
    return true;
  }

  handlePassiveOnHeroDamage(target: Hero, source: LivingEntity): void {
    if (source.kind !== "hero") return;
    for (const runtime of target.abilities) {
      const def = getAbilityDefinition(runtime.abilityId);
      if (def?.slot !== "passive" || def.passiveTrigger !== "onHeroDamageTaken") continue;
      this.statuses.apply(target, {
        id: `${def.id}_stack`,
        type: "armorBonus",
        sourceId: target.id,
        magnitude: def.passiveMagnitude ?? 5,
        duration: def.passiveDuration ?? 3,
        maxStacks: def.passiveMaxStacks ?? 3,
      });
    }
  }

  private execute(
    def: AbilityDefinition,
    request: AbilityCastRequest,
    entities: LivingEntity[],
    isBlocked: (from: Vec3, to: Vec3) => boolean,
  ): boolean {
    const { caster } = request;
    switch (def.id) {
      case "brenna_cleaving_arc":
        return this.castCleavingArc(def, caster, request.aimPoint, entities);
      case "brenna_stoneguard":
        return this.castStoneguard(def, caster);
      case "brenna_highland_charge":
        return this.castHighlandCharge(def, caster, request.aimPoint, entities, isBlocked);
      case "brenna_oath_of_the_clans":
        return this.castOath(def, caster, entities);
      case "aldric_bulwark_slam":
        return this.castBulwarkSlam(def, caster, entities);
      case "aldric_crown_guard":
        return this.castStoneguard(def, caster);
      case "aldric_vanguard_rush":
        return this.castHighlandCharge(def, caster, request.aimPoint, entities, isBlocked);
      case "aldric_oath_of_the_crown":
        return this.castAldricOath(def, caster, entities);
      default:
        logger.warn("Ability", `Unhandled ability ${def.id}`);
        return false;
    }
  }

  private castCleavingArc(
    def: AbilityDefinition,
    caster: Hero,
    aim: Vec3 | undefined,
    entities: LivingEntity[],
  ): boolean {
    const point = aim ?? {
      x: caster.position.x + Math.sin(caster.transform.rotationY) * def.range,
      y: 0,
      z: caster.position.z + Math.cos(caster.transform.rotationY) * def.range,
    };
    const dir = directionTo(caster.position, point);
    caster.transform.rotationY = yawFromDirection(dir);
    const halfAngle = (55 * Math.PI) / 180;
    for (const other of entities) {
      if (!this.targeting.areEnemies(caster, other)) continue;
      if (
        isInCone(caster.position, caster.transform.rotationY, other.position, def.range, halfAngle)
      ) {
        this.deal(caster, other, def);
      }
    }
    return true;
  }

  private castStoneguard(def: AbilityDefinition, caster: Hero): boolean {
    caster.applyShield(def.shieldAmount ?? 100);
    this.statuses.apply(caster, {
      id: "stoneguard_dr",
      type: "damageReduction",
      sourceId: caster.id,
      magnitude: def.damageReduction ?? 0.2,
      duration: def.duration ?? 3,
    });
    this.events.emit("shieldApplied", {
      sourceId: caster.id,
      targetId: caster.id,
      amount: def.shieldAmount ?? 100,
    });
    return true;
  }

  private castHighlandCharge(
    def: AbilityDefinition,
    caster: Hero,
    aim: Vec3 | undefined,
    entities: LivingEntity[],
    isBlocked: (from: Vec3, to: Vec3) => boolean,
  ): boolean {
    if (!aim) return false;
    const dir = directionTo(caster.position, aim);
    if (dir.x === 0 && dir.z === 0) return false;
    caster.transform.rotationY = yawFromDirection(dir);

    const maxDist = def.range;
    const steps = 12;
    let traveled = 0;
    let hitHero: LivingEntity | null = null;

    for (let i = 0; i < steps; i += 1) {
      const step = maxDist / steps;
      const next = {
        x: caster.position.x + dir.x * step,
        y: 0,
        z: caster.position.z + dir.z * step,
      };
      if (isBlocked(caster.position, next)) break;
      caster.setPosition(next.x, 0, next.z);
      traveled += step;

      for (const other of entities) {
        if (!this.targeting.areEnemies(caster, other)) continue;
        if (other.kind !== "hero") continue;
        if (distance2D(caster.position, other.position) <= 1.4) {
          hitHero = other;
          break;
        }
      }
      if (hitHero) break;
    }

    if (hitHero) {
      this.deal(caster, hitHero, def);
      this.statuses.apply(hitHero, {
        id: "highland_charge_stun",
        type: "stun",
        sourceId: caster.id,
        magnitude: 1,
        duration: def.stunDuration ?? 0.5,
      });
      const knock = moveTowards(
        hitHero.position,
        {
          x: hitHero.position.x + dir.x * 1.2,
          y: 0,
          z: hitHero.position.z + dir.z * 1.2,
        },
        1.2,
      );
      if (!isBlocked(hitHero.position, knock.position)) {
        hitHero.setPosition(knock.position.x, 0, knock.position.z);
      }
    }

    return traveled > 0.2;
  }

  private castOath(def: AbilityDefinition, caster: Hero, entities: LivingEntity[]): boolean {
    const radius = def.radius ?? 6;
    for (const other of entities) {
      if (distance2D(caster.position, other.position) > radius) continue;
      if (this.targeting.areEnemies(caster, other)) {
        this.deal(caster, other, def);
        this.statuses.apply(other, {
          id: "oath_slow",
          type: "slow",
          sourceId: caster.id,
          magnitude: def.slowPercent ?? 0.3,
          duration: def.duration ?? 3,
        });
      } else if (other.teamId === caster.teamId) {
        this.statuses.apply(other, {
          id: "oath_haste",
          type: "moveSpeedBonus",
          sourceId: caster.id,
          magnitude: def.allyMoveSpeedBonus ?? 0.25,
          duration: def.duration ?? 3,
        });
      }
    }
    return true;
  }

  private castAldricOath(def: AbilityDefinition, caster: Hero, entities: LivingEntity[]): boolean {
    const radius = def.radius ?? 5.5;
    for (const other of entities) {
      if (distance2D(caster.position, other.position) > radius) continue;
      if (this.targeting.areEnemies(caster, other)) {
        this.deal(caster, other, def);
        this.statuses.apply(other, {
          id: "crown_oath_slow",
          type: "slow",
          sourceId: caster.id,
          magnitude: def.slowPercent ?? 0.45,
          duration: def.duration ?? 4,
        });
      } else if (other.teamId === caster.teamId && other.kind === "hero") {
        other.applyShield(def.shieldAmount ?? 120);
        this.statuses.apply(other, {
          id: "crown_oath_armor",
          type: "armorBonus",
          sourceId: caster.id,
          magnitude: 12,
          duration: def.duration ?? 4,
        });
      }
    }
    return true;
  }

  private castBulwarkSlam(
    def: AbilityDefinition,
    caster: Hero,
    entities: LivingEntity[],
  ): boolean {
    const radius = def.radius ?? 3;
    for (const other of entities) {
      if (!this.targeting.areEnemies(caster, other)) continue;
      if (distance2D(caster.position, other.position) > radius) continue;
      this.deal(caster, other, def);
      this.statuses.apply(other, {
        id: "bulwark_slow",
        type: "slow",
        sourceId: caster.id,
        magnitude: def.slowPercent ?? 0.3,
        duration: def.duration ?? 1.5,
      });
    }
    return true;
  }

  private deal(caster: Hero, target: LivingEntity, def: AbilityDefinition): void {
    const amount = (def.damage ?? 0) + caster.stats.attackDamage * 0.35;
    this.damage.apply(
      target,
      {
        sourceId: caster.id,
        targetId: target.id,
        amount,
        damageType: def.damageType ?? "physical",
        abilityId: def.id,
        timestamp: performance.now(),
      },
      true,
    );
  }
}
