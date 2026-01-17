import { describe, expect, it } from "vitest";
import { getBuffBonuses } from "../src/systems/abilities/buffs";
import { STAMINA_HEALTH_BUFF_ABILITY } from "../src/content/abilities/stamina_health_buff";

describe("buffs: stamina health bonus", () => {
  it("adds stamina and reduces max health", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_HEALTH_BUFF_ABILITY];

    const result = getBuffBonuses({
      abilities,
      buffsById: { [STAMINA_HEALTH_BUFF_ABILITY.id]: { stacks: 1, expiresAtMs: now + 10_000 } },
      nowMs: now
    });

    expect(result.statBonuses.stamina).toBe(50);
    expect(result.resourceBonuses.max_health).toBe(-50);
  });

  it("ignores expired buff", () => {
    const now = 1_000_000;
    const abilities = [STAMINA_HEALTH_BUFF_ABILITY];

    const result = getBuffBonuses({
      abilities,
      buffsById: { [STAMINA_HEALTH_BUFF_ABILITY.id]: { stacks: 1, expiresAtMs: now - 1 } },
      nowMs: now
    });

    expect(result.statBonuses.stamina).toBeUndefined();
    expect(result.resourceBonuses.max_health).toBeUndefined();
  });
});
