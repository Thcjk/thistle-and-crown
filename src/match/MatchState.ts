import type { MatchPhase, MatchSnapshot, TeamId, TeamState } from "@/types/game.types";
import { HERO_SLOTS_PER_TEAM, MATCH_COUNTDOWN_SECONDS } from "@/utils/constants";

export class MatchState {
  phase: MatchPhase = "loading";
  elapsedSeconds = 0;
  countdownSeconds = MATCH_COUNTDOWN_SECONDS;
  winner: TeamId | null = null;
  waveIndex = 0;
  teams: Record<TeamId, TeamState> = {
    highland: {
      teamId: "highland",
      factionId: "highland_covenant",
      heroSlots: Array.from({ length: HERO_SLOTS_PER_TEAM }, () => null),
      kills: 0,
      deaths: 0,
      towersDestroyed: 0,
      laneGatesDestroyed: 0,
    },
    crown: {
      teamId: "crown",
      factionId: "iron_crown",
      heroSlots: Array.from({ length: HERO_SLOTS_PER_TEAM }, () => null),
      kills: 0,
      deaths: 0,
      towersDestroyed: 0,
      laneGatesDestroyed: 0,
    },
  };

  snapshot(): MatchSnapshot {
    return {
      phase: this.phase,
      elapsedSeconds: this.elapsedSeconds,
      countdownSeconds: this.countdownSeconds,
      teams: {
        highland: { ...this.teams.highland, heroSlots: [...this.teams.highland.heroSlots] },
        crown: { ...this.teams.crown, heroSlots: [...this.teams.crown.heroSlots] },
      },
      winner: this.winner,
    };
  }
}
