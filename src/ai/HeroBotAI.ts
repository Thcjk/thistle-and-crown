import { StateMachine, type StateContext } from "./StateMachine";
import type { Hero } from "@/entities/heroes/Hero";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { NeutralMonster } from "@/entities/monsters/NeutralMonster";
import type { AbilitySystem } from "@/combat/AbilitySystem";
import type { TargetingSystem } from "@/combat/TargetingSystem";
import type { ItemSystem } from "@/progression/ItemSystem";
import type { MapDefinition } from "@/types/data.types";
import type { BotDifficulty, LaneId, TeamId, Vec3 } from "@/types/game.types";
import { distance2D } from "@/utils/math";

export interface BotContext extends StateContext {
  hero: Hero;
  entities: LivingEntity[];
  monsters: NeutralMonster[];
  map: MapDefinition;
  abilitySystem: AbilitySystem;
  targeting: TargetingSystem;
  itemSystem: ItemSystem;
  isBlocked: (from: Vec3, to: Vec3) => boolean;
  isInHealZone: (teamId: TeamId, pos: Vec3) => boolean;
  elapsedSeconds: number;
  playerPosition: Vec3 | null;
}

interface DifficultyProfile {
  thinkInterval: number;
  retreatHp: number;
  healHp: number;
  harassRange: number;
  shopGoldThreshold: number;
  objectiveHp: number;
  abilityChance: number;
}

const DIFFICULTY: Record<BotDifficulty, DifficultyProfile> = {
  easy: {
    thinkInterval: 0.35,
    retreatHp: 0.38,
    healHp: 0.85,
    harassRange: 6,
    shopGoldThreshold: 500,
    objectiveHp: 0.55,
    abilityChance: 0.35,
  },
  normal: {
    thinkInterval: 0.18,
    retreatHp: 0.3,
    healHp: 0.88,
    harassRange: 8,
    shopGoldThreshold: 350,
    objectiveHp: 0.45,
    abilityChance: 0.65,
  },
  hard: {
    thinkInterval: 0.1,
    retreatHp: 0.22,
    healHp: 0.92,
    harassRange: 9.5,
    shopGoldThreshold: 280,
    objectiveHp: 0.35,
    abilityChance: 0.85,
  },
};

export class HeroBotAI {
  private readonly fsm: StateMachine<BotContext>;
  private laneTarget: Vec3;
  private preferredLane: LaneId = "middle";
  private thinkAccum = 0;
  private readonly profile: DifficultyProfile;
  private readonly spawn: Vec3;

  constructor(
    private readonly hero: Hero,
    private readonly map: MapDefinition,
    difficulty: BotDifficulty = "normal",
  ) {
    this.profile = DIFFICULTY[difficulty];
    const team = hero.teamId as TeamId;
    this.spawn = { ...map.bases[team].spawn };
    const enemyTeam: TeamId = team === "highland" ? "crown" : "highland";
    this.laneTarget = { ...map.bases[enemyTeam].core };
    this.fsm = new StateMachine<BotContext>("Idle");
    this.registerStates();
    this.hero.aiState = "Idle";
  }

  get state(): string {
    return this.fsm.current;
  }

  update(context: Omit<BotContext, "dt" | "hero"> & { dt: number }): void {
    this.thinkAccum += context.dt;
    if (this.thinkAccum < this.profile.thinkInterval && this.hero.isAlive) {
      this.hero.aiState = this.fsm.current;
      return;
    }
    this.thinkAccum = 0;

    const full: BotContext = { ...context, hero: this.hero };
    if (this.hero.dead) {
      this.fsm.setState("Dead", full);
    } else if (this.hero.recalling) {
      this.hero.aiState = "Recall";
      return;
    }

    // Pick lane toward player when visible.
    if (context.playerPosition) {
      this.preferredLane = this.pickLaneToward(context.playerPosition);
      const path = context.map.lanes.find(
        (l) => l.laneId === this.preferredLane && l.teamId === this.hero.teamId,
      );
      if (path?.points.length) {
        this.laneTarget = { ...path.points[path.points.length - 1]! };
      }
    }

    this.fsm.update(full);
    this.hero.aiState = this.fsm.current;
  }

  private pickLaneToward(playerPos: Vec3): LaneId {
    const team = this.hero.teamId as TeamId;
    const lanes: LaneId[] = ["top", "middle", "bottom"];
    let best: LaneId = "middle";
    let bestDist = Number.POSITIVE_INFINITY;
    for (const laneId of lanes) {
      const path = this.map.lanes.find((l) => l.laneId === laneId && l.teamId === team);
      const mid = path?.points[Math.floor((path.points.length - 1) / 2)];
      if (!mid) continue;
      const d = distance2D(mid, playerPos);
      if (d < bestDist) {
        bestDist = d;
        best = laneId;
      }
    }
    return best;
  }

