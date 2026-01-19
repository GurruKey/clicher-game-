import { configureStore } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  playerReducer,
  selectAvatarId,
  selectProfileId,
  selectProfileIds,
  selectIsLoadingProfile,
  selectAbilityAutoRepeatEnabledById,
  selectAbilityBuffsById,
  selectAbilityToggledById,
  selectKnownAbilityIds,
  selectSeenAbilityIds,
  selectLocationId,
  selectPerkIds,
  selectSkillSlots,
  selectSkillSlots2,
  selectSkillsUnlocked,
  setAvatarId,
  setProfileId,
  setProfileIds,
  setKnownAbilityIds,
  markAbilitiesSeen,
  setLocationId,
  setPerkIds,
  setSkillsUnlocked,
  setSkillSlots,
  setSkillSlots2,
  setAbilityToggledById,
  setAbilityBuffsById,
  purgeExpiredAbilityBuffs
} from "../state/playerSlice";
import { resourcesReducer } from "../state/resourcesSlice";
import { inventoryReducer, selectInventorySnapshot, setInventory } from "../state/inventorySlice";
import { lootReducer, selectLocationDrops, setLocationDrops } from "../state/lootSlice";
import { settingsReducer, hydrateKeybinds, selectKeybinds } from "../state/settingsSlice";
import { uiReducer, toggleInventory, toggleMap, resetUi, selectUi } from "../state/uiSlice";
import { workReducer } from "../state/workSlice";
import {
  lootNoticesReducer,
  addNotice,
  clearNotice,
  hideNotice,
  selectLootNoticesConfig
} from "../state/lootNoticesSlice";
import { loadGameSaveData, saveGameSaveData } from "../persistence/gameSave";
import { consume, selectResourcesCurrent, setResources } from "../state/resourcesSlice";
import { deriveResourcesConfig } from "../state/resourcesDerive";
import { reconcile, regenTick } from "../state/resourcesSlice";
import { STATS } from "../content/stats/index.js";
import { calculateFinalResources } from "../systems/resources/calculateFinalResources";
import { selectCalculatedStatsFromRoot } from "../state/statsDerive";
import type { CalcNodeDefinition } from "../systems/calc/calcEngine";
import { clearAvatarId, loadAvatarId, saveAvatarId } from "../persistence/avatar";
import { loadAvatarIds, saveAvatarIds } from "../persistence/avatars";
import { DEFAULT_AVATAR_ID } from "../content/avatars/index.js";
import { getDefaultPerkIdsForAvatarId } from "../systems/player/avatarMeta";
import { normalizeInventorySnapshot } from "../systems/inventory/normalizeInventory";
import { createStarterInventorySnapshot } from "../systems/inventory/createStarterInventory";
import { loadKeybinds, saveKeybinds } from "../persistence/keybinds";
import { DEFAULT_KEYBINDS } from "../content/keybinds";
import { resetProgress } from "../state/gameThunks";
import { useAbility } from "../state/abilitiesThunks";
import { ABILITIES, getAbilityById } from "../content/abilities/index.js";
import { setAbilityToggled } from "../state/playerSlice";
import { getBuffBonuses, getManaRegenBonusFromBuffs } from "../systems/abilities/buffs";
import { createProfileId, getBaseAvatarIdFromProfileId } from "../systems/player/profileId";

const savedProfileId = loadAvatarId();
const savedProfileIds = loadAvatarIds();
const savedKeybinds = loadKeybinds();

const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    player: playerReducer,
    resources: resourcesReducer,
    inventory: inventoryReducer,
    loot: lootReducer,
    settings: settingsReducer,
    ui: uiReducer,
    work: workReducer,
    lootNotices: lootNoticesReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const startAppListening =
  listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

let lastPersistedJson = "";
let lastPersistedSignature = "";

// Hydrate from persistence (legacy-safe) after store creation, to avoid tight typing constraints
if (savedKeybinds) {
  store.dispatch(hydrateKeybinds(savedKeybinds));
}

const hydratedProfileIds = Array.isArray(savedProfileIds) ? savedProfileIds : [];
const initialProfileIds = hydratedProfileIds.length > 0
  ? hydratedProfileIds
  : savedProfileId
    ? [savedProfileId]
    : [];
if (initialProfileIds.length > 0) {
  store.dispatch(setProfileIds(initialProfileIds));
  saveAvatarIds(initialProfileIds);
}

let initialProfileId =
  savedProfileId ?? initialProfileIds[0] ?? null;

// Removed auto-creation of profile if none exists.
// This allows the EntryScreen to show the creation UI instead of automatically entering the game.

