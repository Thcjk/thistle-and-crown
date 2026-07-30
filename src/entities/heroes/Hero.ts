import { CombatEntity } from "@/entities/core/CombatEntity";
import { generateEntityId } from "@/entities/core/Entity";
import type { HeroDefinition } from "@/types/data.types";
import type { TeamId, Vec3 } from "@/types/game.types";
import {
  MAX_HERO_LEVEL,
  MAX_INVENTORY_SLOTS,
  SPAWN_PROTECTION_SECONDS,
  STARTING_GOLD,
} from "@/utils/constants";
import { getXpRequired } from "@/data/balance/progression";

export interface AbilityRuntime {
  abilityId: string;
  slot: string;
  level: number;
  cooldownRemaining: number;
}

export class Hero extends CombatEntity {
  readonly heroDefId: string;
  readonly isPlayer: boolean;
  gold = STARTING_GOLD;
  experience = 0;
  skillPoints = 1;
  inventory: Array<string | null>;
  abilities: AbilityRuntime[] = [];
  respawnTimer = 0;
  recalling = false;
  recallTimer = 0;
  kills = 0;
  deaths = 0;
  assists = 0;
  creepScore = 0;
  spawnProtection = SPAWN_PROTECTION_SECONDS;
  aiState = "Idle";

  constructor(
    def: HeroDefinition,
    teamId: TeamId,
    position: Vec3,
    isPlayer: boolean,
  ) {
    const stats = { ...def.baseStats };
    super(
      {
        id: generateEntityId(`hero_${def.id}`),
        kind: "hero",
        teamId,
        displayName: def.displayName,
        definitionId: def.id,
      },
      position,
      stats,
      0.55,
    );
    this.heroDefId = def.id;
    this.isPlayer = isPlayer;
    this.inventory = Array.from({ length: MAX_INVENTORY_SLOTS }, () => null);
    this.goldReward = 200;
    this.xpReward = 150;
  }

  get level(): number {
    return this.stats.level;
  }

  get hasSpawnProtection(): boolean {
    return this.spawnProtection > 0;
  }

  override isInvulnerable(): boolean {
    return this.hasSpawnProtection || super.isInvulnerable();
  }

  canLevelUp(): boolean {
    return this.level < MAX_HERO_LEVEL && this.experience >= getXpRequired(this.level);
  }

  applyLevelStats(growth: Partial<HeroDefinition["baseStats"]>): void {
    if (this.level >= MAX_HERO_LEVEL) return;
    this.stats.level += 1;
    const ratio = this.healthRatio;
    for (const [key, value] of Object.entries(growth)) {
      if (typeof value !== "number") continue;
      const k = key as keyof typeof this.stats;
      if (typeof this.stats[k] === "number") {
        (this.stats[k] as number) += value;
      }
    }
    this.stats.currentHealth = Math.min(
      this.stats.maxHealth,
      Math.max(1, this.stats.maxHealth * ratio),
    );
    this.skillPoints += 1;
  }
}
