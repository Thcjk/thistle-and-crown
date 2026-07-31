import type { MapDefinition } from "@/types/data.types";
import { prototypeCamps } from "@/data/monsters/camps";

/** Compact prototype MOBA map – readable three-lane layout. */
export const highlandValeMap: MapDefinition = {
  id: "highland_vale",
  displayName: "Highland Vale",
  size: { width: 120, depth: 120 },
  cameraBounds: {
    minX: -55,
    maxX: 55,
    minZ: -55,
    maxZ: 55,
  },
  bases: {
    highland: {
      spawn: { x: -42, y: 0, z: -42 },
      core: { x: -46, y: 0, z: -46 },
      healRadius: 8,
    },
    crown: {
      spawn: { x: 42, y: 0, z: 42 },
      core: { x: 46, y: 0, z: 46 },
      healRadius: 8,
    },
  },
  towers: [
    { id: "tower_highland_top", teamId: "highland", laneId: "top", position: { x: -28, y: 0, z: 10 } },
    { id: "tower_highland_mid", teamId: "highland", laneId: "middle", position: { x: -18, y: 0, z: -18 } },
    { id: "tower_highland_bot", teamId: "highland", laneId: "bottom", position: { x: 10, y: 0, z: -28 } },
    { id: "tower_crown_top", teamId: "crown", laneId: "top", position: { x: -10, y: 0, z: 28 } },
    { id: "tower_crown_mid", teamId: "crown", laneId: "middle", position: { x: 18, y: 0, z: 18 } },
    { id: "tower_crown_bot", teamId: "crown", laneId: "bottom", position: { x: 28, y: 0, z: -10 } },
  ],
  lanes: [
    {
      laneId: "top",
      teamId: "highland",
      points: [
        { x: -42, y: 0, z: -30 },
        { x: -40, y: 0, z: 0 },
        { x: -35, y: 0, z: 25 },
        { x: -20, y: 0, z: 38 },
        { x: 0, y: 0, z: 42 },
        { x: 30, y: 0, z: 42 },
        { x: 42, y: 0, z: 42 },
      ],
    },
    {
      laneId: "top",
      teamId: "crown",
      points: [
        { x: 42, y: 0, z: 30 },
        { x: 40, y: 0, z: 0 },
        { x: 35, y: 0, z: -25 },
        { x: 20, y: 0, z: -38 },
        { x: 0, y: 0, z: -42 },
        { x: -30, y: 0, z: -42 },
        { x: -42, y: 0, z: -42 },
      ],
    },
    {
      laneId: "middle",
      teamId: "highland",
      points: [
        { x: -40, y: 0, z: -40 },
        { x: -25, y: 0, z: -25 },
        { x: -10, y: 0, z: -10 },
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 10 },
        { x: 25, y: 0, z: 25 },
        { x: 40, y: 0, z: 40 },
      ],
    },
    {
      laneId: "middle",
      teamId: "crown",
      points: [
        { x: 40, y: 0, z: 40 },
        { x: 25, y: 0, z: 25 },
        { x: 10, y: 0, z: 10 },
        { x: 0, y: 0, z: 0 },
        { x: -10, y: 0, z: -10 },
        { x: -25, y: 0, z: -25 },
        { x: -40, y: 0, z: -40 },
      ],
    },
    {
      laneId: "bottom",
      teamId: "highland",
      points: [
        { x: -30, y: 0, z: -42 },
        { x: 0, y: 0, z: -42 },
        { x: 20, y: 0, z: -38 },
        { x: 35, y: 0, z: -25 },
        { x: 40, y: 0, z: 0 },
        { x: 42, y: 0, z: 30 },
        { x: 42, y: 0, z: 42 },
      ],
    },
    {
      laneId: "bottom",
      teamId: "crown",
      points: [
        { x: 30, y: 0, z: 42 },
        { x: 0, y: 0, z: 42 },
        { x: -20, y: 0, z: 38 },
        { x: -35, y: 0, z: 25 },
        { x: -40, y: 0, z: 0 },
        { x: -42, y: 0, z: -30 },
        { x: -42, y: 0, z: -42 },
      ],
    },
  ],
  monsterCamps: prototypeCamps,
  obstacles: [
    { id: "rock_a", position: { x: -8, y: 0, z: 16 }, radius: 2.5 },
    { id: "rock_b", position: { x: 8, y: 0, z: -16 }, radius: 2.5 },
    { id: "ruin_wall", position: { x: 0, y: 0, z: 22 }, radius: 3 },
    { id: "stone_circle", position: { x: -22, y: 0, z: -6 }, radius: 2.2 },
    { id: "bridge_pillar", position: { x: 0, y: 0, z: 0 }, radius: 1.8 },
  ],
  bushes: [
    { id: "bush_top_jungle", position: { x: -14, y: 0, z: 14 }, radius: 3.5 },
    { id: "bush_bot_jungle", position: { x: 14, y: 0, z: -14 }, radius: 3.5 },
    { id: "bush_mid_left", position: { x: -12, y: 0, z: -4 }, radius: 2.8 },
    { id: "bush_mid_right", position: { x: 12, y: 0, z: 4 }, radius: 2.8 },
    { id: "bush_bot_lane", position: { x: 24, y: 0, z: -22 }, radius: 3 },
  ],
  laneGates: [
    { id: "gate_highland_top", teamId: "highland", laneId: "top", position: { x: -32, y: 0, z: 18 } },
    { id: "gate_highland_mid", teamId: "highland", laneId: "middle", position: { x: -24, y: 0, z: -24 } },
    { id: "gate_highland_bot", teamId: "highland", laneId: "bottom", position: { x: 18, y: 0, z: -32 } },
    { id: "gate_crown_top", teamId: "crown", laneId: "top", position: { x: -18, y: 0, z: 32 } },
    { id: "gate_crown_mid", teamId: "crown", laneId: "middle", position: { x: 24, y: 0, z: 24 } },
    { id: "gate_crown_bot", teamId: "crown", laneId: "bottom", position: { x: 32, y: 0, z: -18 } },
  ],
};