if (initialProfileId) {
  store.dispatch(setProfileId(initialProfileId));
  const base = getBaseAvatarIdFromProfileId(initialProfileId) ?? initialProfileId;
  store.dispatch(setAvatarId(base));
}

const saved = initialProfileId ? loadGameSaveData(initialProfileId) : null;
const savedInventory = normalizeInventorySnapshot(saved?.inventory);
if (saved?.resources) store.dispatch(setResources(saved.resources));
if (savedInventory) store.dispatch(setInventory(savedInventory));
if (saved?.loot) store.dispatch(setLocationDrops(saved.loot));
if (saved?.locationId) store.dispatch(setLocationId(saved.locationId));
if (saved?.skillSlots) store.dispatch(setSkillSlots(saved.skillSlots));
if (saved?.skillSlots2) store.dispatch(setSkillSlots2(saved.skillSlots2));
if (typeof saved?.skillsUnlocked === "boolean") store.dispatch(setSkillsUnlocked(saved.skillsUnlocked));
if (saved?.knownAbilityIds) store.dispatch(setKnownAbilityIds(saved.knownAbilityIds));
if (saved?.seenAbilityIds) store.dispatch(markAbilitiesSeen(saved.seenAbilityIds));
if (saved?.abilityToggledById) store.dispatch(setAbilityToggledById(saved.abilityToggledById as any));
if (saved?.abilityBuffsById) store.dispatch(setAbilityBuffsById(saved.abilityBuffsById as any));

const hydratedAvatarId = store.getState().player.avatarId;
const savedPerkIds = saved?.perks ?? null;
if (hydratedAvatarId) {
  if (Array.isArray(savedPerkIds) && savedPerkIds.length > 0) {
    store.dispatch(setPerkIds(savedPerkIds));
  } else {
    store.dispatch(setPerkIds(getDefaultPerkIdsForAvatarId(hydratedAvatarId ?? DEFAULT_AVATAR_ID)));
  }
} else if (Array.isArray(savedPerkIds) && savedPerkIds.length > 0) {
  store.dispatch(setPerkIds(savedPerkIds));
}

if (!saved && !savedInventory) {
  store.dispatch(setInventory(createStarterInventorySnapshot()));
}

const persistNow = () => {
  const state = store.getState();
  const profileId = selectProfileId(state);
  const data = {
    inventory: selectInventorySnapshot(state),
    resources: selectResourcesCurrent(state),
    loot: selectLocationDrops(state),
    perks: selectPerkIds(state),
    locationId: selectLocationId(state),
    skillSlots: selectSkillSlots(state),
    skillSlots2: selectSkillSlots2(state),
    skillsUnlocked: selectSkillsUnlocked(state),
    knownAbilityIds: selectKnownAbilityIds(state),
    seenAbilityIds: selectSeenAbilityIds(state),
    abilityToggledById: selectAbilityToggledById(state),
    abilityBuffsById: selectAbilityBuffsById(state)
  };
  const json = JSON.stringify({ version: 1, data });
  lastPersistedJson = json;
  lastPersistedSignature = `${profileId ?? "<none>"}|${json}`;
  saveGameSaveData(profileId, data);
};

// Upgrade legacy save to versioned envelope early
if (saved) {
  persistNow();
}

store.subscribe(() => {
  const state = store.getState();
  const profileId = selectProfileId(state);

  // If we are currently loading/resetting the profile (e.g. switching avatars),
  // do NOT save the intermediate (empty/mixed) state to disk.
  if (selectIsLoadingProfile(state)) return;

  const data = {
    inventory: selectInventorySnapshot(state),
    resources: selectResourcesCurrent(state),
    loot: selectLocationDrops(state),
    perks: selectPerkIds(state),
    locationId: selectLocationId(state),
    skillSlots: selectSkillSlots(state),
    skillSlots2: selectSkillSlots2(state),
    skillsUnlocked: selectSkillsUnlocked(state),
    knownAbilityIds: selectKnownAbilityIds(state),
    seenAbilityIds: selectSeenAbilityIds(state),
    abilityToggledById: selectAbilityToggledById(state),
    abilityBuffsById: selectAbilityBuffsById(state)
  };
  const json = JSON.stringify({ version: 1, data });
  const signature = `${profileId ?? "<none>"}|${json}`;
  if (signature === lastPersistedSignature) return;
  lastPersistedSignature = signature;

  // Never write legacy saves when no avatar is selected (prevents "empty reset" from re-creating click-game-save).
  if (!profileId) return;

  lastPersistedJson = json;
  saveGameSaveData(profileId, data);
});

let lastProfileId = selectProfileId(store.getState());
store.subscribe(() => {
  const profileId = selectProfileId(store.getState());
  if (profileId === lastProfileId) return;
  lastProfileId = profileId;
  if (profileId) saveAvatarId(profileId);
  else clearAvatarId();
});

