import { describe, expect, it } from "vitest";
import { validateHeroDefinition } from "@/utils/validation";
import { brennaStonehand } from "@/data/heroes/brennaStonehand";

describe("validation", () => {
  it("accepts Brenna definition", () => {
    expect(validateHeroDefinition(brennaStonehand)).toEqual([]);
  });

  it("rejects empty hero ids", () => {
    const errors = validateHeroDefinition({
      ...brennaStonehand,
      id: "",
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
