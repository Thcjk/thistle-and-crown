import { describe, expect, it } from "vitest";
import { AssistSystem } from "@/combat/AssistSystem";

describe("AssistSystem", () => {
  it("returns recent contributors excluding the killer", () => {
    const assists = new AssistSystem();
    assists.recordDamage("victim", "helper_a", 10);
    assists.recordDamage("victim", "killer", 11);
    assists.recordDamage("victim", "helper_b", 12);
    const result = assists.collectAssists("victim", "killer", 15);
    expect(result.sort()).toEqual(["helper_a", "helper_b"]);
  });

  it("ignores stale contributions", () => {
    const assists = new AssistSystem();
    assists.recordDamage("victim", "old_helper", 0);
    const result = assists.collectAssists("victim", "killer", 20);
    expect(result).toEqual([]);
  });
});