let lastProfileIdsJson = JSON.stringify(selectProfileIds(store.getState()));
store.subscribe(() => {
  const next = selectProfileIds(store.getState());
  const nextJson = JSON.stringify(next);
  if (nextJson === lastProfileIdsJson) return;
  lastProfileIdsJson = nextJson;
  saveAvatarIds(next);
});

let lastKeybindsJson = JSON.stringify(selectKeybinds(store.getState()));
store.subscribe(() => {
  const next = selectKeybinds(store.getState());
  const nextJson = JSON.stringify(next);
  if (nextJson === lastKeybindsJson) return;
  lastKeybindsJson = nextJson;
  saveKeybinds(next);
});

type RegenConfig = { intervalMs: number; timerId: ReturnType<typeof setInterval> };
const regenTimers = new Map<string, RegenConfig>();

const syncResourceRuntime = () => {
  const state = store.getState();
  const perkIds = selectPerkIds(state);
  const { activeDefs, activeIds, baseById } = deriveResourcesConfig(perkIds);

  const calculatedStats = selectCalculatedStatsFromRoot(state);

  const buffBonuses = getBuffBonuses({
    abilities: ABILITIES as any[],
    buffsById: (selectAbilityBuffsById(state) as any) ?? {},
    enabledById: (selectAbilityToggledById(state) as any) ?? {},
    nowMs: Date.now()
  });

  const overrideBases: Record<string, number> = {};
  for (const def of activeDefs) {
    const bonus = buffBonuses.resourceBonuses[def.id] ?? 0;
    if (bonus !== 0) {
      overrideBases[def.id] = bonus;
    }
  }

  const maxById = calculateFinalResources(
    calculatedStats,
    activeDefs,
    STATS as unknown as CalcNodeDefinition[],
    overrideBases
  );

  store.dispatch(reconcile({ activeIds, maxById, baseById }));

  const activeSet = new Set(activeIds);

  for (const [id, entry] of regenTimers.entries()) {
    if (!activeSet.has(id)) {
      clearInterval(entry.timerId);
      regenTimers.delete(id);
    }
  }

  for (const def of activeDefs) {
    const regenInterval = def.regenInterval ?? 0;
    if (!regenInterval || regenInterval <= 0) {
      const existing = regenTimers.get(def.id);
      if (existing) {
        clearInterval(existing.timerId);
        regenTimers.delete(def.id);
      }
      continue;
    }

    const existing = regenTimers.get(def.id);
    if (existing && existing.intervalMs === regenInterval) {
      continue;
    }
    if (existing) {
      clearInterval(existing.timerId);
      regenTimers.delete(def.id);
    }

    const timerId = setInterval(() => {
      const s = store.getState();
      const { activeDefs: latestActiveDefs, baseById: latestBase } = deriveResourcesConfig(
        selectPerkIds(s)
      );

      const buffBonuses = getBuffBonuses({
        abilities: ABILITIES as any[],
        buffsById: (selectAbilityBuffsById(s) as any) ?? {},
        enabledById: (selectAbilityToggledById(s) as any) ?? {},
        nowMs: Date.now()
      });

      const overrideBases: Record<string, number> = {};
      for (const d of latestActiveDefs) {
        const bonus = buffBonuses.resourceBonuses[d.id] ?? 0;
        if (bonus !== 0) {
          overrideBases[d.id] = bonus;
        }
      }

      const latestMaxById = calculateFinalResources(
        selectCalculatedStatsFromRoot(s),
        latestActiveDefs,
        STATS as unknown as CalcNodeDefinition[],
        overrideBases
      );
      const max = latestMaxById[def.id] ?? latestBase[def.id] ?? 0;
      let amount = 1;
      if (def.id === "max_mana") {
        const nowMs = Date.now();
        store.dispatch(purgeExpiredAbilityBuffs({ nowMs }));
        const bonus = getManaRegenBonusFromBuffs({
          abilities: ABILITIES as any[],
          buffsById: (selectAbilityBuffsById(store.getState()) as any) ?? {},
          nowMs
        });
        amount = Math.max(0, 1 + Number(bonus ?? 0));
      }
      store.dispatch(regenTick({ id: def.id, max, amount }));
    }, regenInterval);

    regenTimers.set(def.id, { intervalMs: regenInterval, timerId });
  }
};

syncResourceRuntime();

startAppListening({
  predicate: (_action, currentState, previousState) =>
    selectPerkIds(currentState) !== selectPerkIds(previousState) ||
    selectAvatarId(currentState) !== selectAvatarId(previousState),
  effect: () => {
    syncResourceRuntime();
  }
});

