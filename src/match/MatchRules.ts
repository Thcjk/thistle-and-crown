import type { LaneId } from "@/types/game.types";

export const MatchRules = {
  recallChannelSeconds: 5,
  shopRequiresBase: true,
  prototypeHeroCount: 2,
  /** All three lanes spawn waves in the MOBA core loop. */
  activeLanesForWaves: ["top", "middle", "bottom"] as LaneId[],
  visualLanes: ["top", "middle", "bottom"] as LaneId[],
  attackMoveScanRange: 7,
  lastHitOnlyGold: true,
};
