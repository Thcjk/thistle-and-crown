/**
 * Wave spawning is centralized in MatchManager so timers stay authoritative.
 * This module documents the intended spawner API for future multiplayer sync.
 */
export interface MinionWaveRequest {
  waveIndex: number;
  includeBanner: boolean;
}
