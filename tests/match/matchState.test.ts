import { describe, expect, it } from "vitest";
import { MatchState } from "@/match/MatchState";
import { HERO_SLOTS_PER_TEAM } from "@/utils/constants";

describe("MatchState", () => {
  it("reserves five hero slots per team", () => {
    const state = new MatchState();
    expect(state.teams.highland.heroSlots).toHaveLength(HERO_SLOTS_PER_TEAM);
    expect(state.teams.crown.heroSlots).toHaveLength(HERO_SLOTS_PER_TEAM);
  });
});
