import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";

type UiState = {
  isInGame: boolean;
  isInventoryOpen: boolean;
  isSettingsOpen: boolean;
  isKeybindsOpen: boolean;
  isMapOpen: boolean;
  isLocationOpen: boolean;
  viewedLocationId: string | null;
  isStatsOpen: boolean;
  isSpellsOpen: boolean;
  isPerksOpen: boolean;
  isBloodlineOpen: boolean;
  isReputationOpen: boolean;
  isFameOpen: boolean;
  isCharacterOpen: boolean;
  gearLayer: "outer" | "inner";
  skillError: { barId: number; index: number; timestamp: number } | null;
  skillPress: { barId: number; index: number; timestamp: number } | null;
};

const initialState: UiState = {
  isInGame: false,
  isInventoryOpen: false,
  isSettingsOpen: false,
  isKeybindsOpen: false,
  isMapOpen: false,
  isLocationOpen: false,
  viewedLocationId: null,
  isStatsOpen: false,
  isSpellsOpen: false,
  isPerksOpen: false,
  isBloodlineOpen: false,
  isReputationOpen: false,
  isFameOpen: false,
  isCharacterOpen: false,
  gearLayer: "outer",
  skillError: null,
  skillPress: null
};

const closeAllDialogs = (state: UiState) => {
  state.isSettingsOpen = false;
  state.isKeybindsOpen = false;
  state.isMapOpen = false;
  state.isLocationOpen = false;
  state.isStatsOpen = false;
  state.isPerksOpen = false;
  state.isBloodlineOpen = false;
  state.isReputationOpen = false;
  state.isFameOpen = false;
  state.isCharacterOpen = false;
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    enterGame(state) {
      state.isInGame = true;
    },
    exitGame(state) {
      state.isInGame = false;
      closeAllDialogs(state);
    },
    toggleInventory(state) {
      state.isInventoryOpen = !state.isInventoryOpen;
    },
    openCharacter(state) {
      closeAllDialogs(state);
      state.isCharacterOpen = true;
    },
    closeCharacter(state) {
      state.isCharacterOpen = false;
    },
    toggleGearLayer(state) {
      state.gearLayer = state.gearLayer === "outer" ? "inner" : "outer";
    },
    openSettings(state) {
      closeAllDialogs(state);
      state.isSettingsOpen = true;
    },
    closeSettings(state) {
      state.isSettingsOpen = false;
    },
    openKeybinds(state) {
      closeAllDialogs(state);
      state.isKeybindsOpen = true;
    },
    closeKeybinds(state) {
      state.isKeybindsOpen = false;
    },
    toggleMap(state) {
      if (state.isMapOpen) {
        state.isMapOpen = false;
        return;
      }
      closeAllDialogs(state);
      state.isMapOpen = true;
    },
    closeMap(state) {
      state.isMapOpen = false;
    },
    openLocation(state, action: PayloadAction<string | undefined>) {
      const isMapOpen = state.isMapOpen;
      closeAllDialogs(state);
      state.isLocationOpen = true;
      state.isMapOpen = isMapOpen; // Сохраняем карту открытой
      state.viewedLocationId = action.payload ?? null;
    },
    closeLocation(state) {
      state.isLocationOpen = false;
      state.viewedLocationId = null;
    },
    openStats(state) {
      closeAllDialogs(state);
      state.isStatsOpen = true;
    },
    closeStats(state) {
      state.isStatsOpen = false;
    },
    closeSpells(state) {
      state.isSpellsOpen = false;
    },
    toggleSpells(state) {
      state.isSpellsOpen = !state.isSpellsOpen;
    },
    openPerks(state) {
      closeAllDialogs(state);
      state.isPerksOpen = true;
    },
    closePerks(state) {
      state.isPerksOpen = false;
    },
    openBloodline(state) {
      closeAllDialogs(state);
      state.isBloodlineOpen = true;
    },
    closeBloodline(state) {
      state.isBloodlineOpen = false;
    },
    openReputation(state) {
      closeAllDialogs(state);
      state.isReputationOpen = true;
    },
    closeReputation(state) {
      state.isReputationOpen = false;
    },
    openFame(state) {
      closeAllDialogs(state);
      state.isFameOpen = true;
    },
    closeFame(state) {
      state.isFameOpen = false;
    },
    resetUi(state) {
      state.isInventoryOpen = true;
      closeAllDialogs(state);
      state.gearLayer = "outer";
    },
    triggerSkillError(state, action: PayloadAction<{ barId: number; index: number }>) {
      state.skillError = {
        ...action.payload,
        timestamp: Date.now()
      };
    },
    triggerSkillPress(state, action: PayloadAction<{ barId: number; index: number }>) {
      state.skillPress = {
        ...action.payload,
        timestamp: Date.now()
      };
    }
  }
});

export const {
  closeMap,
  closeBloodline,
  closeCharacter,
  closeFame,
  closeKeybinds,
  closeLocation,
  closePerks,
  closeReputation,
  closeSettings,
  closeSpells,
  closeStats,
  enterGame,
  exitGame,
  openBloodline,
  openCharacter,
  openFame,
  openKeybinds,
  openLocation,
  openPerks,
  openReputation,
  openSettings,
  openStats,
  resetUi,
  toggleSpells,
  toggleGearLayer,
  toggleInventory,
  toggleMap,
  triggerSkillError,
  triggerSkillPress
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

export const selectUi = (state: RootState) => state.ui;
