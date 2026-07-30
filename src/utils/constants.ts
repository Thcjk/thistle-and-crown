import type { TeamId } from "@/types/game.types";

export const GAME_NAME = "Thistle & Crown";
export const GAME_VERSION = "0.1.0";

export const TICK_RATE = 30;
export const FIXED_DT = 1 / TICK_RATE;

export const MAX_HERO_LEVEL = 6;
export const MAX_INVENTORY_SLOTS = 6;
export const HERO_SLOTS_PER_TEAM = 5;

export const STARTING_GOLD = 500;
export const PASSIVE_GOLD_PER_SECOND = 2;
export const BASE_HEAL_PER_SECOND = 80;

export const MINION_WAVE_INTERVAL = 30;
export const MINION_MELEE_COUNT = 3;
export const MINION_RANGED_COUNT = 3;
export const BANNER_WAVE_EVERY = 3;

export const DEFAULT_RESPAWN_BASE = 8;
export const DEFAULT_RESPAWN_PER_LEVEL = 1.5;

export const TEAM_COLORS: Record<TeamId | "neutral", string> = {
  highland: "#3d6b5a",
  crown: "#8b3a3a",
  neutral: "#6a5a3a",
};

export const LANE_DISPLAY_NAMES = {
  top: "Highland Road",
  middle: "King's March",
  bottom: "Mistwood Path",
} as const;

export const MINION_AGGRO_PRIORITY = [
  "attackingAlliedHero",
  "attackingSelf",
  "enemyMinion",
  "enemyHero",
  "enemyTower",
  "enemyCore",
] as const;

export const TOWER_AGGRO_PRIORITY = [
  "attackingAlliedHero",
  "enemyMinion",
  "enemyHero",
  "other",
] as const;
