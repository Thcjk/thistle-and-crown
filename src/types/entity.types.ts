import type { TeamId, Vec3 } from "./game.types";

export type EntityKind =
  | "hero"
  | "minion"
  | "monster"
  | "tower"
  | "core"
  | "barracks"
  | "projectile";

export type MinionRole = "melee" | "ranged" | "banner" | "siege";

export interface EntityStats {
  maxHealth: number;
  healthRegenPer5: number;
  attackDamage: number;
  attackSpeed: number;
  armor: number;
  magicResist: number;
  moveSpeed: number;
  attackRange: number;
}

export interface RuntimeStats extends EntityStats {
  currentHealth: number;
  shield: number;
  level: number;
}

export interface EntityTransform {
  position: Vec3;
  rotationY: number;
  radius: number;
}

export interface EntityIdentity {
  id: string;
  kind: EntityKind;
  teamId: TeamId | "neutral";
  displayName: string;
  definitionId: string;
}

export type AiStateName =
  | "Idle"
  | "MoveToLane"
  | "Farm"
  | "Harass"
  | "AttackTarget"
  | "UseAbility"
  | "Retreat"
  | "Recall"
  | "Shop"
  | "Jungle"
  | "Objective"
  | "TowerPush"
  | "ReturnToBase"
  | "Dead"
  | "Respawn";
