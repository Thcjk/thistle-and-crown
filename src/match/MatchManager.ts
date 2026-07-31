import type { EventBus } from "@/engine/EventBus";
import type { InputFrame } from "@/engine/InputManager";
import { MatchState } from "./MatchState";
import { TeamManager } from "./TeamManager";
import { RespawnManager } from "./RespawnManager";
import { VictorySystem } from "./VictorySystem";
import { MatchRules } from "./MatchRules";
import { MapLoader } from "@/world/MapLoader";
import { CollisionSystem } from "@/world/CollisionSystem";
import { NavigationSystem } from "@/world/NavigationSystem";
import { SpawnSystem } from "@/world/SpawnSystem";
import { DamageSystem } from "@/combat/DamageSystem";
import { CooldownSystem } from "@/combat/CooldownSystem";
import { StatusEffectSystem } from "@/combat/StatusEffectSystem";
import { TargetingSystem } from "@/combat/TargetingSystem";
import { DeathSystem } from "@/combat/DeathSystem";
import { AbilitySystem } from "@/combat/AbilitySystem";
import { CombatSystem } from "@/combat/CombatSystem";
import { AssistSystem, grantAssist } from "@/combat/AssistSystem";
import { GoldSystem } from "@/progression/GoldSystem";
import { ExperienceSystem } from "@/progression/ExperienceSystem";
import { LevelSystem } from "@/progression/LevelSystem";
import { ItemSystem } from "@/progression/ItemSystem";
import { ShopSystem } from "@/progression/ShopSystem";
import { AIController } from "@/ai/AIController";
import { LaneAI } from "@/ai/LaneAI";
import { Hero } from "@/entities/heroes/Hero";
import { Minion } from "@/entities/minions/Minion";
import { NeutralMonster } from "@/entities/monsters/NeutralMonster";
import { Tower } from "@/entities/structures/Tower";
import { CoreStructure } from "@/entities/structures/CoreStructure";
import { Projectile } from "@/entities/projectiles/Projectile";
import type { LivingEntity } from "@/entities/core/LivingEntity";
import type { CombatEntity } from "@/entities/core/CombatEntity";
import { SeparationSystem } from "@/world/SeparationSystem";
import { LaneGate } from "@/entities/structures/LaneGate";
import { VisionSystem } from "@/world/VisionSystem";
import { MatchStats } from "./MatchStats";
import { getHeroDefinition, getDefaultOpponentHeroId } from "@/data/heroes";
import { getAbilityDefinition } from "@/data/abilities";
import { getMinionDefinition } from "@/data/minions/definitions";
import { monstersById } from "@/data/monsters/camps";
import {
  ASSIST_GOLD,
  BANNER_WAVE_EVERY,
  BASE_HEAL_PER_SECOND,
  FOUNTAIN_DAMAGE_PER_SECOND,
  HERO_KILL_GOLD,
  MINION_MELEE_COUNT,
  MINION_RANGED_COUNT,
  MINION_WAVE_INTERVAL,
  OBJECTIVE_BONUS_GOLD,
  SIEGE_WAVE_EVERY,
} from "@/utils/constants";
import { distance2D } from "@/utils/math";
import { logger } from "@/utils/logger";
import { resetEntityIdCounter } from "@/entities/core/Entity";
import type { MapDefinition } from "@/types/data.types";
import type { BotDifficulty, LaneId, TeamId, Vec3 } from "@/types/game.types";
import type { MatchResultStats } from "@/types/game.types";

export interface MatchConfig {
  playerHeroId: string;
  playerTeam: TeamId;
  botDifficulty?: BotDifficulty;
}

export class MatchManager {
  readonly state = new MatchState();
  readonly map: MapDefinition;
  readonly heroes: Hero[] = [];
  readonly minions: Minion[] = [];
  readonly monsters: NeutralMonster[] = [];
  readonly towers: Tower[] = [];
  readonly laneGates: LaneGate[] = [];
  readonly cores: CoreStructure[] = [];
  readonly projectiles: Projectile[] = [];
  readonly stats = new MatchStats();

