import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { DEFAULT_LOCATION_ID } from "../content/locations/index.js";

const SKILL_SLOTS_COUNT = 10;

type PlayerState = {
  profileId: string | null;
  profileIds: string[];
  avatarId: string | null;
  perkIds: string[];
  locationId: string;
  skillSlots: Array<string | null>;
  skillSlots2: Array<string | null>;
  skillsUnlocked: boolean;
  knownAbilityIds: string[];
  seenAbilityIds: string[];
  abilityReadyAtById: Record<string, number>;
  abilityDelayEndsAtById: Record<string, number>;
  abilityCooldownEndsAtById: Record<string, number>;
  abilityAutoRepeatEnabledById: Record<string, boolean>;
  abilityToggledById: Record<string, boolean>;
  abilityCastEndsAtById: Record<string, number>;
  abilityBuffsById: Record<string, { stacks: number; expiresAtMs: number }>;
  isLoadingProfile: boolean;
};

const initialState: PlayerState = {
  profileId: null,
  profileIds: [],
  avatarId: null,
  perkIds: [],
  isLoadingProfile: false,
  locationId: DEFAULT_LOCATION_ID,
  skillSlots: Array(SKILL_SLOTS_COUNT).fill(null),
  skillSlots2: Array(SKILL_SLOTS_COUNT).fill(null),
  skillsUnlocked: false,
  knownAbilityIds: [],
  seenAbilityIds: [],
  abilityReadyAtById: {},
  abilityDelayEndsAtById: {},
  abilityCooldownEndsAtById: {},
  abilityAutoRepeatEnabledById: {},
  abilityToggledById: {},
  abilityCastEndsAtById: {},
  abilityBuffsById: {}
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setProfileId(state, action: PayloadAction<string | null>) {
      const value = action.payload;
      if (value === null) {
        state.profileId = null;
        return;
      }
      if (typeof value !== "string" || value.length === 0) return;
      state.profileId = value;
    },
    setProfileIds(state, action: PayloadAction<string[]>) {
      state.profileIds = Array.from(new Set(action.payload.filter((id) => typeof id === "string" && id.length > 0)));
    },
    addProfileId(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (typeof id !== "string" || id.length === 0) return;
      if (!state.profileIds.includes(id)) state.profileIds.push(id);
    },
    setAvatarId(state, action: PayloadAction<string | null>) {
      state.avatarId = action.payload;
    },
    setIsLoadingProfile(state, action: PayloadAction<boolean>) {
      state.isLoadingProfile = action.payload;
    },
    resetProfileState(state) {
      state.perkIds = [];
      state.locationId = DEFAULT_LOCATION_ID;
      state.skillSlots = Array(SKILL_SLOTS_COUNT).fill(null);
      state.skillSlots2 = Array(SKILL_SLOTS_COUNT).fill(null);
      state.skillsUnlocked = false;
      state.knownAbilityIds = [];
      state.seenAbilityIds = [];
      state.abilityReadyAtById = {};
      state.abilityDelayEndsAtById = {};
      state.abilityCooldownEndsAtById = {};
      state.abilityAutoRepeatEnabledById = {};
      state.abilityToggledById = {};
      state.abilityCastEndsAtById = {};
      state.abilityBuffsById = {};
    },
    clearProfiles(state) {
      state.profileIds = [];
      state.profileId = null;
      state.avatarId = null;
      state.perkIds = [];
      state.locationId = DEFAULT_LOCATION_ID;
      state.skillSlots = Array(SKILL_SLOTS_COUNT).fill(null);
      state.skillSlots2 = Array(SKILL_SLOTS_COUNT).fill(null);
      state.skillsUnlocked = false;
      state.knownAbilityIds = [];
      state.seenAbilityIds = [];
      state.abilityReadyAtById = {};
      state.abilityDelayEndsAtById = {};
      state.abilityCooldownEndsAtById = {};
      state.abilityAutoRepeatEnabledById = {};
      state.abilityToggledById = {};
      state.abilityCastEndsAtById = {};
      state.abilityBuffsById = {};
    },
    setSkillsUnlocked(state, action: PayloadAction<boolean>) {
      state.skillsUnlocked = Boolean(action.payload);
    },
    addKnownAbilityIds(state, action: PayloadAction<string[]>) {
      const ids = Array.isArray(action.payload) ? action.payload : [];
      for (const id of ids) {
        if (typeof id !== "string" || id.length === 0) continue;
        if (!state.knownAbilityIds.includes(id)) state.knownAbilityIds.push(id);
      }
      if (state.knownAbilityIds.length > 0) {
        state.skillsUnlocked = true;
      }
    },
    setKnownAbilityIds(state, action: PayloadAction<string[]>) {
      const ids = Array.isArray(action.payload) ? action.payload : [];
      state.knownAbilityIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
      if (state.knownAbilityIds.length > 0) {
        state.skillsUnlocked = true;
      }
    },
    markAbilitiesSeen(state, action: PayloadAction<string[]>) {
      const next = new Set(state.seenAbilityIds ?? []);
      let changed = false;
      for (const id of action.payload) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      if (changed) {
        state.seenAbilityIds = Array.from(next);
      }
    },
    setPerkIds(state, action: PayloadAction<string[]>) {
      state.perkIds = action.payload;
    },
    setLocationId(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (typeof id !== "string" || id.length === 0) return;
      state.locationId = id;
    },
    setSkillSlot(state, action: PayloadAction<{ index: number; itemId: string | null }>) {
      const { index, itemId } = action.payload;
      if (!Number.isInteger(index) || index < 0 || index >= SKILL_SLOTS_COUNT) return;
      if (itemId !== null && (typeof itemId !== "string" || itemId.length === 0)) return;
      state.skillSlots[index] = itemId;
      if (itemId) state.skillsUnlocked = true;
    },
    setSkillSlots(state, action: PayloadAction<Array<string | null>>) {
      const next = Array(SKILL_SLOTS_COUNT).fill(null) as Array<string | null>;
      let hasAbility = false;
      if (Array.isArray(action.payload)) {
        for (let i = 0; i < SKILL_SLOTS_COUNT; i++) {
          const value = action.payload[i];
          if (typeof value === "string" && value.length > 0) {
            next[i] = value;
            hasAbility = true;
          } else {
            next[i] = null;
          }
        }
      }
      state.skillSlots = next;
      if (hasAbility) state.skillsUnlocked = true;
    },
    setSkillSlot2(state, action: PayloadAction<{ index: number; itemId: string | null }>) {
      const { index, itemId } = action.payload;
      if (!Number.isInteger(index) || index < 0 || index >= SKILL_SLOTS_COUNT) return;
      if (itemId !== null && (typeof itemId !== "string" || itemId.length === 0)) return;
      state.skillSlots2[index] = itemId;
      if (itemId) state.skillsUnlocked = true;
    },
    setSkillSlots2(state, action: PayloadAction<Array<string | null>>) {
      const next = Array(SKILL_SLOTS_COUNT).fill(null) as Array<string | null>;
      let hasAbility = false;
      if (Array.isArray(action.payload)) {
        for (let i = 0; i < SKILL_SLOTS_COUNT; i++) {
          const value = action.payload[i];
          if (typeof value === "string" && value.length > 0) {
            next[i] = value;
            hasAbility = true;
          } else {
            next[i] = null;
          }
        }
      }
      state.skillSlots2 = next;
      if (hasAbility) state.skillsUnlocked = true;
    },
    setAbilityReadyAt(state, action: PayloadAction<{ abilityId: string; readyAtMs: number }>) {
      const abilityId = action.payload?.abilityId;
      const readyAtMs = action.payload?.readyAtMs;
      if (typeof abilityId !== "string" || abilityId.length === 0) return;
      const next = Number(readyAtMs);
      if (!Number.isFinite(next) || next < 0) return;
      state.abilityReadyAtById[abilityId] = next;
    },
    setAbilityTimers(
      state,
      action: PayloadAction<{ abilityId: string; delayEndsAtMs: number; cooldownEndsAtMs: number }>
    ) {
      const abilityId = action.payload?.abilityId;
      const delayEndsAtMs = Number(action.payload?.delayEndsAtMs);
      const cooldownEndsAtMs = Number(action.payload?.cooldownEndsAtMs);
      if (typeof abilityId !== "string" || abilityId.length === 0) return;
      if (!Number.isFinite(delayEndsAtMs) || delayEndsAtMs < 0) return;
      if (!Number.isFinite(cooldownEndsAtMs) || cooldownEndsAtMs < 0) return;
      state.abilityDelayEndsAtById[abilityId] = delayEndsAtMs;
      state.abilityCooldownEndsAtById[abilityId] = cooldownEndsAtMs;
    },
    setAbilityAutoRepeatEnabled(
      state,
      action: PayloadAction<{ abilityId: string; enabled: boolean }>
    ) {
      const abilityId = action.payload?.abilityId;
      const enabled = action.payload?.enabled;
      if (typeof abilityId !== "string" || abilityId.length === 0) return;
      state.abilityAutoRepeatEnabledById[abilityId] = Boolean(enabled);
    },
    setAbilityToggled(state, action: PayloadAction<{ abilityId: string; enabled: boolean }>) {
      const abilityId = action.payload?.abilityId;
      const enabled = action.payload?.enabled;
      if (typeof abilityId !== "string" || abilityId.length === 0) return;
      state.abilityToggledById[abilityId] = Boolean(enabled);
    },
    setAbilityToggledById(state, action: PayloadAction<Record<string, boolean>>) {
      const value = action.payload;
      if (!value || typeof value !== "object") return;
      const next: Record<string, boolean> = {};
      for (const [key, raw] of Object.entries(value)) {
        if (typeof key !== "string" || key.length === 0) continue;
        if (typeof raw !== "boolean") continue;
        next[key] = raw;
      }
      state.abilityToggledById = next;
    },
    setAbilityCastEndsAt(state, action: PayloadAction<{ abilityId: string; endsAtMs: number }>) {
      const abilityId = action.payload?.abilityId;
      const endsAtMs = Number(action.payload?.endsAtMs);
      if (typeof abilityId !== "string" || abilityId.length === 0) return;
      if (!Number.isFinite(endsAtMs) || endsAtMs < 0) return;
      state.abilityCastEndsAtById[abilityId] = endsAtMs;
    },
    applyAbilityBuffStack(
      state,
      action: PayloadAction<{ buffId: string; maxStacks: number; durationMs: number; nowMs: number }>
    ) {
      const buffId = action.payload?.buffId;
      const maxStacks = Math.max(1, Math.floor(Number(action.payload?.maxStacks ?? 1)));
      const durationMs = Math.max(0, Math.floor(Number(action.payload?.durationMs ?? 0)));
      const nowMs = Number(action.payload?.nowMs);
      if (typeof buffId !== "string" || buffId.length === 0) return;
      if (!Number.isFinite(nowMs) || nowMs <= 0) return;
      const expiresAtMs = nowMs + durationMs;

      const prev = state.abilityBuffsById[buffId];
      const prevStacks = Math.max(0, Math.floor(Number(prev?.stacks ?? 0)));
      const nextStacks = Math.min(maxStacks, prevStacks + 1);

      state.abilityBuffsById[buffId] = { stacks: nextStacks, expiresAtMs };
    },
    purgeExpiredAbilityBuffs(state, action: PayloadAction<{ nowMs: number }>) {
      const nowMs = Number(action.payload?.nowMs);
      if (!Number.isFinite(nowMs) || nowMs <= 0) return;
      const next: PlayerState["abilityBuffsById"] = {};
      for (const [id, entry] of Object.entries(state.abilityBuffsById)) {
        const stacks = Math.max(0, Math.floor(Number(entry?.stacks ?? 0)));
        const expiresAtMs = Number(entry?.expiresAtMs ?? 0);
        if (!id || stacks <= 0) continue;
        if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) continue;
        next[id] = { stacks, expiresAtMs };
      }
      state.abilityBuffsById = next;
    },
    setAbilityBuffsById(state, action: PayloadAction<Record<string, { stacks: number; expiresAtMs: number }>>) {
      const value = action.payload;
      if (!value || typeof value !== "object") return;
      const next: PlayerState["abilityBuffsById"] = {};
      for (const [id, entry] of Object.entries(value)) {
        if (typeof id !== "string" || id.length === 0) continue;
        if (!entry || typeof entry !== "object") continue;
        const stacks = Math.max(0, Math.floor(Number((entry as any).stacks ?? 0)));
        const expiresAtMs = Number((entry as any).expiresAtMs ?? 0);
        if (stacks <= 0) continue;
        if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) continue;
        next[id] = { stacks, expiresAtMs };
      }
      state.abilityBuffsById = next;
    },
    removeAbilityBuff(state, action: PayloadAction<{ buffId: string }>) {
      const buffId = action.payload?.buffId;
      if (typeof buffId !== "string" || buffId.length === 0) return;
      delete state.abilityBuffsById[buffId];
    }
  }
});

