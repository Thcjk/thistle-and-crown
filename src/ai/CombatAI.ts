/** Shared combat heuristics for bots and structures – extension point. */
export class CombatAI {
  shouldRetreat(healthRatio: number, enemiesNearby: number): boolean {
    if (healthRatio < 0.25) return true;
    if (healthRatio < 0.4 && enemiesNearby >= 3) return true;
    return false;
  }
}
