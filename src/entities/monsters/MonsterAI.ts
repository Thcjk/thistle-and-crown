/**
 * Camp leash / aggro behaviour currently runs inside MatchManager.updateMonsters.
 * Extract here when monster behaviours diverge further.
 */
export interface MonsterAiConfig {
  aggroRadius: number;
  leashRadius: number;
}
