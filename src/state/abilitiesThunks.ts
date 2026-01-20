import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { getAbilityById } from "../content/abilities/index.js";
import { ABILITIES } from "../content/abilities/index.js";
import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { WORK_DURATION_MS } from "../config/work";
import { finishWorkAtLocation, startWorkAtLocation } from "./lootThunks";
import {
  selectAbilityCooldownEndsAtById,
  selectAbilityDelayEndsAtById,
  selectAbilityReadyAtById,
  selectLocationId,
  selectAbilityCastEndsAtById,
  selectAbilityToggledById,
  setAbilityReadyAt,
  setAbilityCastEndsAt,
  setAbilityTimers,
  setAbilityToggled,
  applyAbilityBuffStack,
  removeAbilityBuff
} from "./playerSlice";
import { finishWork, startWork } from "./workSlice";
import { applyDelta, consume } from "./resourcesSlice";
import { selectResourcesMaxById } from "./resourcesSelectors";
import { getActiveAuraModifiers } from "../systems/abilities/auras";
import { playerAttack } from "./combatThunks";

export const useAbility = createAsyncThunk<
  boolean,
  { abilityId: string },
  { state: RootState }
>("abilities/useAbility", async ({ abilityId }, thunkApi) => {
  if (typeof abilityId !== "string" || abilityId.length === 0) return false;

  const ability = getAbilityById(abilityId) as any;
  if (!ability) return false;
  const canonicalAbilityId = String(ability.id);

  const state = thunkApi.getState() as any;
  if (state.work?.isWorking) return false;

  const isCombatActive = state.combat.status === "fighting";
  if (isCombatActive && !ability.isCombat) return false;
  if (!isCombatActive && ability.isCombat) return false;

  // Combat handling
  if (ability.isCombat && ability.kind === "combat_attack" && isCombatActive) {
    thunkApi.dispatch(playerAttack(abilityId));
    return true;
  }

  const readyById = selectAbilityReadyAtById(state);
  const delayEndsById = selectAbilityDelayEndsAtById(state);
  const cooldownEndsById = selectAbilityCooldownEndsAtById(state);
  const castEndsById = selectAbilityCastEndsAtById(state);
  const now = Date.now();
  const readyAt = Number(readyById?.[canonicalAbilityId] ?? 0);
  if (Number.isFinite(readyAt) && now < readyAt) return false;

  const useDelayMs = Math.max(0, Number(ability.useDelayMs ?? 0));
  const cooldownMs = Math.max(0, Number(ability.cooldownMs ?? 0));
  const delayEndsAtMs = now + useDelayMs;
  const cooldownEndsAtMs = now + cooldownMs;
  const castTimeMs = Math.max(0, Number(ability.castTimeMs ?? 0));
  const castEndsAtMs = now + castTimeMs;

  const existingDelayEndsAt = Number(delayEndsById?.[canonicalAbilityId] ?? 0);
  const existingCooldownEndsAt = Number(cooldownEndsById?.[canonicalAbilityId] ?? 0);
  const existingCastEndsAt = Number(castEndsById?.[canonicalAbilityId] ?? 0);
  if (
    (Number.isFinite(existingDelayEndsAt) && now < existingDelayEndsAt) ||
    (Number.isFinite(existingCooldownEndsAt) && now < existingCooldownEndsAt) ||
    (Number.isFinite(existingCastEndsAt) && now < existingCastEndsAt)
  ) {
    return false;
  }

  if (ability.kind === "collecting") {
    const locationId = selectLocationId(state) ?? DEFAULT_LOCATION_ID;
    const location = (LOCATIONS as Record<string, any>)[locationId] ?? null;
    const auraMods = getActiveAuraModifiers({
      abilities: ABILITIES as any[],
      enabledById: (selectAbilityToggledById(state) as any) ?? {}
    });
    const baseDurationMs = Math.max(0, Number(location?.workDurationMs ?? WORK_DURATION_MS));
    const locationDurationMs = Math.max(0, Math.round(baseDurationMs * Number(auraMods.workDurationMultiplier ?? 1)));

    thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
    const ok = await thunkApi.dispatch(startWorkAtLocation({})).unwrap();
    if (!ok) return false;

    const lockMs = Math.max(locationDurationMs, cooldownMs, useDelayMs);
    thunkApi.dispatch(setAbilityReadyAt({ abilityId: canonicalAbilityId, readyAtMs: now + lockMs }));
    thunkApi.dispatch(startWork({ startedAtMs: now, durationMs: locationDurationMs, locationId, abilityId: canonicalAbilityId }));

    try {
      if (locationDurationMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, locationDurationMs));
      }
      await thunkApi.dispatch(finishWorkAtLocation({})).unwrap();
    } finally {
      thunkApi.dispatch(finishWork());
    }
    return true;
  }

  if (ability.kind === "aura" && Boolean(ability.toggle)) {
    const enabledById = (selectAbilityToggledById(state) as any) ?? {};
    const isEnabled = Boolean(enabledById[canonicalAbilityId]);

    // Turning OFF: instant, no cost.
    if (isEnabled) {
      thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
      thunkApi.dispatch(setAbilityToggled({ abilityId: canonicalAbilityId, enabled: false }));
      thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: 0 }));
      return true;
    }

    // Turning ON: pay upfront, then cast, then enable.
    const manaCost = Math.max(0, Number(ability.manaCost ?? 0));
    const currentMana = Number(state.resources.current.max_mana ?? 0);
    if (!Number.isFinite(currentMana) || currentMana < manaCost) return false;

    thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
    if (castTimeMs > 0) thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: castEndsAtMs }));

    thunkApi.dispatch(consume({ id: "max_mana", amount: manaCost }));

    try {
      if (castTimeMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, castTimeMs));
      }
      thunkApi.dispatch(setAbilityToggled({ abilityId: canonicalAbilityId, enabled: true }));
      return true;
    } finally {
      thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: 0 }));
    }
  }

  if (ability.kind === "restore_stamina") {
    const manaCost = Math.max(0, Number(ability.manaCost ?? 0));
    const staminaRestore = Math.max(0, Number(ability.staminaRestore ?? 0));
    if (manaCost <= 0 || staminaRestore <= 0) return false;

    const currentMana = Number(state.resources.current.max_mana ?? 0);
    if (!Number.isFinite(currentMana) || currentMana < manaCost) return false;

    thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
    if (castTimeMs > 0) thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: castEndsAtMs }));

    // Pay upfront.
    thunkApi.dispatch(consume({ id: "max_mana", amount: manaCost }));

    try {
      if (castTimeMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, castTimeMs));
      }

      const maxById = selectResourcesMaxById(thunkApi.getState());
      thunkApi.dispatch(applyDelta({ delta: { max_stamina: staminaRestore }, maxById }));
      return true;
    } finally {
      thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: 0 }));
    }
  }

  if (ability.kind === "buff") {
    const manaCost = Math.max(0, Number(ability.manaCost ?? 0));
    const durationMs = Math.max(0, Math.floor(Number(ability.durationMs ?? 0)));
    const maxStacks = Math.max(1, Math.floor(Number(ability.maxStacks ?? 1)));
    if (manaCost <= 0 || durationMs <= 0) return false;

    const currentMana = Number(state.resources.current.max_mana ?? 0);
    if (!Number.isFinite(currentMana) || currentMana < manaCost) return false;

    thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
    if (castTimeMs > 0) thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: castEndsAtMs }));

    // Pay upfront.
    thunkApi.dispatch(consume({ id: "max_mana", amount: manaCost }));

    try {
      if (castTimeMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, castTimeMs));
      }
      thunkApi.dispatch(applyAbilityBuffStack({ buffId: canonicalAbilityId, maxStacks, durationMs, nowMs: Date.now() }));
      return true;
    } finally {
      thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: 0 }));
    }
  }

  if (ability.kind === "effect_caster") {
    const manaCost = Math.max(0, Number(ability.manaCost ?? 0));
    const effects = Array.isArray(ability.effects) ? ability.effects : [];
    if (manaCost <= 0 || effects.length === 0) return false;

    const currentMana = Number(state.resources.current.max_mana ?? 0);
    if (!Number.isFinite(currentMana) || currentMana < manaCost) return false;

    thunkApi.dispatch(setAbilityTimers({ abilityId: canonicalAbilityId, delayEndsAtMs, cooldownEndsAtMs }));
    if (castTimeMs > 0) thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: castEndsAtMs }));

    // Pay upfront.
    thunkApi.dispatch(consume({ id: "max_mana", amount: manaCost }));

    try {
      if (castTimeMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, castTimeMs));
      }

      const nowMs = Date.now();
      for (const effectId of effects) {
        if (typeof effectId !== "string" || effectId.length === 0) continue;
        const effectAbility = getAbilityById(effectId) as any;
        if (!effectAbility) continue;

        const durationMs = Math.max(0, Math.floor(Number(effectAbility.durationMs ?? 0)));
        const maxStacks = Math.max(1, Math.floor(Number(effectAbility.maxStacks ?? 1)));
        if (durationMs > 0) {
          thunkApi.dispatch(applyAbilityBuffStack({ buffId: effectId, maxStacks, durationMs, nowMs }));
        }
      }
      return true;
    } finally {
      thunkApi.dispatch(setAbilityCastEndsAt({ abilityId: canonicalAbilityId, endsAtMs: 0 }));
    }
  }

  return false;
});

/**
 * Removes an active buff. If the buff is linked to other effects via a common caster ability,
 * all related effects (including debuffs) are removed together.
 */
export const removeBuff = createAsyncThunk<
  void,
  { buffId: string },
  { state: RootState }
>("abilities/removeBuff", async ({ buffId }, thunkApi) => {
  const state = thunkApi.getState();
  const buff = getAbilityById(buffId) as any;
  if (!buff) return;

  // Find if this buff is part of a larger ability (effect_caster)
  const casterAbility = ABILITIES.find((a: any) =>
    a.kind === "effect_caster" && Array.isArray(a.effects) && a.effects.includes(buffId)
  ) as any;

  if (casterAbility) {
    // If it's part of a caster ability, remove ALL effects from that ability
    for (const effectId of casterAbility.effects) {
      thunkApi.dispatch(removeAbilityBuff({ buffId: effectId }));
    }
  } else {
    // Otherwise just remove this specific buff
    thunkApi.dispatch(removeAbilityBuff({ buffId }));
  }
});
