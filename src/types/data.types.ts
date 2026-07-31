import type { FactionId, LaneId, TeamId, Vec3 } from "./game.types";
import type { EntityStats, MinionRole } from "./entity.types";
import type { DamageType, StatusEffectType } from "./combat.types";

export interface HeroStats extends EntityStats {
  abilityPower?: number;
}

export interface HeroDefinition {
  id: string;
  displayName: string;
  faction: FactionId;
  role: string[];
  modelAssetId: string;
  baseStats: HeroStats;
  growthStats: Partial<HeroStats>;
  abilityIds: string[];
  portraitColor: string;
}

export type AbilityTargeting =
  | "none"
  | "direction"
  | "ground"
  | "unit"
  | "self";

export interface AbilityDefinition {
  id: string;
  displayName: string;
  description: string;
  slot: "passive" | "Q" | "W" | "E" | "R" | "D" | "F";
  targeting: AbilityTargeting;
  cooldown: number;
  manaCost: number;
  range: number;
  radius?: number;
  damage?: number;
  damageType?: DamageType;
  duration?: number;
  shieldAmount?: number;
  damageReduction?: number;
  slowPercent?: number;
  allyMoveSpeedBonus?: number;
  stunDuration?: number;
  dashSpeed?: number;
  statusOnHit?: StatusEffectType;
  passiveTrigger?: "onHeroDamageTaken" | "onHeroDamageDealt";
  passiveMagnitude?: number;
  passiveDuration?: number;
  passiveMaxStacks?: number;
  maxLevel: number;
}

export interface ItemDefinition {
  id: string;
  displayName: string;
  description: string;
  cost: number;
  stats: Partial<HeroStats>;
  /** Item IDs required to purchase (combined cost deducted separately). */
  buildsFrom?: string[];
  category?: "attack" | "defense" | "magic" | "movement" | "utility";
  sellRatio?: number;
}

export interface MonsterDefinition {
  id: string;
  displayName: string;
  modelAssetId: string;
  stats: EntityStats;
  goldReward: number;
  xpReward: number;
  isElite?: boolean;
  buffId?: string;
}

export interface MonsterCampDefinition {
  id: string;
  displayName: string;
  position: Vec3;
  respawnSeconds: number;
  monsterIds: string[];
  leashRadius: number;
  aggroRadius: number;
}

export interface MinionDefinition {
  id: string;
  displayName: string;
  role: MinionRole;
  teamId: TeamId;
  modelAssetId: string;
  stats: EntityStats;
  goldReward: number;
  xpReward: number;
}

export interface StructureDefinition {
  id: string;
  displayName: string;
  kind: "tower" | "core" | "barracks";
  teamId: TeamId;
  modelAssetId: string;
  stats: EntityStats;
  goldReward: number;
  attackPriority: string[];
}

export interface ModelAssetDefinition {
  id: string;
  path: string;
  scale: number;
  rotationY: number;
  positionOffset: {
    x: number;
    y: number;
    z: number;
  };
  animations: Record<string, string>;
  placeholder: "capsule" | "cylinder" | "tower" | "core" | "tree" | "rock" | "monster";
  color: string;
  height?: number;
  radius?: number;
}

export interface LaneWaypoint {
  laneId: LaneId;
  teamId: TeamId;
  points: Vec3[];
}

export interface MapDefinition {
  id: string;
  displayName: string;
  size: { width: number; depth: number };
  cameraBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  bases: Record<
    TeamId,
    {
      spawn: Vec3;
      core: Vec3;
      healRadius: number;
    }
  >;
  towers: Array<{
    id: string;
    teamId: TeamId;
    laneId: LaneId;
    position: Vec3;
  }>;
  lanes: LaneWaypoint[];
  monsterCamps: MonsterCampDefinition[];
  obstacles: Array<{
    id: string;
    position: Vec3;
    radius: number;
  }>;
  /** Bush circles for simplified vision. */
  bushes?: Array<{
    id: string;
    position: Vec3;
    radius: number;
  }>;
  /** Lane gates (inhibitor-style). */
  laneGates?: Array<{
    id: string;
    teamId: TeamId;
    laneId: LaneId;
    position: Vec3;
  }>;
}
