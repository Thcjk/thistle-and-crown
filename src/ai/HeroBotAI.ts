import { StateMachine, type StateContext } from "./StateMachine";
import type { Hero } from "@/entities/heroes/Hero";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { AbilitySystem } from "@/combat/AbilitySystem";
import type { TargetingSystem } from "@/combat/TargetingSystem";
import type { MapDefinition } from "@/types/data.types";
import type { Vec3 } from "@/types/game.types";
import { distance2D } from "@/utils/math";

export interface BotContext extends StateContext {
  hero: Hero;
  entities: LivingEntity[];
  map: MapDefinition;
  abilitySystem: AbilitySystem;
  targeting: TargetingSystem;
  isBlocked: (from: Vec3, to: Vec3) => boolean;
}

export class HeroBotAI {
  private readonly fsm: StateMachine<BotContext>;
  private laneTarget: Vec3;
  private thinkAccum = 0;

  constructor(private readonly hero: Hero, map: MapDefinition) {
    const base = map.bases[hero.teamId === "neutral" ? "crown" : hero.teamId];
    this.laneTarget = { ...map.bases[hero.teamId === "highland" ? "crown" : "highland"].core };
    this.fsm = new StateMachine<BotContext>("Idle");
    this.registerStates(base.spawn);
    this.hero.aiState = "Idle";
  }

  get state(): string {
    return this.fsm.current;
  }

  update(context: Omit<BotContext, "dt" | "hero"> & { dt: number }): void {
    this.thinkAccum += context.dt;
    // Stagger AI updates slightly for performance.
    if (this.thinkAccum < 0.15 && this.hero.isAlive) {
      this.hero.aiState = this.fsm.current;
      return;
    }
    this.thinkAccum = 0;
    const full: BotContext = { ...context, hero: this.hero };
    if (this.hero.dead) {
      this.fsm.setState("Dead", full);
    }
    this.fsm.update(full);
    this.hero.aiState = this.fsm.current;
  }

  private registerStates(spawn: Vec3): void {
    this.fsm.add({
      name: "Idle",
      update: () => "MoveToLane",
    });

    this.fsm.add({
      name: "MoveToLane",
      enter: (ctx) => {
        ctx.hero.orderMove(this.laneTarget);
      },
      update: (ctx) => {
        if (ctx.hero.healthRatio < 0.28) return "Retreat";
        const enemy = ctx.targeting.findNearestEnemy(ctx.hero, ctx.entities, 8);
        if (enemy) {
          ctx.hero.orderAttack(enemy.id);
          return "AttackTarget";
        }
        if (distance2D(ctx.hero.position, this.laneTarget) < 4) return "Farm";
        ctx.hero.orderMove(this.laneTarget);
        return null;
      },
    });

    this.fsm.add({
      name: "Farm",
      update: (ctx) => {
        if (ctx.hero.healthRatio < 0.28) return "Retreat";
        const enemy = ctx.targeting.findNearestEnemy(ctx.hero, ctx.entities, 9);
        if (enemy) {
          ctx.hero.orderAttack(enemy.id);
          return "AttackTarget";
        }
        ctx.hero.orderMove(this.laneTarget);
        return "MoveToLane";
      },
    });

    this.fsm.add({
      name: "AttackTarget",
      update: (ctx) => {
        if (ctx.hero.healthRatio < 0.28) return "Retreat";
        const target = ctx.entities.find((e) => e.id === ctx.hero.attackTargetId);
        if (!target?.isAlive) {
          ctx.hero.clearOrders();
          return "Farm";
        }
        if (ctx.hero.healthRatio > 0.45 && target.kind === "hero") {
          return "UseAbility";
        }
        return null;
      },
    });

    this.fsm.add({
      name: "UseAbility",
      update: (ctx) => {
        const ability = ctx.hero.abilities.find(
          (a) => a.slot === "Q" && a.level > 0 && a.cooldownRemaining <= 0,
        );
        if (ability) {
          ctx.abilitySystem.tryCast(
            {
              caster: ctx.hero,
              abilityId: ability.abilityId,
              aimPoint: ctx.hero.position,
            },
            ctx.entities,
            ctx.isBlocked,
          );
        }
        return "AttackTarget";
      },
    });

    this.fsm.add({
      name: "Retreat",
      enter: (ctx) => {
        ctx.hero.orderMove(spawn);
      },
      update: (ctx) => {
        if (ctx.hero.healthRatio > 0.75) return "ReturnToBase";
        ctx.hero.orderMove(spawn);
        if (distance2D(ctx.hero.position, spawn) < 3) return "ReturnToBase";
        return null;
      },
    });

    this.fsm.add({
      name: "ReturnToBase",
      update: (ctx) => {
        if (ctx.hero.healthRatio >= 0.9) return "MoveToLane";
        ctx.hero.orderMove(spawn);
        return null;
      },
    });

    this.fsm.add({
      name: "Dead",
      update: (ctx) => (ctx.hero.dead ? null : "Respawn"),
    });

    this.fsm.add({
      name: "Respawn",
      enter: (ctx) => {
        ctx.hero.orderMove(this.laneTarget);
      },
      update: () => "MoveToLane",
    });
  }
}
