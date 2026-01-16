import { describe, expect, it } from "vitest";
import { pickLootByChance, sumLootChance, type LootTable } from "../src/systems/loot/loot";

describe("loot", () => {
  it("sums loot chance with clamping", () => {
    const lootTable: LootTable = [
      { id: "a", chance: 10 },
      { id: "b", chance: -5 },
      { id: "c", chance: 2 }
    ];

    expect(sumLootChance(lootTable)).toBe(12);
  });

  it("picks by deterministic roll", () => {
    const lootTable: LootTable = [
      { id: "a", chance: 50 },
      { id: "b", chance: 50 }
    ];

    expect(pickLootByChance(lootTable, 0)).toBe("a");
    expect(pickLootByChance(lootTable, 49.999)).toBe("a");
    expect(pickLootByChance(lootTable, 50)).toBe("b");
    expect(pickLootByChance(lootTable, 99.999)).toBe("b");
    expect(pickLootByChance(lootTable, 100)).toBe(null);
  });

  it("returns null for empty tables", () => {
    expect(pickLootByChance(null, 0)).toBe(null);
    expect(pickLootByChance([], 0)).toBe(null);
  });
});

