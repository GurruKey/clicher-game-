import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { RESOURCES } from "../content/resources/index.js";
import { STATS } from "../content/stats/index.js";
import type { CalcNodeDefinition } from "../systems/calc/calcEngine";
import { calculateFinalResources, type ResourceDefinition } from "../systems/resources/calculateFinalResources";
import { deriveResourcesConfig } from "./resourcesDerive";
import { selectCalculatedStatsFromRoot } from "./statsDerive";
import { selectAbilityBuffsById, selectPerkIds } from "./playerSlice";
import { getBuffBonuses } from "../systems/abilities/buffs";
import { ABILITIES } from "../content/abilities/index.js";

export const selectActiveResourceDefs = createSelector([selectPerkIds], (perkIds) => {
  const { activeDefs } = deriveResourcesConfig(perkIds);
  return activeDefs;
});

export const selectResourcesMaxById = createSelector(
  [selectCalculatedStatsFromRoot, selectActiveResourceDefs, selectAbilityBuffsById],
  (calculatedStats, activeDefs, abilityBuffsById) => {
    const buffBonuses = getBuffBonuses({
      abilities: ABILITIES,
      buffsById: abilityBuffsById,
      nowMs: Date.now()
    });

    return calculateFinalResources(
      calculatedStats,
      activeDefs as ResourceDefinition[],
      STATS as unknown as CalcNodeDefinition[],
      buffBonuses.resourceBonuses
    );
  }
);

export const selectResourcesView = createSelector(
  [(state: RootState) => state.resources.current, selectActiveResourceDefs, selectResourcesMaxById],
  (current, activeDefs, maxById) => {
    return activeDefs.map((def) => {
      const id = def.id;
      const max = Number(maxById[id] ?? def.base ?? 0);
      const value = Number(current[id] ?? 0);
      return {
        id,
        label: (def as any).label ?? id,
        value,
        max,
        color: (def as any).color as string | undefined,
        textColor: (def as any).textColor as string | undefined
      };
    });
  }
);
