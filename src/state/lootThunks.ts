import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { LOCATIONS } from "../content/locations/index.js";
import { DEFAULT_LOCATION_ID } from "../content/locations/index.js";
import { pickLootByChance } from "../systems/loot/loot";
import { recordLocationDrop } from "./lootSlice";
import { consume } from "./resourcesSlice";
import { placeItemInCurrentContainer } from "./inventorySlice";
import { CURRENCIES } from "../content/currencies/index.js";
import { addNotice } from "./lootNoticesSlice";
import { selectLocationId } from "./playerSlice";
import { selectAbilityToggledById } from "./playerSlice";
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

  const lootId = pickLootByChance(location.lootTable, roll ?? Math.random() * 100);
  if (!lootId) return;

  const maxStackRaw = (CURRENCIES as Record<string, { maxStack?: unknown }>)[lootId]?.maxStack;
  const maxStack = Number(maxStackRaw);
  thunkApi.dispatch(
    placeItemInCurrentContainer({
      itemId: lootId,
      amount: 1,
      maxStack: Number.isFinite(maxStack) && maxStack > 0 ? maxStack : 1
    })
  );

  const loot = (CURRENCIES as Record<string, any>)[lootId];
  thunkApi.dispatch(
    addNotice({
      name: loot?.name ?? lootId,
      icon: loot?.icon,
      rarity: loot?.rarity ?? "common",
      label: "Found"
    })
  );

  thunkApi.dispatch(recordLocationDrop({ locationId: id, itemId: lootId }));
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
