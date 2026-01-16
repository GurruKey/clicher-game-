import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { CURRENCIES } from "../content/currencies/index.js";
import { deleteFromInventory } from "../systems/inventory/deleteFromInventory";
import { applyItemEffects } from "../systems/items/applyItemEffects";
import { applyDelta } from "./resourcesSlice";
import { setInventory } from "./inventorySlice";
import { deriveResourcesConfig } from "./resourcesDerive";
import { calculateFinalResources } from "../systems/resources/calculateFinalResources";
import { STATS } from "../content/stats/index.js";
import type { CalcNodeDefinition } from "../systems/calc/calcEngine";
import { selectCalculatedStatsFromRoot } from "./statsDerive";
import { addKnownAbilityIds, setSkillsUnlocked } from "./playerSlice";
import { ABILITIES } from "../content/abilities/index.js";

export const useItemFromVisibleIndex = createAsyncThunk<
  void,
  { slotIndex: number; baseSlotCount: number },
  { state: RootState }
>("inventory/useItemFromVisibleIndex", async ({ slotIndex, baseSlotCount }, thunkApi) => {
  const state = thunkApi.getState();
  const inventory = state.inventory;
  const equippedBagId = inventory.equippedBagId;
  const isBase = slotIndex < baseSlotCount;
  const localIndex = isBase ? slotIndex : slotIndex - baseSlotCount;
  const slot = isBase
    ? inventory.baseSlots[localIndex] ?? null
    : equippedBagId
      ? inventory.bagSlotsById[equippedBagId]?.[localIndex] ?? null
      : null;

  if (!slot) return;

  const itemData = (CURRENCIES as Record<string, { id: string; effects?: unknown }>)[slot.id];
  if (!itemData) return;

  const result = applyItemEffects({ id: itemData.id, effects: itemData.effects });
  const delta = result.resourcesDelta;
  const hasNonResourceEffects = result.unlockSkills || result.learnAllAbilities || result.learnAbilityIds.length > 0;
  const hasResourceEffects = Object.keys(delta).length > 0;
  if (!hasResourceEffects && !hasNonResourceEffects) return;

  if (hasResourceEffects) {
    const calculatedStats = selectCalculatedStatsFromRoot(state);
    const { activeDefs } = deriveResourcesConfig(state.player.perkIds);
    const maxById = calculateFinalResources(
      calculatedStats,
      activeDefs,
      STATS as unknown as CalcNodeDefinition[],
      {}
    );

    thunkApi.dispatch(applyDelta({ delta, maxById }));
  }

  if (result.unlockSkills) {
    thunkApi.dispatch(setSkillsUnlocked(true));
  }
  const allAbilityIds = result.learnAllAbilities ? (ABILITIES as any[]).map((a) => String(a.id)) : [];
  const learnIds = [...result.learnAbilityIds, ...allAbilityIds].filter((id) => typeof id === "string" && id.length > 0);
  if (learnIds.length > 0) {
    thunkApi.dispatch(addKnownAbilityIds(learnIds));
  }

  const afterDelete = deleteFromInventory({
    snapshot: inventory,
    container: isBase ? "base" : "bag",
    slotIndex: localIndex,
    amount: 1
  });
  if (afterDelete.changed) {
    thunkApi.dispatch(setInventory(afterDelete.next));
  }
});
