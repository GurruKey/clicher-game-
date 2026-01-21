import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { DEFAULT_KEYBINDS, normalizeKeybind } from "../content/keybinds";
import type { GraphicsSettingsData } from "../persistence/graphics";

export type KeybindsState = Record<string, string>;

export type GraphicsMode = "fixed";

export type GraphicsSettings = {
  mode: GraphicsMode;
  width: number;
  height: number;
};

type SettingsState = {
  keybinds: KeybindsState;
  graphics: GraphicsSettings;
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

const DEFAULT_GRAPHICS: GraphicsSettings = {
  mode: "fixed",
  width: 1920,
  height: 1080
};

const normalizeGraphics = (saved: unknown): GraphicsSettings | null => {
  if (!saved || typeof saved !== "object") return null;
  const raw = saved as GraphicsSettingsData;
  if (raw.mode !== "fixed") return null;
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!Number.isFinite(width) || width <= 0) return null;
  if (!Number.isFinite(height) || height <= 0) return null;
  return { mode: "fixed", width, height };
};

const mergeGraphics = (saved: unknown) => {
  const normalized = normalizeGraphics(saved);
  return normalized ?? { ...DEFAULT_GRAPHICS };
};

const initialState: SettingsState = {
  keybinds: mergeKeybinds(null),
  graphics: mergeGraphics(null)
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    hydrateKeybinds(state, action: PayloadAction<unknown>) {
      state.keybinds = mergeKeybinds(action.payload);
    },
    hydrateGraphics(state, action: PayloadAction<unknown>) {
      state.graphics = mergeGraphics(action.payload);
    },
    updateKeybind(state, action: PayloadAction<{ actionId: string; key: string }>) {
      state.keybinds[action.payload.actionId] = action.payload.key;
    },
    resetKeybinds(state) {
      state.keybinds = { ...DEFAULT_KEYBINDS };
    },
    setGraphicsResolution(state, action: PayloadAction<{ width: number; height: number }>) {
      state.graphics.width = action.payload.width;
      state.graphics.height = action.payload.height;
    },
    setGraphicsMode(state, action: PayloadAction<GraphicsMode>) {
      state.graphics.mode = action.payload;
    }
  }
});

export const {
  hydrateGraphics,
  hydrateKeybinds,
  resetKeybinds,
  setGraphicsMode,
  setGraphicsResolution,
  updateKeybind
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

export const selectKeybinds = (state: RootState) => state.settings.keybinds;
export const selectGraphics = (state: RootState) => state.settings.graphics;