  private readonly teams: TeamManager;
  private readonly respawn: RespawnManager;
  private readonly victory: VictorySystem;
  private readonly collision: CollisionSystem;
  private readonly navigation: NavigationSystem;
  private readonly spawns: SpawnSystem;
  private readonly damage: DamageSystem;
  private readonly cooldowns = new CooldownSystem();
  private readonly statuses = new StatusEffectSystem();
  private readonly targeting = new TargetingSystem();
  private readonly death: DeathSystem;
  private readonly abilities: AbilitySystem;
  private readonly combat: CombatSystem;
  private readonly gold: GoldSystem;
  private readonly experience: ExperienceSystem;
  private readonly levels = new LevelSystem();
  private readonly items: ItemSystem;
  readonly shop = new ShopSystem();
  private readonly ai = new AIController();
  private readonly laneAI = new LaneAI();
  private readonly assists = new AssistSystem();
  private readonly separation = new SeparationSystem();
  private readonly vision: VisionSystem;

  private waveTimer = 0;
  private campRespawn = new Map<string, number>();
  private destroyedGates = new Set<string>();
  private selectedTargetId: string | null = null;
  private pendingAbilitySlot: string | null = null;
  private playerId: string | null = null;
  cameraLocked = false;
  /** Last issued ground move/attack-move point for UI marker. */
  moveMarker: { x: number; z: number; life: number } | null = null;
  private floatingDamage: Array<{
    id: string;
    x: number;
    z: number;
    amount: number;
    life: number;
  }> = [];
  private unsubscribers: Array<() => void> = [];

  constructor(
    private readonly events: EventBus,
    config: MatchConfig,
  ) {
    resetEntityIdCounter();
    this.map = new MapLoader().load();
    this.teams = new TeamManager(this.state);
    this.respawn = new RespawnManager(events, this.map);
    this.victory = new VictorySystem(events, this.state);
    this.collision = new CollisionSystem(this.map);
    this.navigation = new NavigationSystem(this.map);
    this.spawns = new SpawnSystem(this.map);
    this.damage = new DamageSystem(events);
    this.death = new DeathSystem(events);
    this.abilities = new AbilitySystem(
      events,
      this.damage,
      this.cooldowns,
      this.statuses,
      this.targeting,
    );
    this.combat = new CombatSystem(events, this.damage, this.targeting);
    this.gold = new GoldSystem(events);
    this.experience = new ExperienceSystem(events);
    this.items = new ItemSystem(events, this.gold);

    this.vision = new VisionSystem(this.map.bushes ?? []);

    this.bootstrap(config);
    this.bindEvents();
    this.stats.botDifficulty = config.botDifficulty ?? "normal";
    this.state.phase = "countdown";
    this.waveTimer = MINION_WAVE_INTERVAL;
    this.events.emit("matchStarted", { matchId: "prototype_01" });
  }

  getVision(): VisionSystem {
    return this.vision;
  }

  buildResultStats(): MatchResultStats | null {
    const player = this.player;
    if (!player) return null;
    const winner = this.state.winner ?? "highland";
    return this.stats.buildResult({
      playerId: player.id,
      playerHeroId: player.heroDefId,
      playerTeam: player.teamId as TeamId,
      winner,
      durationSeconds: this.state.elapsedSeconds,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      creepScore: player.creepScore,
      gold: player.gold,
      level: player.level,
      towersDestroyed: this.state.teams[player.teamId as TeamId].towersDestroyed,
    });
  }

  get player(): Hero | null {
    return this.heroes.find((h) => h.id === this.playerId) ?? null;
  }

  get selectedTarget(): LivingEntity | null {
    if (!this.selectedTargetId) return null;
    return this.allLiving().find((e) => e.id === this.selectedTargetId) ?? null;
  }

  getFloatingDamage(): typeof this.floatingDamage {
    return this.floatingDamage;
  }

  getBotState(): string {
    const bot = this.heroes.find((h) => !h.isPlayer);
    return bot ? this.ai.getState(bot.id) : "-";
  }

  isAbilityTargeting(): boolean {
    return this.pendingAbilitySlot !== null;
  }

  getPendingAbilitySlot(): string | null {
    return this.pendingAbilitySlot;
  }

  dispose(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    this.ai.clear();
  }

