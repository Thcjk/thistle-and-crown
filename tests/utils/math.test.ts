import { describe, expect, it } from "vitest";
import { clamp, distance2D, isInCone, moveTowards, normalize2D } from "@/utils/math";

describe("math", () => {
  it("clamps values", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it("computes 2d distance", () => {
    expect(distance2D({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  it("normalizes vectors", () => {
    const n = normalize2D(3, 4);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.z).toBeCloseTo(0.8);
  });

  it("moves toward a point", () => {
    const result = moveTowards({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2);
    expect(result.position.x).toBeCloseTo(2);
    expect(result.arrived).toBe(false);
  });

  it("detects cone membership", () => {
    const origin = { x: 0, y: 0, z: 0 };
    const ahead = { x: 0, y: 0, z: 2 };
    expect(isInCone(origin, 0, ahead, 3, Math.PI / 4)).toBe(true);
    const side = { x: 2, y: 0, z: 0 };
    expect(isInCone(origin, 0, side, 3, Math.PI / 8)).toBe(false);
  });
});
