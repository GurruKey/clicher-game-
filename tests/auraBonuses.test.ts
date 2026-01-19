import { describe, expect, it } from "vitest";
import { getBuffBonuses } from "../src/systems/abilities/buffs";
import { STAMINA_AURA_ABILITY } from "../src/content/abilities/stamina_aura";

describe("aura bonuses", () => {
  it("provides bonuses when enabled", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_AURA_ABILITY];
    
    // Test when enabled
    const resultEnabled = getBuffBonuses({
      abilities,
      buffsById: {},
      enabledById: { [STAMINA_AURA_ABILITY.id]: true },
      nowMs: now
    });

    expect(resultEnabled.statBonuses.stamina).toBe(10);
  });

  it("does not provide bonuses when disabled", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_AURA_ABILITY];
    
    // Test when disabled
    const resultDisabled = getBuffBonuses({
      abilities,
      buffsById: {},
      enabledById: {}, // or { [id]: false }
      nowMs: now
    });

    expect(resultDisabled.statBonuses.stamina).toBeUndefined();
  });
});