  handleInput(input: InputFrame): void {
    const player = this.player;
    if (!player || this.state.phase !== "active") return;

    if (input.toggleCameraLock) {
      this.cameraLocked = !this.cameraLocked;
      this.events.emit("uiToast", {
        message: this.cameraLocked ? "Camera locked" : "Camera unlocked",
      });
    }

    if (input.stopCommand) {
      player.orderStop();
      player.recalling = false;
      this.pendingAbilitySlot = null;
    }

    if (input.cancelAbility) {
      this.pendingAbilitySlot = null;
    }

    if (input.selectCommand?.hasWorld) {
      // LoL-style: LMB selects, does not issue move/attack orders.
      const hit = this.pickEntity(input.selectCommand.worldX, input.selectCommand.worldZ);
      this.selectedTargetId = hit?.id ?? null;
    }

    if (input.attackMoveConfirm?.hasWorld) {
      this.pendingAbilitySlot = null;
      player.recalling = false;
      const hit = this.pickEntity(
        input.attackMoveConfirm.worldX,
        input.attackMoveConfirm.worldZ,
        true,
      );
      if (hit && this.targeting.areEnemies(player, hit)) {
        player.orderAttack(hit.id);
        this.selectedTargetId = hit.id;
      } else {
        player.orderAttackMove({
          x: input.attackMoveConfirm.worldX,
          y: 0,
          z: input.attackMoveConfirm.worldZ,
        });
        this.setMoveMarker(input.attackMoveConfirm.worldX, input.attackMoveConfirm.worldZ);
      }
    }

    if (input.moveCommand?.hasWorld) {
      this.pendingAbilitySlot = null;
      player.recalling = false;
      // Tight pick: ground clicks must move to the point, not snap onto nearby minions.
      const hit = this.pickEntity(input.moveCommand.worldX, input.moveCommand.worldZ, true);
      if (hit && this.targeting.areEnemies(player, hit)) {
        player.orderAttack(hit.id);
        this.selectedTargetId = hit.id;
      } else {
        player.orderMove({
          x: input.moveCommand.worldX,
          y: 0,
          z: input.moveCommand.worldZ,
        });
        this.setMoveMarker(input.moveCommand.worldX, input.moveCommand.worldZ);
        this.selectedTargetId = null;
      }
    }

    if (input.abilityConfirm?.hasWorld && this.pendingAbilitySlot) {
      this.tryPlayerAbility(
        this.pendingAbilitySlot,
        {
          x: input.abilityConfirm.worldX,
          y: 0,
          z: input.abilityConfirm.worldZ,
        },
      );
      this.pendingAbilitySlot = null;
    }

    if (input.abilityPresses.length > 0) {
      for (const slot of input.abilityPresses) {
        if (slot === "B") {
          this.startRecall(player);
          this.pendingAbilitySlot = null;
          continue;
        }
        const ability = player.abilities.find((a) => a.slot === slot);
        const def = ability ? getAbilityDefinition(ability.abilityId) : undefined;
        if (!def) continue;
        if (def.targeting === "self" || def.targeting === "none") {
          this.tryPlayerAbility(slot, player.position);
          this.pendingAbilitySlot = null;
        } else {
          this.pendingAbilitySlot = slot;
        }
      }
    }
  }

  purchaseItem(itemId: string): boolean {
    const player = this.player;
    if (!player) return false;
    const inBase = this.spawns.isInHealZone(player.teamId as TeamId, player.position);
    return this.items.tryPurchase(player, itemId, inBase);
  }

  upgradeAbility(abilityId: string): boolean {
    const player = this.player;
    if (!player) return false;
    return this.levels.upgradeAbility(player, abilityId);
  }

  simulate(dt: number): void {
    if (this.state.phase === "ended") return;

    if (this.state.phase === "countdown") {
      this.state.countdownSeconds -= dt;
      if (this.state.countdownSeconds <= 0) {
        this.state.phase = "active";
        this.state.countdownSeconds = 0;
        this.spawnWave();
        this.waveTimer = MINION_WAVE_INTERVAL;
        this.events.emit("uiToast", { message: "Minions have spawned — fight!" });
      }
      return;
    }

    if (this.state.phase !== "active") return;
    this.state.elapsedSeconds += dt;

    this.gold.tickPassive(this.heroes, dt);
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.spawnWave();
      this.waveTimer = MINION_WAVE_INTERVAL;
    }

    this.updateCamps(dt);
    this.ai.update({
      dt,
      heroes: this.heroes,
      entities: this.allLiving(),
      monsters: this.monsters,
      map: this.map,
      abilitySystem: this.abilities,
      targeting: this.targeting,
      itemSystem: this.items,
      isBlocked: (from, to) => this.collision.isBlocked(from, to),
      isInHealZone: (teamId, pos) => this.spawns.isInHealZone(teamId, pos),
      elapsedSeconds: this.state.elapsedSeconds,
      playerPosition: this.player?.position ?? null,
    });

