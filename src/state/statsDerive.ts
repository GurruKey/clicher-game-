import { createSelector } from "@reduxjs/toolkit";
import { STATS } from "../content/stats/index.js";
import { ABILITIES } from "../content/abilities/index.js";
import type { RootState } from "../app/store";
import { selectAbilityBuffsById, selectPerkIds } from "./playerSlice";
import { getPerkById } from "../content/perks/index.js";
import { getFactionStats } from "../content/factions_variants/index.js";
import { getOriginStats } from "../content/origins_variants/index.js";
import { getRaceVariantStats } from "../content/race_variants/index.js";
import { aggregateBaseValues, calculateFinalValues, type CalcNodeDefinition } from "../systems/calc/calcEngine";
import { selectSelectedAvatar } from "./avatarSelectors";
import { getBuffBonuses } from "../systems/abilities/buffs";

export const selectCalculatedStats = createSelector(
  [selectSelectedAvatar, selectPerkIds, selectAbilityBuffsById],
  (selectedAvatar, perkIds, abilityBuffsById): Record<string, number> => {
    const sources: unknown[] = [
      selectedAvatar ? getRaceVariantStats((selectedAvatar as { raceVariantId?: unknown }).raceVariantId as string) : null,
      selectedAvatar
        ? getOriginStats(
            (selectedAvatar as { origin?: unknown }).origin as string,
            Number((selectedAvatar as { originLevel?: unknown }).originLevel ?? 1)
          )
        : null,
      selectedAvatar
        ? getFactionStats(
            (selectedAvatar as { faction?: unknown }).faction as string,
            Number((selectedAvatar as { factionLevel?: unknown }).factionLevel ?? 1)
          )
        : null
    ];
    for (const perkId of perkIds) {
      if (typeof perkId !== "string") continue;
      const perk = getPerkById(perkId);
      if (!perk) continue;
      sources.push((perk as { stats?: unknown }).stats ?? null);
    }

    const buffBonuses = getBuffBonuses({
      abilities: ABILITIES,
      buffsById: abilityBuffsById,
      nowMs: Date.now()
    });
    sources.push(buffBonuses.statBonuses);

    const baseValues = aggregateBaseValues(sources);
    return calculateFinalValues(STATS as unknown as CalcNodeDefinition[], baseValues);
  }
);

export const selectCalculatedStatsFromRoot = (state: RootState) => selectCalculatedStats(state);
