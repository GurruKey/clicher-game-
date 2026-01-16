import { createAsyncThunk } from "@reduxjs/toolkit";
import { LOCATIONS } from "../content/locations/index.js";
import {
  selectLocationId,
  setLocationId,
  setAvatarId,
  setProfileId,
  setIsLoadingProfile,
  resetProfileState,
  setPerkIds,
  setSkillSlots,
  setSkillSlots2,
  setSkillsUnlocked,
  setKnownAbilityIds,
  markAbilitiesSeen,
  setAbilityToggledById,
  setAbilityBuffsById
} from "./playerSlice";
import { startWork, finishWork, selectWork, resetWork } from "./workSlice";
import { consume, setResources, resetResources } from "./resourcesSlice";
import { RootState } from "../app/store";
import { loadGameSaveData } from "../persistence/gameSave";
import { normalizeInventorySnapshot } from "../systems/inventory/normalizeInventory";
import { setInventory, resetInventory } from "./inventorySlice";
import { setLocationDrops, resetLocationDrops } from "./lootSlice";
import { resetLootNotices } from "./lootNoticesSlice";
import { createStarterInventorySnapshot } from "../systems/inventory/createStarterInventory";
import { getDefaultPerkIdsForAvatarId } from "../systems/player/avatarMeta";
import { DEFAULT_AVATAR_ID } from "../content/avatars/index.js";

let movementTimeoutId: any = null;

/**
 * Передвижение между локациями.
 * 1 км = 10 секунд (10000 мс)
 * 1 км = 10 стамины
 */
export const moveLocation = createAsyncThunk(
  "game/moveLocation",
  async (targetLocationId: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const currentLocationId = selectLocationId(state);
    const work = selectWork(state);

    if (work.isWorking) return;
    if (currentLocationId === targetLocationId) return;

    const currentLoc = (LOCATIONS as any)[currentLocationId];
    const targetLoc = (LOCATIONS as any)[targetLocationId];

    if (!currentLoc || !targetLoc) return;

    // Расстояние в км (считаем по Евклиду)
    const dx = targetLoc.coords.x - currentLoc.coords.x;
    const dy = targetLoc.coords.y - currentLoc.coords.y;
    const distance = Math.sqrt(dx * dx + dy * dy) * 10; // Координаты 0.1 = 1км

    const durationMs = distance * 10000; // 10 сек за 1 км
    const staminaCost = distance * 10;

    // Списываем стамину
    dispatch(consume({ id: "max_stamina", amount: staminaCost }));

    // Запускаем процесс передвижения через workSlice
    dispatch(startWork({ 
      startedAtMs: Date.now(),
      durationMs, 
      locationId: targetLocationId,
      fromLocationId: currentLocationId
    }));

    if (movementTimeoutId) clearTimeout(movementTimeoutId);
    movementTimeoutId = setTimeout(() => {
      movementTimeoutId = null;
      dispatch(finishWork());
      dispatch(setLocationId(targetLocationId));
    }, durationMs);
  }
);

/**
 * Отмена передвижения и возврат назад.
 */
export const cancelMovement = createAsyncThunk(
  "game/cancelMovement",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const work = selectWork(state);

    if (!work.isWorking || !work.locationId || work.isReturning || !work.fromLocationId) return;

    const elapsedMs = Date.now() - (work.startedAtMs ?? Date.now());
    const returnDurationMs = Math.max(0, elapsedMs);
    const targetLocationId = work.fromLocationId;

    if (movementTimeoutId) {
      clearTimeout(movementTimeoutId);
      movementTimeoutId = null;
    }

    dispatch(startWork({
      startedAtMs: Date.now(),
      durationMs: returnDurationMs,
      locationId: targetLocationId,
      fromLocationId: work.locationId,
      isReturning: true
    }));

    movementTimeoutId = setTimeout(() => {
      movementTimeoutId = null;
      dispatch(finishWork());
      dispatch(setLocationId(targetLocationId));
    }, returnDurationMs);
  }
);

/**
 * Полный сброс состояния игры перед загрузкой нового профиля.
 */
export const resetGameState = createAsyncThunk(
  "game/resetGameState",
  async (_, { dispatch }) => {
    if (movementTimeoutId) {
      clearTimeout(movementTimeoutId);
      movementTimeoutId = null;
    }
    dispatch(resetProfileState());
    dispatch(resetResources());
    dispatch(resetInventory());
    dispatch(resetLocationDrops());
    dispatch(resetWork());
    dispatch(resetLootNotices());
  }
);

/**
 * Выбор базового профиля аватара и загрузка данных.
 */
export const selectAvatarProfile = createAsyncThunk(
  "game/selectAvatarProfile",
  async (
    { profileId, avatarId, isNew }: { profileId: string; avatarId: string; isNew?: boolean },
    { dispatch }
  ) => {
    dispatch(setIsLoadingProfile(true));
    dispatch(setProfileId(profileId));
    dispatch(setAvatarId(avatarId));

    // Сбрасываем текущее состояние перед загрузкой нового
    // Ожидаем завершения сброса, чтобы не перетереть новые данные (например, стартовый инвентарь)
    await dispatch(resetGameState());

    // Если это новый профиль, мы пропускаем попытку загрузки, чтобы не загрузить пустой файл,
    // который мог быть создан автоматически подписчиком в store.ts при смене profileId
    const saved = isNew ? null : loadGameSaveData(profileId);
    
    if (saved) {
      // Гидратация из сохранения
      const savedInventory = normalizeInventorySnapshot(saved.inventory);
      if (saved.resources) dispatch(setResources(saved.resources));
      if (savedInventory) dispatch(setInventory(savedInventory));
      if (saved.loot) dispatch(setLocationDrops(saved.loot));
      if (saved.locationId) dispatch(setLocationId(saved.locationId));
      if (saved.skillSlots) dispatch(setSkillSlots(saved.skillSlots));
      if (saved.skillSlots2) dispatch(setSkillSlots2(saved.skillSlots2));
      if (typeof saved.skillsUnlocked === "boolean") dispatch(setSkillsUnlocked(saved.skillsUnlocked));
      if (saved.knownAbilityIds) dispatch(setKnownAbilityIds(saved.knownAbilityIds));
      if (saved.seenAbilityIds) dispatch(markAbilitiesSeen(saved.seenAbilityIds));
      if (saved.abilityToggledById) dispatch(setAbilityToggledById(saved.abilityToggledById as any));
      if (saved.abilityBuffsById) dispatch(setAbilityBuffsById(saved.abilityBuffsById as any));
      
      const savedPerkIds = saved.perks ?? null;
      if (Array.isArray(savedPerkIds) && savedPerkIds.length > 0) {
        dispatch(setPerkIds(savedPerkIds));
      } else {
        dispatch(setPerkIds(getDefaultPerkIdsForAvatarId(avatarId ?? DEFAULT_AVATAR_ID)));
      }
    } else {
      // Инициализация для нового персонажа
      dispatch(setInventory(createStarterInventorySnapshot()));
      dispatch(setPerkIds(getDefaultPerkIdsForAvatarId(avatarId ?? DEFAULT_AVATAR_ID)));
    }
    dispatch(setIsLoadingProfile(false));
  }
);

/**
 * Сброс прогресса (заглушка или реализация, если она была).
 */
export const resetProgress = createAsyncThunk(
  "game/resetProgress",
  async (_, { dispatch }) => {
    // Реализация сброса, если она была в старой версии
    localStorage.clear();
    window.location.reload();
  }
);
