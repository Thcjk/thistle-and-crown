export type TeamId = "highland" | "crown";
export type FactionId = "highland_covenant" | "iron_crown";
export type LaneId = "top" | "middle" | "bottom";
export type MatchPhase = "loading" | "countdown" | "active" | "ended";
export type BotDifficulty = "easy" | "normal" | "hard";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TeamState {
  teamId: TeamId;
  factionId: FactionId;
  heroSlots: Array<string | null>;
  kills: number;
  deaths: number;
  towersDestroyed: number;
  laneGatesDestroyed: number;
}

export interface MatchSnapshot {
  phase: MatchPhase;
  elapsedSeconds: number;
  countdownSeconds: number;
  teams: Record<TeamId, TeamState>;
  winner: TeamId | null;
}

export type SceneId =
  | "boot"
  | "mainMenu"
  | "heroSelect"
  | "tutorial"
  | "match"
  | "results";

export interface AbilitySlotBinding {
  slot: "Q" | "W" | "E" | "R" | "D" | "F";
  abilityId: string;
}

/** End-of-match stats for the player hero. */
export interface MatchResultStats {
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
  damageDealt: number;
  damageTaken: number;
  towersDestroyed: number;
  objectivesTaken: number;
  botDifficulty: BotDifficulty;
}
