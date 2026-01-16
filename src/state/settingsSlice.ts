import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { DEFAULT_KEYBINDS, normalizeKeybind } from "../content/keybinds";

export type KeybindsState = Record<string, string>;

type SettingsState = {
  keybinds: KeybindsState;
};

const normalizeSavedKeybinds = (saved: unknown) => {
  if (!saved || typeof saved !== "object") {
    return null;
  }
  const normalized: KeybindsState = {};
  Object.keys(DEFAULT_KEYBINDS).forEach((actionId) => {
    const value = normalizeKeybind((saved as Record<string, unknown>)[actionId]);
    if (value) {
      normalized[actionId] = value;
    }
  });
  return Object.keys(normalized).length ? normalized : null;
};

const mergeKeybinds = (saved: unknown) => {
  const normalized = normalizeSavedKeybinds(saved);
  if (!normalized) {
    return { ...DEFAULT_KEYBINDS };
  }
  return { ...DEFAULT_KEYBINDS, ...normalized };
};

const initialState: SettingsState = {
  keybinds: mergeKeybinds(null)
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    hydrateKeybinds(state, action: PayloadAction<unknown>) {
      state.keybinds = mergeKeybinds(action.payload);
    },
    updateKeybind(state, action: PayloadAction<{ actionId: string; key: string }>) {
      state.keybinds[action.payload.actionId] = action.payload.key;
    },
    resetKeybinds(state) {
      state.keybinds = { ...DEFAULT_KEYBINDS };
    }
  }
});

export const { hydrateKeybinds, resetKeybinds, updateKeybind } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

export const selectKeybinds = (state: RootState) => state.settings.keybinds;
