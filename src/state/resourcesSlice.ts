import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import {
  addResource,
  applyRegenStep,
  consumeResource,
  type ResourceState
} from "../systems/resources/resourceState";

type ResourcesState = {
  current: ResourceState;
};

const initialState: ResourcesState = {
  current: {}
};

const resourcesSlice = createSlice({
  name: "resources",
  initialState,
  reducers: {
    setResources(state, action: PayloadAction<ResourceState>) {
      state.current = action.payload;
    },
    consume(state, action: PayloadAction<{ id: string; amount: number }>) {
      const result = consumeResource(state.current, action.payload.id, action.payload.amount);
      if (!result.ok) return;
      state.current = result.next;
    },
    add(state, action: PayloadAction<{ id: string; amount: number; max: number }>) {
      state.current = addResource(
        state.current,
        action.payload.id,
        action.payload.amount,
        action.payload.max
      );
    },
    applyDelta(
      state,
      action: PayloadAction<{ delta: Record<string, number>; maxById?: Record<string, number> }>
    ) {
      const { delta, maxById = {} } = action.payload;
      const next: ResourceState = { ...state.current };
      for (const [id, change] of Object.entries(delta)) {
        const current = next[id] ?? 0;
        const max = maxById[id] ?? Number.POSITIVE_INFINITY;
        const value = current + Number(change);
        next[id] = Math.min(max, Math.max(0, value));
      }
      state.current = next;
    },
    regenTick(state, action: PayloadAction<{ id: string; max: number; amount?: number }>) {
      state.current = applyRegenStep({
        state: state.current,
        id: action.payload.id,
        max: action.payload.max,
        amount: action.payload.amount
      });
    },
    reconcile(
      state,
      action: PayloadAction<{
        activeIds: string[];
        maxById: Record<string, number>;
        baseById?: Record<string, number>;
      }>
    ) {
      const { activeIds, maxById, baseById = {} } = action.payload;
      const active = new Set(activeIds);

      const next: ResourceState = { ...state.current };

      for (const id of activeIds) {
        const max = maxById[id] ?? baseById[id] ?? 0;
        if (next[id] === undefined) {
          next[id] = max;
        }
        // Note: We intentionally do NOT clamp next[id] > max here.
        // We allow the value to temporarily exceed the new max (e.g. after a debuff),
        // and let the regen tick drain it down gracefully.
      }

      for (const id of Object.keys(next)) {
        if (!active.has(id)) {
          delete next[id];
        }
      }

      state.current = next;
    },
    resetResources(state) {
      state.current = initialState.current;
    }
  }
});

export const { add, applyDelta, consume, regenTick, reconcile, setResources, resetResources } =
  resourcesSlice.actions;
export const resourcesReducer = resourcesSlice.reducer;

export const selectResourcesCurrent = (state: RootState) => state.resources.current;
