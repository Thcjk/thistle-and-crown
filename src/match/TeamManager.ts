import type { MatchState } from "./MatchState";
import type { TeamId } from "@/types/game.types";

export class TeamManager {
  constructor(private readonly state: MatchState) {}

  assignHeroSlot(teamId: TeamId, heroId: string): void {
    const slots = this.state.teams[teamId].heroSlots;
    const index = slots.findIndex((s) => s === null);
    if (index >= 0) {
      slots[index] = heroId;
    }
  }

  registerKill(killerTeam: TeamId, victimTeam: TeamId): void {
    this.state.teams[killerTeam].kills += 1;
    this.state.teams[victimTeam].deaths += 1;
  }

  registerTowerDestroyed(attackerTeam: TeamId): void {
    this.state.teams[attackerTeam].towersDestroyed += 1;
  }

  registerLaneGateDestroyed(attackerTeam: TeamId): void {
    this.state.teams[attackerTeam].laneGatesDestroyed += 1;
  }
}
