import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";

export type LootNotice = {
  id: string;
  name: string;
  icon?: string;
  rarity?: string;
  label?: string;
  visible: boolean;
};

type LootNoticesState = {
  items: LootNotice[];
  max: number;
  hideDelayMs: number;
  clearDelayMs: number;
};

const initialState: LootNoticesState = {
  items: [],
  max: 5,
  hideDelayMs: 2500,
  clearDelayMs: 3000
};

const lootNoticesSlice = createSlice({
  name: "lootNotices",
  initialState,
  reducers: {
    addNotice: {
      reducer(state, action: PayloadAction<LootNotice>) {
        state.items = [action.payload, ...state.items].slice(0, state.max);
      },
      prepare(payload: Omit<LootNotice, "id" | "visible"> & { id?: string }) {
        return {
          payload: {
            ...payload,
            id: payload.id ?? `${Date.now()}-${nanoid(6)}`,
            visible: true
          }
        };
      }
    },
    hideNotice(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.map((n) => (n.id === action.payload.id ? { ...n, visible: false } : n));
    },
    clearNotice(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((n) => n.id !== action.payload.id);
    },
    clearAll(state) {
      state.items = [];
    },
    resetLootNotices(state) {
      state.items = [];
      state.max = initialState.max;
      state.hideDelayMs = initialState.hideDelayMs;
      state.clearDelayMs = initialState.clearDelayMs;
    }
  }
});

export const { addNotice, clearAll, clearNotice, hideNotice, resetLootNotices } = lootNoticesSlice.actions;
export const lootNoticesReducer = lootNoticesSlice.reducer;

export const selectLootNotices = (state: RootState) => state.lootNotices.items;
export const selectLootNoticesConfig = (state: RootState) => ({
  hideDelayMs: state.lootNotices.hideDelayMs,
  clearDelayMs: state.lootNotices.clearDelayMs
});