    this.updateMinions(dt);
    this.updateMonsters(dt);
    this.updateHeroes(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateFountainPressure(dt);
    this.separation.apply([
      ...this.heroes.filter((h) => h.isAlive),
      ...this.minions.filter((m) => m.isAlive),
      ...this.monsters.filter((m) => m.isAlive),
    ]);
    this.processDeaths();
    this.respawn.update(this.heroes, dt);
    this.cleanup();
    this.victory.check(this.cores);

    for (const d of this.floatingDamage) d.life -= dt;
    this.floatingDamage = this.floatingDamage.filter((d) => d.life > 0);
    if (this.moveMarker) {
      this.moveMarker.life -= dt;
      if (this.moveMarker.life <= 0) this.moveMarker = null;
    }
  }

  private setMoveMarker(x: number, z: number): void {
    this.moveMarker = { x, z, life: 1.2 };
  }

  private bootstrap(config: MatchConfig): void {
    for (const towerDef of this.map.towers) {
      this.towers.push(
        new Tower(towerDef.id, towerDef.teamId, towerDef.laneId, towerDef.position),
      );
    }
    for (const gateDef of this.map.laneGates ?? []) {
      this.laneGates.push(
        new LaneGate(gateDef.id, gateDef.teamId, gateDef.laneId, gateDef.position),
      );
    }
    this.cores.push(new CoreStructure("highland", this.map.bases.highland.core));
    this.cores.push(new CoreStructure("crown", this.map.bases.crown.core));

    const playerDef = getHeroDefinition(config.playerHeroId);
    const enemyDef = getHeroDefinition(getDefaultOpponentHeroId(config.playerHeroId));
    if (!playerDef || !enemyDef) {
      throw new Error("Hero definitions missing for prototype match");
    }

    const player = new Hero(
      playerDef,
      config.playerTeam,
      this.spawns.getHeroSpawn(config.playerTeam),
      true,
    );
    this.initHeroAbilities(player, playerDef.abilityIds);
    for (const ability of player.abilities) {
      if (ability.slot === "passive") ability.level = 1;
      else if (ability.slot === "R") ability.level = 0;
      else ability.level = 1;
    }
    player.skillPoints = 1;

    const enemyTeam: TeamId = config.playerTeam === "highland" ? "crown" : "highland";
    const enemy = new Hero(
      enemyDef,
      enemyTeam,
      this.spawns.getHeroSpawn(enemyTeam),
      false,
    );
    this.initHeroAbilities(enemy, enemyDef.abilityIds);
    for (const ability of enemy.abilities) {
      if (ability.slot === "passive") ability.level = 1;
      else if (ability.slot === "Q") ability.level = 1;
      else if (ability.slot === "W") ability.level = 1;
      else ability.level = 0;
    }

    this.heroes.push(player, enemy);
    this.playerId = player.id;
    this.teams.assignHeroSlot(player.teamId as TeamId, player.id);
    this.teams.assignHeroSlot(enemy.teamId as TeamId, enemy.id);
    this.ai.register(enemy, this.map, config.botDifficulty ?? "normal");

    for (const camp of this.map.monsterCamps) {
      this.spawnCamp(camp.id);
    }

    logger.info("Match", "Prototype match bootstrapped");
  }

  private initHeroAbilities(hero: Hero, abilityIds: string[]): void {
    for (const id of abilityIds) {
      const def = getAbilityDefinition(id);
      if (!def) continue;
      hero.abilities.push({
        abilityId: id,
        slot: def.slot,
        level: def.slot === "passive" ? 1 : 0,
        cooldownRemaining: 0,
      });
    }
  }

  private bindEvents(): void {
    this.unsubscribers.push(
      this.events.on("damageDealt", (payload) => {
        this.stats.recordDamage(payload.sourceId, payload.targetId, payload.amount);
        const target = this.allLiving().find((e) => e.id === payload.targetId);
        if (!target) return;
        this.floatingDamage.push({
          id: `${payload.targetId}_${Math.random()}`,
          x: target.position.x,
          z: target.position.z,
          amount: Math.round(payload.amount),
          life: 0.8,
        });
        const source = this.allLiving().find((e) => e.id === payload.sourceId);
        if (source?.kind === "hero" && target.kind === "hero") {
          this.assists.recordDamage(target.id, source.id, this.state.elapsedSeconds);
        }
        const player = this.player;
        if (player && target.id === player.id && source) {
          this.abilities.handlePassiveOnHeroDamage(player, source);
        }
      }),
    );
  }

