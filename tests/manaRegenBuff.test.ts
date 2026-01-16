import { describe, expect, it } from "vitest";
import { getManaRegenBonusFromBuffs } from "../src/systems/abilities/buffs";

describe("buffs: mana regen bonus", () => {
  it("adds +1 mana regen per stack (active only)", () => {
    const now = 1_000_000;
    const abilities = [
      { id: "mana_regen_buff", kind: "buff", manaRegenPerStack: 1 }
    ];

    expect(
      getManaRegenBonusFromBuffs({
        abilities,
        buffsById: { mana_regen_buff: { stacks: 3, expiresAtMs: now + 10_000 } },
        nowMs: now
      })
    ).toBe(3);

    expect(
      getManaRegenBonusFromBuffs({
        abilities,
        buffsById: { mana_regen_buff: { stacks: 3, expiresAtMs: now - 1 } },
        nowMs: now
      })
    ).toBe(0);
  });
});

