import { MAX_HERO_LEVEL } from "@/utils/constants";

/** XP required to go from level L to L+1 (index = current level). */
export const xpToNextLevel: Record<number, number> = {
  1: 180,
  2: 260,
  3: 340,
  4: 420,
  5: 500,
  6: 580,
  7: 660,
  8: 740,
  9: 820,
  10: 99999,
};

export function getXpRequired(level: number): number {
  if (level >= MAX_HERO_LEVEL) return Number.POSITIVE_INFINITY;
  return xpToNextLevel[level] ?? 400 + level * 80;
}

/** R unlock levels (classic MOBA cadence). */
export const ultimateUnlockLevels = [6, 11];

export function canUnlockUltimate(level: number): boolean {
  return ultimateUnlockLevels.includes(level);
}

export const skillPointsOnLevelUp = 1;