  private tryPlayerAbility(slot: string, aim: Vec3): void {
    const player = this.player;
    if (!player) return;
    const ability = player.abilities.find((a) => a.slot === slot);
    if (!ability) return;
    this.abilities.tryCast(
      { caster: player, abilityId: ability.abilityId, aimPoint: aim },
      this.allLiving(),
      (from, to) => this.collision.isBlocked(from, to),
    );
  }

  private startRecall(hero: Hero): void {
    if (!hero.isAlive) return;
    hero.recalling = true;
    hero.recallTimer = MatchRules.recallChannelSeconds;
    hero.clearOrders();
    this.events.emit("uiToast", { message: "Recalling to base..." });
  }

  private updateHeroes(dt: number): void {
    const living = this.allLiving();
    const resolve = (from: Vec3, to: Vec3) => this.collision.resolve(from, to);

    for (const hero of this.heroes) {
      this.statuses.tick(hero, dt);
      this.cooldowns.tick(hero, dt);

      if (hero.dead) continue;
      if (hero.spawnProtection > 0) {
        hero.spawnProtection = Math.max(0, hero.spawnProtection - dt);
      }

      if (hero.recalling) {
        hero.recallTimer -= dt;
        if (hero.isMoving || hero.attackTargetId || hero.orderMode === "attackMove") {
          hero.recalling = false;
        } else if (hero.recallTimer <= 0) {
          const spawn = this.spawns.getHeroSpawn(hero.teamId as TeamId);
          hero.setPosition(spawn.x, 0, spawn.z);
          hero.recalling = false;
          hero.spawnProtection = 1.5;
        }
      }

      if (this.spawns.isInHealZone(hero.teamId as TeamId, hero.position)) {
        hero.heal(BASE_HEAL_PER_SECOND * dt);
      }

      hero.heal((hero.stats.healthRegenPer5 / 5) * dt);

      if (hero.orderMode === "hold") {
        continue;
      }

      if (hero.orderMode === "attackMove") {
        this.combat.updateAttackMove(hero, living, dt, this.projectiles, resolve);
        continue;
      }

      const target = hero.attackTargetId
        ? living.find((e) => e.id === hero.attackTargetId) ?? null
        : null;
      if (hero.attackTargetId && target) {
        this.combat.updateAutoAttack(hero, target, dt, this.projectiles);
      } else {
        this.combat.updateMovement(hero, dt, resolve);
      }
    }
  }

  /** Enemy heroes inside an opposing heal zone take fountain pressure damage. */
  private updateFountainPressure(dt: number): void {
    for (const hero of this.heroes) {
      if (!hero.isAlive) continue;
      const enemyTeam: TeamId = hero.teamId === "highland" ? "crown" : "highland";
      if (!this.spawns.isInHealZone(enemyTeam, hero.position)) continue;
      this.damage.apply(
        hero,
        {
          sourceId: "fountain",
          targetId: hero.id,
          amount: FOUNTAIN_DAMAGE_PER_SECOND * dt,
          damageType: "true",
          timestamp: performance.now(),
        },
        true,
      );
    }
  }

  private updateMinions(dt: number): void {
    const living = this.allLiving();
    for (const minion of this.minions) {
      if (!minion.isAlive) continue;
      this.statuses.tick(minion, dt);
      if (minion.attackCooldown > 0) minion.attackCooldown -= dt;
      this.laneAI.updateMinion(minion, living, this.targeting);
      const target = minion.attackTargetId
        ? living.find((e) => e.id === minion.attackTargetId) ?? null
        : null;
      if (target) {
        this.combat.updateAutoAttack(minion, target, dt, this.projectiles);
      } else {
        this.combat.updateMovement(minion, dt, (from, to) => this.collision.resolve(from, to));
      }
    }
  }

