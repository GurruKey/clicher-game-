import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { normalizeDiscoveries, recordDropInDiscovery, type Discoveries } from "../systems/loot/drops";

type LootState = {
  discoveries: Discoveries;
};

const initialState: LootState = {
  discoveries: {}
};

const lootSlice = createSlice({
  name: "loot",
  initialState,
  reducers: {
    setLocationDrops(state, action: PayloadAction<unknown>) {
      state.discoveries = normalizeDiscoveries(action.payload);
    },
    recordLocationDrop(state, action: PayloadAction<{ locationId: string, itemId: string }>) {
      state.discoveries = recordDropInDiscovery(
        state.discoveries,
        action.payload.locationId,
        action.payload.itemId
      );
    },
    resetLocationDrops(state) {
      state.discoveries = {};
    }
  }
});

export const { recordLocationDrop, resetLocationDrops, setLocationDrops } = lootSlice.actions;
export const lootReducer = lootSlice.reducer;

/**
 * Возвращает все данные об открытиях для сохранения.
 */
export const selectAllDiscoveries = (state: RootState) => state.loot.discoveries;

/**
 * Алиас для совместимости с store.ts (сохранение всей структуры).
 */
export const selectLocationDrops = selectAllDiscoveries;

/**
 * Возвращает данные об открытиях конкретной локации.
 */
export const selectDiscoveryByLocationId = (state: RootState, locationId: string) => 
  state.loot.discoveries[locationId] ?? { total: 0, items: {} };
