import type { EventBus } from "@/engine/EventBus";
import type { CoreStructure } from "@/entities/structures/CoreStructure";
import type { MatchState } from "./MatchState";
import type { TeamId } from "@/types/game.types";

export class VictorySystem {
  constructor(
    private readonly events: EventBus,
    private readonly state: MatchState,
  ) {}

  check(cores: CoreStructure[]): TeamId | null {
    if (this.state.phase === "ended") return this.state.winner;
    for (const core of cores) {
      if (core.dead || core.stats.currentHealth <= 0) {
        const winner: TeamId = core.teamId === "highland" ? "crown" : "highland";
        this.state.winner = winner;
        this.state.phase = "ended";
        this.events.emit("coreDestroyed", {
          coreId: core.id,
          teamId: core.teamId,
        });
        this.events.emit("matchEnded", { winner });
        return winner;
      }
    }
    return null;
  }
}
