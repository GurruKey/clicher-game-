import { describe, expect, it } from "vitest";
import { getBuffBonuses } from "../src/systems/abilities/buffs";
import { STAMINA_BUFF_EFFECT, HEALTH_DEBUFF_EFFECT } from "../src/content/abilities/stamina_health_buff";

describe("buffs: stamina health bonus", () => {
  it("buff effect adds max stamina", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_BUFF_EFFECT, HEALTH_DEBUFF_EFFECT];

    const result = getBuffBonuses({
      abilities,
      buffsById: { [STAMINA_BUFF_EFFECT.id]: { stacks: 1, expiresAtMs: now + 10_000 } },
      nowMs: now
    });

    expect(result.resourceBonuses.max_stamina).toBe(50);
    // Buff shouldn't affect max health
    expect(result.resourceBonuses.max_health).toBeUndefined();
  });

  it("debuff effect reduces max health", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_BUFF_EFFECT, HEALTH_DEBUFF_EFFECT];

    const result = getBuffBonuses({
      abilities,
      buffsById: { [HEALTH_DEBUFF_EFFECT.id]: { stacks: 1, expiresAtMs: now + 10_000 } },
      nowMs: now
    });

    expect(result.resourceBonuses.max_health).toBe(-50);
    // Debuff shouldn't affect max stamina
    expect(result.resourceBonuses.max_stamina).toBeUndefined();
  });

  it("both effects work together", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_BUFF_EFFECT, HEALTH_DEBUFF_EFFECT];

    const result = getBuffBonuses({
      abilities,
      buffsById: {
        [STAMINA_BUFF_EFFECT.id]: { stacks: 1, expiresAtMs: now + 10_000 },
        [HEALTH_DEBUFF_EFFECT.id]: { stacks: 1, expiresAtMs: now + 10_000 }
      },
      nowMs: now
    });

    expect(result.resourceBonuses.max_stamina).toBe(50);
    expect(result.resourceBonuses.max_health).toBe(-50);
  });
});
