export type TeamId = "highland" | "crown";
export type FactionId = "highland_covenant" | "iron_crown";
export type LaneId = "top" | "middle" | "bottom";
export type MatchPhase = "loading" | "countdown" | "active" | "ended";

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
}

export interface MatchSnapshot {
  phase: MatchPhase;
  elapsedSeconds: number;
  teams: Record<TeamId, TeamState>;
  winner: TeamId | null;
}

export type SceneId =
  | "boot"
  | "mainMenu"
  | "heroSelect"
  | "match"
  | "results";

export interface AbilitySlotBinding {
  slot: "Q" | "W" | "E" | "R" | "D" | "F";
  abilityId: string;
}