export const {
  addProfileId,
  clearProfiles,
  setProfileId,
  setProfileIds,
  setAvatarId,
  setIsLoadingProfile,
  resetProfileState,
  setSkillsUnlocked,
  addKnownAbilityIds,
  setKnownAbilityIds,
  markAbilitiesSeen,
  setAbilityReadyAt,
  setAbilityTimers,
  setAbilityAutoRepeatEnabled,
  setAbilityToggled,
  setAbilityToggledById,
  setAbilityCastEndsAt,
  applyAbilityBuffStack,
  purgeExpiredAbilityBuffs,
  setAbilityBuffsById,
  removeAbilityBuff,
  setLocationId,
  setPerkIds,
  setSkillSlot,
  setSkillSlots,
  setSkillSlot2,
  setSkillSlots2
} =
  playerSlice.actions;
export const playerReducer = playerSlice.reducer;

export const selectProfileId = (state: RootState) => state.player.profileId;
export const selectProfileIds = (state: RootState) => state.player.profileIds;
export const selectAvatarId = (state: RootState) => state.player.avatarId;
export const selectIsLoadingProfile = (state: RootState) => state.player.isLoadingProfile;
export const selectPerkIds = (state: RootState) => state.player.perkIds;
export const selectLocationId = (state: RootState) => state.player.locationId;
export const selectSkillSlots = (state: RootState) => state.player.skillSlots;
export const selectSkillSlots2 = (state: RootState) => state.player.skillSlots2;
export const selectSkillsUnlocked = (state: RootState) => state.player.skillsUnlocked;
export const selectKnownAbilityIds = (state: RootState) => state.player.knownAbilityIds;
export const selectSeenAbilityIds = (state: RootState) => state.player.seenAbilityIds;
export const selectAbilityReadyAtById = (state: RootState) => state.player.abilityReadyAtById;
export const selectAbilityDelayEndsAtById = (state: RootState) => state.player.abilityDelayEndsAtById;
export const selectAbilityCooldownEndsAtById = (state: RootState) => state.player.abilityCooldownEndsAtById;
export const selectAbilityAutoRepeatEnabledById = (state: RootState) => state.player.abilityAutoRepeatEnabledById;
export const selectAbilityToggledById = (state: RootState) => state.player.abilityToggledById;
export const selectAbilityCastEndsAtById = (state: RootState) => state.player.abilityCastEndsAtById;
export const selectAbilityBuffsById = (state: RootState) => state.player.abilityBuffsById;
