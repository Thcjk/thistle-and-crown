/**
 * Barracks / inhibitor-style lane structure.
 * Prototype match does not spawn barracks yet; this marks the extension point.
 */
export interface BarracksState {
  id: string;
  teamId: "highland" | "crown";
  laneId: "top" | "middle" | "bottom";
  destroyed: boolean;
}
