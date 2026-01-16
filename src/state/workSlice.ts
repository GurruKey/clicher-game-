import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";

type WorkState = {
  isWorking: boolean;
  startedAtMs: number | null;
  durationMs: number;
  locationId: string | null;
  fromLocationId: string | null;
  isReturning: boolean;
  abilityId: string | null;
};

const initialState: WorkState = {
  isWorking: false,
  startedAtMs: null,
  durationMs: 0,
  locationId: null,
  fromLocationId: null,
  isReturning: false,
  abilityId: null
};

const workSlice = createSlice({
  name: "work",
  initialState,
  reducers: {
    startWork(
      state,
      action: PayloadAction<{ 
        startedAtMs: number; 
        durationMs: number; 
        locationId: string | null;
        fromLocationId?: string | null;
        isReturning?: boolean;
        abilityId?: string | null;
      }>
    ) {
      const startedAtMs = Number(action.payload?.startedAtMs);
      const durationMs = Number(action.payload?.durationMs);
      const locationId = action.payload?.locationId ?? null;

      if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return;
      if (!Number.isFinite(durationMs) || durationMs < 0) return;
      if (locationId !== null && (typeof locationId !== "string" || locationId.length === 0)) return;

      state.isWorking = true;
      state.startedAtMs = startedAtMs;
      state.durationMs = durationMs;
      state.locationId = locationId;
      state.fromLocationId = action.payload?.fromLocationId ?? null;
      state.isReturning = action.payload?.isReturning ?? false;
      state.abilityId = action.payload?.abilityId ?? null;
    },
    finishWork(state) {
      state.isWorking = false;
      state.startedAtMs = null;
      state.durationMs = 0;
      state.locationId = null;
      state.abilityId = null;
    },
    resetWork(state) {
      state.isWorking = initialState.isWorking;
      state.startedAtMs = initialState.startedAtMs;
      state.durationMs = initialState.durationMs;
      state.locationId = initialState.locationId;
      state.fromLocationId = initialState.fromLocationId;
      state.isReturning = initialState.isReturning;
      state.abilityId = initialState.abilityId;
    }
  }
});

export const { startWork, finishWork, resetWork } = workSlice.actions;
export const workReducer = workSlice.reducer;

export const selectWork = (state: RootState) => state.work;
