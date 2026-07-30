export type DamageType = "physical" | "magical" | "true";

export type StatusEffectType =
  | "slow"
  | "stun"
  | "root"
  | "shield"
  | "armorBonus"
  | "damageReduction"
  | "moveSpeedBonus"
  | "invulnerable";

export interface DamageEvent {
  sourceId: string;
  targetId: string;
  amount: number;
  damageType: DamageType;
  abilityId?: string;
  canCrit?: boolean;
  timestamp: number;
  isCritical?: boolean;
}

export interface HealEvent {
  sourceId: string;
  targetId: string;
  amount: number;
  timestamp: number;
}

export interface ShieldEvent {
  sourceId: string;
  targetId: string;
  amount: number;
  duration: number;
  timestamp: number;
}

export interface StatusEffect {
  id: string;
  type: StatusEffectType;
  sourceId: string;
  magnitude: number;
  remaining: number;
  maxStacks: number;
  stacks: number;
}

export interface DamageResult {
  applied: number;
  killed: boolean;
  absorbedByShield: number;
  event: DamageEvent;
}
