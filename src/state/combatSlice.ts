import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CombatStatus = "idle" | "fighting" | "victory" | "defeat";

export interface MobLootItem {
  id: string;
  itemId: string;
  amount: number;
  rarity: string;
}

interface CombatState {
  status: CombatStatus;
  mobId: string | null;
  currentMobHealth: number;
  maxMobHealth: number;
  lastHitAt: number;
  lastHitType: "player" | "mob" | null;
  loot: MobLootItem[];
}

const initialState: CombatState = {
  status: "idle",
  mobId: null,
  currentMobHealth: 0,
  maxMobHealth: 0,
  lastHitAt: 0,
  lastHitType: null,
  loot: [],
};

const combatSlice = createSlice({
  name: "combat",
  initialState,
  reducers: {
    startCombat(state, action: PayloadAction<{ mobId: string; health: number }>) {
      state.status = "fighting";
      state.mobId = action.payload.mobId;
      state.currentMobHealth = action.payload.health;
      state.maxMobHealth = action.payload.health;
      state.lastHitAt = 0;
      state.lastHitType = null;
    },
    damageMob(state, action: PayloadAction<{ amount: number; now: number }>) {
      if (state.status !== "fighting") return;
      state.currentMobHealth = Math.max(0, state.currentMobHealth - action.payload.amount);
      state.lastHitAt = action.payload.now;
      state.lastHitType = "player";
      if (state.currentMobHealth <= 0) {
        state.status = "victory";
      }
    },
    damagePlayerEffect(state, action: PayloadAction<{ now: number }>) {
      state.lastHitAt = action.payload.now;
      state.lastHitType = "mob";
    },
    setCombatStatus(state, action: PayloadAction<CombatStatus>) {
      state.status = action.payload;
    },
    resetCombat(state) {
      return initialState;
    },
    setMobLoot(state, action: PayloadAction<MobLootItem[]>) {
      state.loot = action.payload;
    },
    removeMobLootItem(state, action: PayloadAction<string>) {
      state.loot = state.loot.filter(item => item.id !== action.payload);
    },
  },
});

export const { startCombat, damageMob, damagePlayerEffect, setCombatStatus, resetCombat, setMobLoot, removeMobLootItem } = combatSlice.actions;
export default combatSlice.reducer;
