import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { LOCATIONS } from "../content/locations/index.js";
import { DEFAULT_LOCATION_ID } from "../content/locations/index.js";
import { recordLocationDrop, recordEncounterAction, recordAttemptAction, markAsKnown } from "./lootSlice";
import { consume } from "./resourcesSlice";
import { placeItemInCurrentContainer } from "./inventorySlice";
import { CURRENCIES } from "../content/currencies/index.js";
import { addNotice } from "./lootNoticesSlice";
import { selectLocationId } from "./playerSlice";
import { selectAbilityToggledById } from "./playerSlice";
import { spawnMob } from "./combatThunks";
import { ABILITIES } from "../content/abilities/index.js";
import { getActiveAuraModifiers } from "../systems/abilities/auras";

export const startWorkAtLocation = createAsyncThunk<
  boolean,
  { locationId?: string },
  { state: RootState }
>("loot/startWorkAtLocation", async ({ locationId }, thunkApi) => {
  const state = thunkApi.getState();
  const id = locationId ?? selectLocationId(state) ?? DEFAULT_LOCATION_ID;
  const location = (LOCATIONS as Record<string, any>)[id];
  if (!location) return false;

  const resourceId: string = location.requiredResourceId || "max_stamina";
  const baseCost: number = Number(location.resourceCost ?? 1);
  if (!Number.isFinite(baseCost) || baseCost <= 0) return false;

  const auraMods = getActiveAuraModifiers({
    abilities: ABILITIES as any[],
    enabledById: (selectAbilityToggledById(state) as any) ?? {}
  });
  const resourceCost =
    resourceId === "max_stamina"
      ? Math.max(0, baseCost * Number(auraMods.staminaCostMultiplier ?? 1))
      : baseCost;
  if (!Number.isFinite(resourceCost) || resourceCost <= 0) return false;

  const current = state.resources.current[resourceId] ?? 0;
  if (current < resourceCost) return false;

  thunkApi.dispatch(consume({ id: resourceId, amount: resourceCost }));
  thunkApi.dispatch(recordAttemptAction({ locationId: id }));
  return true;
});

export const finishWorkAtLocation = createAsyncThunk<
  void,
  { locationId?: string; roll?: number },
  { state: RootState }
>("loot/finishWorkAtLocation", async ({ locationId, roll }, thunkApi) => {
  const state = thunkApi.getState();
  const id = locationId ?? selectLocationId(state) ?? DEFAULT_LOCATION_ID;
  const location = (LOCATIONS as Record<string, any>)[id];
  if (!location) return;

  // 1. Check for Mob Encounter
  const encounterChance = Number(location.encounterChance ?? 0);
  const encounterRoll = Math.random() * 100;
  
  // Specific logic for testing_grounds hardcoded spawn (or use config if available)
  // We prefer using the config 'encounterChance'
  if (encounterRoll < encounterChance || (id === "testing_grounds" && encounterRoll < 30)) {
    // Determine which mob to spawn. For now, hardcoded rat for testing_grounds
    // In future, pick from location.mobs table
    const mobId = "rat"; 
    
    thunkApi.dispatch(recordEncounterAction({ locationId: id, mobId }));
    thunkApi.dispatch(spawnMob(mobId));
    return; // STOP: No loot if encounter happened
  }

  // 2. Roll for Location Loot (Independent Rolls)
  if (!location.lootTable) return;

  for (const item of location.lootTable) {
    const itemRoll = Math.random() * 100;
    if (itemRoll <= item.chance) {
      const lootId = item.id;
      const maxStackRaw = (CURRENCIES as Record<string, { maxStack?: unknown }>)[lootId]?.maxStack;
      const maxStack = Number(maxStackRaw);
      
      thunkApi.dispatch(
        placeItemInCurrentContainer({
          itemId: lootId,
          amount: 1,
          maxStack: Number.isFinite(maxStack) && maxStack > 0 ? maxStack : 1
        })
      );

      // Auto-pickup => Mark as known immediately
      thunkApi.dispatch(markAsKnown(lootId));

      const lootMeta = (CURRENCIES as Record<string, any>)[lootId];
      thunkApi.dispatch(
        addNotice({
          name: lootMeta?.name ?? lootId,
          icon: lootMeta?.icon,
          rarity: lootMeta?.rarity ?? "common",
          label: "Found"
        })
      );

      thunkApi.dispatch(recordLocationDrop({ locationId: id, itemId: lootId, source: "location" }));
    }
  }
});

export const performLootAtLocation = createAsyncThunk<
  void,
  { locationId?: string; roll?: number },
  { state: RootState }
>("loot/performAtLocation", async ({ locationId, roll }, thunkApi) => {
  const ok = await thunkApi.dispatch(startWorkAtLocation({ locationId })).unwrap();
  if (!ok) return;
  await thunkApi.dispatch(finishWorkAtLocation({ locationId, roll })).unwrap();
});
