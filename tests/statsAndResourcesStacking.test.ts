import { describe, expect, it } from "vitest";
import { getDefaultPerkIdsForAvatarId } from "../src/systems/player/avatarMeta";
import { selectCalculatedStats } from "../src/state/statsDerive";
import { selectResourcesMaxById } from "../src/state/resourcesSelectors";

describe("stats/resources stacking (srcold parity)", () => {
  it("stacks avatar stats from race+origin+faction", () => {
    const perkIds = getDefaultPerkIdsForAvatarId("mystic");
    const state = { player: { avatarId: "mystic", perkIds } } as any;

    expect(selectCalculatedStats(state)).toEqual({
      agility: 9,
      armor: 0,
      intellect: 9,
      stamina: 1,
      strength: 9
    });
  });

  it("calculates max resources from base values (no modifiers yet)", () => {
    const perkIds = getDefaultPerkIdsForAvatarId("mystic");
    const state = { player: { avatarId: "mystic", perkIds } } as any;

    expect(selectResourcesMaxById(state)).toEqual({
      max_health: 100,
      max_mana: 100,
      max_stamina: 100
    });
  });

  it("unlocks max_health for human via Life perk", () => {
    const perkIds = getDefaultPerkIdsForAvatarId("human_man");
    const state = { player: { avatarId: "human_man", perkIds } } as any;

    expect(selectResourcesMaxById(state)).toEqual({
      max_mana: 100,
      max_stamina: 100,
      max_health: 100
    });
  });
});
