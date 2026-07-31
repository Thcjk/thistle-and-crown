import type { BotDifficulty, MatchResultStats, TeamId } from "@/types/game.types";

/** Tracks per-match combat and objective stats for results screen. */
export class MatchStats {
  readonly damageDealt = new Map<string, number>();
  readonly damageTaken = new Map<string, number>();
  readonly objectivesTaken = new Map<string, number>();
  botDifficulty: BotDifficulty = "normal";

  recordDamage(sourceId: string, targetId: string, amount: number): void {
    this.damageDealt.set(sourceId, (this.damageDealt.get(sourceId) ?? 0) + amount);
    this.damageTaken.set(targetId, (this.damageTaken.get(targetId) ?? 0) + amount);
  }

  recordObjective(heroId: string): void {
    this.objectivesTaken.set(heroId, (this.objectivesTaken.get(heroId) ?? 0) + 1);
  }

  buildResult(params: {
    playerId: string;
    playerHeroId: string;
    playerTeam: TeamId;
    winner: TeamId;
    durationSeconds: number;
    kills: number;
    deaths: number;
    assists: number;
    creepScore: number;
    gold: number;
    level: number;
    towersDestroyed: number;
  }): MatchResultStats {
    return {
      ...params,
      winner: params.winner,
      damageDealt: this.damageDealt.get(params.playerId) ?? 0,
      damageTaken: this.damageTaken.get(params.playerId) ?? 0,
      objectivesTaken: this.objectivesTaken.get(params.playerId) ?? 0,
      botDifficulty: this.botDifficulty,
    };
  }
}
