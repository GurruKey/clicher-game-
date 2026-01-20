import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { normalizeDiscoveries, recordDrop, recordEncounter, recordAttempt, type Discoveries, createEmptyLocationDiscoveries } from "../systems/loot/drops";

type LootState = {
  discoveries: Discoveries;
  knownItemIds: string[]; // List of items the player has explicitly picked up/discovered
};

const initialState: LootState = {
  discoveries: {},
  knownItemIds: []
};

const lootSlice = createSlice({
  name: "loot",
  initialState,
  reducers: {
    setLocationDrops(state, action: PayloadAction<any>) {
      state.discoveries = normalizeDiscoveries(action.payload?.discoveries ?? action.payload);
      // Backward compatibility: if payload is old format (just discoveries), knownItemIds is empty
      // If payload is new format { discoveries, knownItemIds }, load both
      if (action.payload?.knownItemIds && Array.isArray(action.payload.knownItemIds)) {
        state.knownItemIds = action.payload.knownItemIds;
      }
    },
    markAsKnown(state, action: PayloadAction<string>) {
      const itemId = action.payload;
      if (!state.knownItemIds.includes(itemId)) {
        state.knownItemIds.push(itemId);
      }
    },
    recordLocationDrop(state, action: PayloadAction<{ locationId: string, itemId: string, source?: "location" | "mobs", mobId?: string }>) {
      state.discoveries = recordDrop(
        state.discoveries,
        action.payload.locationId,
        action.payload.itemId,
        action.payload.source || "location",
        action.payload.mobId
      );
    },
    recordEncounterAction(state, action: PayloadAction<{ locationId: string, mobId: string }>) {
      state.discoveries = recordEncounter(
        state.discoveries,
        action.payload.locationId,
        action.payload.mobId
      );
    },
    recordAttemptAction(state, action: PayloadAction<{ locationId: string }>) {
      state.discoveries = recordAttempt(
        state.discoveries,
        action.payload.locationId
      );
    },
    resetLocationDrops(state) {
      state.discoveries = {};
      state.knownItemIds = [];
    }
  }
});

export const { recordLocationDrop, resetLocationDrops, setLocationDrops, recordEncounterAction, recordAttemptAction, markAsKnown } = lootSlice.actions;
export const lootReducer = lootSlice.reducer;

/**
 * Возвращает все данные об открытиях для сохранения.
 */
export const selectAllDiscoveries = (state: RootState) => ({
  discoveries: state.loot.discoveries,
  knownItemIds: state.loot.knownItemIds
});

/**
 * Алиас для совместимости с store.ts (сохранение всей структуры).
 */
export const selectLocationDrops = selectAllDiscoveries;

export const selectKnownItemIds = (state: RootState) => state.loot.knownItemIds;

/**
 * Возвращает данные об открытиях конкретной локации.
 */
export const selectDiscoveryByLocationId = (state: RootState, locationId: string) => 
  state.loot.discoveries[locationId] ?? createEmptyLocationDiscoveries();