// Loot notices timers (mirrors legacy logic)
const noticeTimers = new Map<string, { hide: ReturnType<typeof setTimeout>; clear: ReturnType<typeof setTimeout> }>();
startAppListening({
  actionCreator: addNotice,
  effect: (action, api) => {
    const id = action.payload.id;
    const config = selectLootNoticesConfig(api.getState());
    const existing = noticeTimers.get(id);
    if (existing) {
      clearTimeout(existing.hide);
      clearTimeout(existing.clear);
      noticeTimers.delete(id);
    }

    const hideTimer = setTimeout(() => {
      api.dispatch(hideNotice({ id }));
    }, config.hideDelayMs);

    const clearTimer = setTimeout(() => {
      api.dispatch(clearNotice({ id }));
      const timers = noticeTimers.get(id);
      if (timers) {
        clearTimeout(timers.hide);
        clearTimeout(timers.clear);
        noticeTimers.delete(id);
      }
    }, config.clearDelayMs);

    noticeTimers.set(id, { hide: hideTimer, clear: clearTimer });
  }
});

// Global hotkeys (mirrors legacy logic)
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__CLICK_HOTKEYS_INSTALLED__) {
    win.__CLICK_HOTKEYS_INSTALLED__ = true;
    window.addEventListener("keydown", (event) => {
    const ui = selectUi(store.getState());
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || (target as any)?.isContentEditable) return;

    const keybinds = selectKeybinds(store.getState());
    const resetCode = keybinds.resetProgress ?? DEFAULT_KEYBINDS.resetProgress;
    const openMapCode = keybinds.openMap ?? DEFAULT_KEYBINDS.openMap;
    const toggleBagCode = keybinds.toggleBag ?? DEFAULT_KEYBINDS.toggleBag;

    if (event.code === resetCode) {
      event.preventDefault();
      store.dispatch(resetProgress());
      return;
    }

    if (event.code === openMapCode) {
      event.preventDefault();
      if (ui.isSettingsOpen || ui.isKeybindsOpen || ui.isStatsOpen || ui.isPerksOpen || ui.isBloodlineOpen || ui.isCharacterOpen || ui.isLocationOpen) return;
      store.dispatch(toggleMap());
      return;
    }

    if (event.code === toggleBagCode) {
      event.preventDefault();
      if (ui.isSettingsOpen || ui.isKeybindsOpen || ui.isStatsOpen || ui.isPerksOpen || ui.isBloodlineOpen || ui.isCharacterOpen || ui.isLocationOpen) return;
      store.dispatch(toggleInventory());
    }
    });
  }
}

// Auto-repeat abilities loop (tick-based, no timers in Redux state)
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__CLICK_AUTO_ABILITIES_INSTALLED__) {
    win.__CLICK_AUTO_ABILITIES_INSTALLED__ = true;
    setInterval(() => {
      const state = store.getState();
      const enabledById = selectAbilityAutoRepeatEnabledById(state) as Record<string, boolean>;
      for (const [abilityId, enabled] of Object.entries(enabledById)) {
        if (!enabled) continue;
        const ability = getAbilityById(abilityId) as any;
        if (!ability || !ability.autoRepeat) continue;
        store.dispatch(useAbility({ abilityId }));
      }
    }, 200);
  }
}

// Aura drains loop (tick-based; disables aura when mana is insufficient)
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__CLICK_AURA_DRAINS_INSTALLED__) {
    win.__CLICK_AURA_DRAINS_INSTALLED__ = true;
    let lastTickMs = Date.now();
    setInterval(() => {
      const now = Date.now();
      const dtSec = Math.min(0.5, Math.max(0, (now - lastTickMs) / 1000));
      lastTickMs = now;
      if (dtSec <= 0) return;

      const state = store.getState();
      const enabledById = selectAbilityToggledById(state) as Record<string, boolean>;
      if (!enabledById || Object.keys(enabledById).length === 0) return;

      for (const [abilityId, enabled] of Object.entries(enabledById)) {
        if (!enabled) continue;
        const ability = getAbilityById(abilityId) as any;
        if (!ability || ability.kind !== "aura") continue;
        const drainPerSecond = Math.max(0, Number(ability.manaDrainPerSecond ?? 0));
        if (drainPerSecond <= 0) continue;

        const drain = drainPerSecond * dtSec;
        const currentMana = Number(store.getState().resources.current.max_mana ?? 0);
        if (!Number.isFinite(currentMana) || currentMana < drain) {
          store.dispatch(setAbilityToggled({ abilityId, enabled: false }));
          continue;
        }
        store.dispatch(consume({ id: "max_mana", amount: drain }));
      }
    }, 200);
  }
}