  private updateMonsters(dt: number): void {
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      this.statuses.tick(monster, dt);
      if (monster.attackCooldown > 0) monster.attackCooldown -= dt;

      const distHome = distance2D(monster.position, monster.homePosition);
      if (distHome > monster.leashRadius) {
        monster.returningHome = true;
        monster.orderMove(monster.homePosition);
        monster.attackTargetId = null;
      }

      if (monster.returningHome) {
        this.combat.updateMovement(monster, dt, (from, to) => this.collision.resolve(from, to));
        if (distance2D(monster.position, monster.homePosition) < 0.8) {
          monster.returningHome = false;
          monster.stats.currentHealth = monster.stats.maxHealth;
          monster.clearOrders();
        }
        continue;
      }

      const aggressor = this.heroes.find(
        (h) =>
          h.isAlive &&
          distance2D(h.position, monster.position) <= monster.aggroRadius,
      );
      if (aggressor) {
        monster.orderAttack(aggressor.id);
        this.combat.updateAutoAttack(monster, aggressor, dt, this.projectiles);
      } else {
        monster.orderMove(monster.homePosition);
        this.combat.updateMovement(monster, dt, (from, to) => this.collision.resolve(from, to));
      }
    }
  }

  private updateTowers(dt: number): void {
    const living = this.allLiving();
    const alliedHeroIds = new Set(
      this.heroes.filter((h) => h.isAlive).map((h) => h.id),
    );
    for (const tower of this.towers) {
      if (!tower.isAlive) continue;
      if (tower.attackCooldown > 0) tower.attackCooldown -= dt;
      const target = this.targeting.selectTowerTarget(tower, living, alliedHeroIds);
      if (target) {
        tower.orderAttack(target.id);
        this.combat.updateAutoAttack(tower, target, dt, this.projectiles);
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles) {
      const target = this.allLiving().find((e) => e.id === projectile.targetId);
      if (!target?.isAlive) {
        projectile.markedForRemoval = true;
        projectile.active = false;
        continue;
      }
      projectile.update(dt, target.position);
      if (projectile.arrived) {
        this.damage.apply(
          target,
          {
            sourceId: projectile.sourceId,
            targetId: target.id,
            amount: projectile.damage,
            damageType: projectile.damageType,
            abilityId: projectile.abilityId,
            timestamp: performance.now(),
          },
          true,
        );
        projectile.markedForRemoval = true;
        projectile.active = false;
      }
    }
  }

  private processDeaths(): void {
    for (const entity of this.allLiving(true)) {
      if (!entity.dead || entity.deathProcessed) continue;
      const killerId = entity.lastAttackerId;
      this.death.processDeath(entity, killerId);

      const killer = this.heroes.find((h) => h.id === killerId) ?? null;
      if (entity.kind === "hero") {
        const victim = entity as Hero;
        if (killer) {
          killer.kills += 1;
          this.gold.add(killer, HERO_KILL_GOLD);
          this.teams.registerKill(killer.teamId as TeamId, victim.teamId as TeamId);
        }
        const assistIds = this.assists.collectAssists(
          victim.id,
          killerId,
          this.state.elapsedSeconds,
        );
        for (const assistId of assistIds) {
          const helper = this.heroes.find((h) => h.id === assistId);
          if (helper && helper.teamId !== victim.teamId) {
            grantAssist(helper, ASSIST_GOLD);
            this.events.emit("goldChanged", {
              entityId: helper.id,
              gold: helper.gold,
              delta: ASSIST_GOLD,
            });
          }
        }
        this.experience.grantKillXp(
          killer,
          entity.xpReward,
          entity.position,
          this.heroes.filter((h) => h.teamId === (killer?.teamId ?? victim.teamId)),
        );
      } else {
        // Last-hit gold: only the killing blow receives gold (classic MOBA economy).
        if (killer) {
          if (MatchRules.lastHitOnlyGold) {
            this.gold.add(killer, entity.goldReward);
            if (entity.kind === "minion" || entity.kind === "monster") {
              killer.creepScore += 1;
            }
          }
          this.experience.grantKillXp(
            killer,
            entity.xpReward,
            entity.position,
            this.heroes.filter((h) => h.teamId === killer.teamId),
          );
          if (entity.kind === "monster") {
            const monster = entity as NeutralMonster;
            if (monster.buffId === "stag_endurance") {
              this.statuses.apply(killer, {
                id: "stag_endurance",
                type: "moveSpeedBonus",
                sourceId: monster.id,
                magnitude: 0.15,
                duration: 45,
                maxStacks: 1,
              });
              this.statuses.apply(killer, {
                id: "stag_regen",
                type: "armorBonus",
                sourceId: monster.id,
                magnitude: 8,
                duration: 45,
                maxStacks: 1,
              });
              this.gold.add(killer, OBJECTIVE_BONUS_GOLD);
              this.stats.recordObjective(killer.id);
              this.events.emit("uiToast", { message: "Elder Stag blessing — speed & regen!" });
            }
            if (monster.buffId === "wyrm_siege") {
              this.statuses.apply(killer, {
                id: "wyrm_siege",
                type: "damageReduction",
                sourceId: monster.id,
                magnitude: 0.1,
                duration: 60,
                maxStacks: 1,
              });
              this.gold.add(killer, OBJECTIVE_BONUS_GOLD * 2);
              this.stats.recordObjective(killer.id);
              this.events.emit("uiToast", { message: "Stone Wyrm favor — siege power!" });
            }
            this.events.emit("monsterCampCleared", { campId: monster.campId });
          }
          if (entity.kind === "tower") {
            this.teams.registerTowerDestroyed(killer.teamId as TeamId);
            this.events.emit("towerDestroyed", {
              towerId: entity.id,
              teamId: entity.teamId,
            });
          }
          if (entity.kind === "barracks") {
            const gate = entity as LaneGate;
            if (!gate.destroyed) {
              gate.destroyed = true;
              this.destroyedGates.add(gate.definitionId);
              this.teams.registerLaneGateDestroyed(killer.teamId as TeamId);
              this.gold.add(killer, gate.goldReward);
              this.events.emit("uiToast", {
                message: `${gate.displayName} destroyed — super minions incoming!`,
              });
            }
          }
        } else if (!MatchRules.lastHitOnlyGold) {
          // no-op placeholder for shared bounty modes later
        }
      }
    }

    // Mark empty camps for respawn
    for (const camp of this.map.monsterCamps) {
      const alive = this.monsters.some((m) => m.campId === camp.id && m.isAlive);
      if (!alive && !this.campRespawn.has(camp.id)) {
        this.campRespawn.set(camp.id, camp.respawnSeconds);
      }
    }
  }

  private updateCamps(dt: number): void {
    for (const [campId, timer] of [...this.campRespawn.entries()]) {
      const next = timer - dt;
      if (next <= 0) {
        this.campRespawn.delete(campId);
        this.spawnCamp(campId);
      } else {
        this.campRespawn.set(campId, next);
      }
    }
  }

  private spawnCamp(campId: string): void {
    const camp = this.map.monsterCamps.find((c) => c.id === campId);
    if (!camp) return;
    // Clear leftover dead monsters from camp
    for (const monster of this.monsters) {
      if (monster.campId === campId) monster.markedForRemoval = true;
    }
    camp.monsterIds.forEach((monsterId, index) => {
      const def = monstersById[monsterId];
      if (!def) return;
      const offset = (index - 1) * 1.4;
      const pos = {
        x: camp.position.x + offset,
        y: 0,
        z: camp.position.z + (index % 2) * 1.2,
      };
      this.monsters.push(
        new NeutralMonster(def, camp.id, pos, camp.leashRadius, camp.aggroRadius),
      );
    });
  }

  private spawnWave(): void {
    this.state.waveIndex += 1;
    const includeBanner = this.state.waveIndex % BANNER_WAVE_EVERY === 0;
    const includeSiege = this.state.waveIndex % SIEGE_WAVE_EVERY === 0;
    for (const laneId of MatchRules.activeLanesForWaves) {
      this.spawnWaveForTeam("highland", laneId, includeBanner, includeSiege);
      this.spawnWaveForTeam("crown", laneId, includeBanner, includeSiege);
    }
    this.events.emit("minionWaveSpawned", { waveIndex: this.state.waveIndex });
  }

  private spawnWaveForTeam(
    teamId: TeamId,
    laneId: LaneId,
    includeBanner: boolean,
    includeSiege: boolean,
  ): void {
    const path = this.navigation.getLanePath(teamId, laneId);
    const spawn = path[0] ?? this.spawns.getHeroSpawn(teamId);
    const meleeId = teamId === "highland" ? "highland_melee" : "crown_melee";
    const rangedId = teamId === "highland" ? "highland_ranged" : "crown_ranged";
    const bannerId = teamId === "highland" ? "highland_banner" : "crown_banner";
    const siegeId = teamId === "highland" ? "highland_siege" : "crown_siege";
    const gateBuff = this.hasEnemyGateDown(teamId, laneId) ? 1.18 : 1;

    for (let i = 0; i < MINION_MELEE_COUNT; i += 1) {
      const def = getMinionDefinition(meleeId);
      if (!def) continue;
      const m = new Minion(def, laneId, {
        x: spawn.x + (i - 1) * 0.8,
        y: 0,
        z: spawn.z + (teamId === "highland" ? i * 0.4 : -i * 0.4),
      }, path);
      this.applyMinionWaveScaling(m, gateBuff);
      this.minions.push(m);
    }
    for (let i = 0; i < MINION_RANGED_COUNT; i += 1) {
      const def = getMinionDefinition(rangedId);
      if (!def) continue;
      const m = new Minion(def, laneId, {
        x: spawn.x + (i - 1) * 0.8,
        y: 0,
        z: spawn.z + (teamId === "highland" ? -1.5 - i * 0.35 : 1.5 + i * 0.35),
      }, path);
      this.applyMinionWaveScaling(m, gateBuff);
      this.minions.push(m);
    }
    if (includeBanner) {
      const def = getMinionDefinition(bannerId);
      if (def) {
        const m = new Minion(def, laneId, { ...spawn }, path);
        this.applyMinionWaveScaling(m, gateBuff * 1.05);
        this.minions.push(m);
      }
    }
    if (includeSiege) {
      const def = getMinionDefinition(siegeId);
      if (def) {
        const m = new Minion(def, laneId, { ...spawn, x: spawn.x + 1.2 }, path);
        this.applyMinionWaveScaling(m, gateBuff * 1.1);
        this.minions.push(m);
      }
    }
  }

  private applyMinionWaveScaling(minion: Minion, gateBuff: number): void {
    const waveScale = 1 + this.state.waveIndex * 0.035;
    const total = waveScale * gateBuff;
    minion.stats.maxHealth *= total;
    minion.stats.currentHealth = minion.stats.maxHealth;
    minion.stats.attackDamage *= total;
  }

  private hasEnemyGateDown(teamId: TeamId, laneId: LaneId): boolean {
    const enemyTeam: TeamId = teamId === "highland" ? "crown" : "highland";
    return this.laneGates.some(
      (g) =>
        g.teamId === enemyTeam &&
        g.laneId === laneId &&
        (g.destroyed || this.destroyedGates.has(g.definitionId)),
    );
  }

  private cleanup(): void {
    const filterActive = <T extends { markedForRemoval: boolean; active: boolean }>(
      list: T[],
    ): void => {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (list[i]!.markedForRemoval) {
          list[i]!.active = false;
          list.splice(i, 1);
        }
      }
    };
    filterActive(this.minions);
    filterActive(this.monsters);
    filterActive(this.projectiles);
    for (let i = this.towers.length - 1; i >= 0; i -= 1) {
      if (this.towers[i]!.markedForRemoval || this.towers[i]!.destroyed) {
        this.towers.splice(i, 1);
      }
    }
    for (let i = this.laneGates.length - 1; i >= 0; i -= 1) {
      if (this.laneGates[i]!.markedForRemoval || this.laneGates[i]!.destroyed) {
        this.laneGates.splice(i, 1);
      }
    }
  }

  private allLiving(includeDead = false): LivingEntity[] {
    const list: LivingEntity[] = [
      ...this.heroes,
      ...this.minions,
      ...this.monsters,
      ...this.towers,
      ...this.laneGates.filter((g) => !g.destroyed),
      ...this.cores,
    ];
    return includeDead ? list : list.filter((e) => e.isAlive);
  }

  private pickEntity(x: number, z: number, enemiesOnly = false): LivingEntity | null {
    const player = this.player;
    let best: LivingEntity | null = null;
    let bestDist = 1.15;
    for (const entity of this.allLiving()) {
      if (enemiesOnly && player && !this.targeting.areEnemies(player, entity)) continue;
      // Ignore own hero for ground clicks.
      if (player && entity.id === player.id) continue;
      const d = distance2D({ x, z }, entity.position);
      const reach = entity.transform.radius + 0.35;
      if (d <= reach && d < bestDist) {
        best = entity;
        bestDist = d;
      }
    }
    return best;
  }
}

// Ensure CombatEntity clearOrders exists on LivingEntity usage sites
export type { CombatEntity };