  private registerStates(): void {
    this.fsm.add({ name: "Idle", update: () => "MoveToLane" });

    this.fsm.add({
      name: "MoveToLane",
      enter: (ctx) => ctx.hero.orderMove(this.laneTarget),
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.retreatHp) return "Retreat";
        if (this.shouldShop(ctx)) return "Shop";
        if (this.shouldObjective(ctx)) return "Objective";
        if (this.shouldJungle(ctx)) return "Jungle";
        const enemy = ctx.targeting.findNearestEnemy(ctx.hero, ctx.entities, this.profile.harassRange);
        if (enemy?.kind === "hero") return "Harass";
        if (enemy) {
          ctx.hero.orderAttack(enemy.id);
          return "AttackTarget";
        }
        if (distance2D(ctx.hero.position, this.laneTarget) < 5) return "Farm";
        ctx.hero.orderMove(this.laneTarget);
        return null;
      },
    });

    this.fsm.add({
      name: "Farm",
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.retreatHp) return "Retreat";
        if (this.shouldShop(ctx)) return "Shop";
        const csTarget = this.findLowHpMinion(ctx);
        if (csTarget) {
          ctx.hero.orderAttack(csTarget.id);
          return "AttackTarget";
        }
        const enemy = ctx.targeting.findNearestEnemy(ctx.hero, ctx.entities, this.profile.harassRange);
        if (enemy?.kind === "hero") return "Harass";
        if (enemy) {
          ctx.hero.orderAttack(enemy.id);
          return "AttackTarget";
        }
        const tower = ctx.entities.find(
          (e) =>
            e.kind === "tower" &&
            e.isAlive &&
            ctx.targeting.areEnemies(ctx.hero, e) &&
            distance2D(ctx.hero.position, e.position) < 12,
        );
        if (tower && ctx.hero.healthRatio > 0.5) {
          ctx.hero.orderAttack(tower.id);
          return "TowerPush";
        }
        ctx.hero.orderMove(this.laneTarget);
        return "MoveToLane";
      },
    });

    this.fsm.add({
      name: "Harass",
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.retreatHp) return "Retreat";
        const enemy = ctx.targeting.findNearestEnemy(ctx.hero, ctx.entities, this.profile.harassRange);
        if (!enemy) return "Farm";
        ctx.hero.orderAttack(enemy.id);
        if (Math.random() < this.profile.abilityChance) return "UseAbility";
        return "AttackTarget";
      },
    });

    this.fsm.add({
      name: "AttackTarget",
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.retreatHp) return "Retreat";
        const target = ctx.entities.find((e) => e.id === ctx.hero.attackTargetId);
        if (!target?.isAlive) {
          ctx.hero.clearOrders();
          return "Farm";
        }
        if (target.kind === "hero" && Math.random() < this.profile.abilityChance * 0.5) {
          return "UseAbility";
        }
        return null;
      },
    });

    this.fsm.add({
      name: "UseAbility",
      update: (ctx) => {
        this.castBestAbility(ctx);
        return "AttackTarget";
      },
    });

    this.fsm.add({
      name: "Jungle",
      enter: (ctx) => {
        const camp = this.nearestCamp(ctx);
        if (camp) ctx.hero.orderMove(camp.position);
      },
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.retreatHp) return "Retreat";
        const monster = ctx.monsters.find(
          (m) => m.isAlive && distance2D(m.position, ctx.hero.position) < 8,
        );
        if (monster) {
          ctx.hero.orderAttack(monster.id);
          return "AttackTarget";
        }
        const camp = this.nearestCamp(ctx);
        if (!camp) return "MoveToLane";
        ctx.hero.orderMove(camp.position);
        return null;
      },
    });

    this.fsm.add({
      name: "Objective",
      enter: (ctx) => {
        const obj = this.findObjective(ctx);
        if (obj) ctx.hero.orderMove(obj.position);
      },
      update: (ctx) => {
        if (ctx.hero.healthRatio < this.profile.objectiveHp) return "Retreat";
        const obj = ctx.monsters.find(
          (m) =>
            m.isAlive &&
            (m.buffId === "stag_endurance" || m.buffId === "wyrm_siege") &&
            distance2D(m.position, ctx.hero.position) < 10,
        );
        if (obj) {
          ctx.hero.orderAttack(obj.id);
          return "AttackTarget";
        }
        return "Jungle";
      },
    });

    this.fsm.add({
      name: "TowerPush",
      update: (ctx) => {
        if (ctx.hero.healthRatio < 0.35) return "Retreat";
        const tower = ctx.entities.find((e) => e.id === ctx.hero.attackTargetId);
        if (!tower?.isAlive) return "Farm";
        return null;
      },
    });

    this.fsm.add({
      name: "Retreat",
      enter: (ctx) => {
        ctx.hero.clearOrders();
        ctx.hero.orderMove(this.spawn);
      },
      update: (ctx) => {
        if (distance2D(ctx.hero.position, this.spawn) < 4) {
          if (this.shouldShop(ctx)) return "Shop";
          if (ctx.hero.healthRatio > this.profile.healHp) return "MoveToLane";
        }
        if (ctx.hero.healthRatio < 0.2 && !ctx.hero.recalling) {
          ctx.hero.recalling = true;
          ctx.hero.recallTimer = 5;
          ctx.hero.clearOrders();
          return "Recall";
        }
        ctx.hero.orderMove(this.spawn);
        return null;
      },
    });

    this.fsm.add({
      name: "Recall",
      update: (ctx) => {
        if (!ctx.hero.recalling && ctx.hero.healthRatio > 0.7) return "Shop";
        if (!ctx.hero.recalling) return "MoveToLane";
        return null;
      },
    });

    this.fsm.add({
      name: "Shop",
      enter: (ctx) => {
        ctx.hero.orderMove(this.spawn);
        if (ctx.isInHealZone(ctx.hero.teamId as TeamId, ctx.hero.position)) {
          ctx.itemSystem.botAutoBuy(ctx.hero, true);
        }
      },
      update: (ctx) => {
        if (!ctx.isInHealZone(ctx.hero.teamId as TeamId, ctx.hero.position)) {
          ctx.hero.orderMove(this.spawn);
          return null;
        }
        ctx.itemSystem.botAutoBuy(ctx.hero, true);
        if (ctx.hero.gold < this.profile.shopGoldThreshold || ctx.hero.healthRatio > 0.85) {
          return "MoveToLane";
        }
        return null;
      },
    });

    this.fsm.add({
      name: "ReturnToBase",
      update: (ctx) => (ctx.hero.healthRatio >= this.profile.healHp ? "MoveToLane" : null),
    });

    this.fsm.add({ name: "Dead", update: (ctx) => (ctx.hero.dead ? null : "Respawn") });
    this.fsm.add({ name: "Respawn", enter: (ctx) => ctx.hero.orderMove(this.laneTarget), update: () => "MoveToLane" });
  }

  private shouldShop(ctx: BotContext): boolean {
    return (
      ctx.hero.gold >= this.profile.shopGoldThreshold &&
      ctx.isInHealZone(ctx.hero.teamId as TeamId, ctx.hero.position)
    );
  }

  private shouldJungle(ctx: BotContext): boolean {
    if (this.profile === DIFFICULTY.easy) return false;
    const camp = this.nearestCamp(ctx);
    if (!camp) return false;
    return (
      ctx.elapsedSeconds > 60 &&
      distance2D(ctx.hero.position, camp.position) < 22 &&
      ctx.hero.healthRatio > 0.5
    );
  }

  private shouldObjective(ctx: BotContext): boolean {
    if (this.profile === DIFFICULTY.easy && Math.random() > 0.3) return false;
    const obj = this.findObjective(ctx);
    if (!obj) return false;
    return ctx.elapsedSeconds > 120 && ctx.hero.healthRatio > this.profile.objectiveHp;
  }

  private nearestCamp(ctx: BotContext): { position: Vec3 } | null {
    let best: { position: Vec3 } | null = null;
    let bestDist = 30;
    for (const camp of ctx.map.monsterCamps) {
      const alive = ctx.monsters.some((m) => m.campId === camp.id && m.isAlive);
      if (!alive) continue;
      const d = distance2D(ctx.hero.position, camp.position);
      if (d < bestDist) {
        bestDist = d;
        best = camp;
      }
    }
    return best;
  }

  private findObjective(ctx: BotContext): NeutralMonster | null {
    return (
      ctx.monsters.find(
        (m) =>
          m.isAlive &&
          (m.definitionId === "ancient_stag" || m.definitionId === "stone_wyrm"),
      ) ?? null
    );
  }

  private findLowHpMinion(ctx: BotContext): LivingEntity | null {
    let best: LivingEntity | null = null;
    let bestHp = 1;
    for (const e of ctx.entities) {
      if (e.kind !== "minion" || !e.isAlive) continue;
      if (!ctx.targeting.areEnemies(ctx.hero, e)) continue;
      if (distance2D(ctx.hero.position, e.position) > 7) continue;
      if (e.healthRatio < bestHp) {
        bestHp = e.healthRatio;
        best = e;
      }
    }
    return bestHp < 0.35 ? best : null;
  }

  private castBestAbility(ctx: BotContext): void {
    const slots = ["R", "Q", "W", "E"] as const;
    for (const slot of slots) {
      const ability = ctx.hero.abilities.find(
        (a) => a.slot === slot && a.level > 0 && a.cooldownRemaining <= 0,
      );
      if (!ability) continue;
      const ok = ctx.abilitySystem.tryCast(
        {
          caster: ctx.hero,
          abilityId: ability.abilityId,
          aimPoint: ctx.hero.position,
        },
        ctx.entities,
        ctx.isBlocked,
      );
      if (ok) return;
    }
  }
}
