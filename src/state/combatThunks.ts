import { ABILITIES } from "../content/abilities/index.js";
import { startCombat, damageMob, damagePlayerEffect, resetCombat, setCombatStatus, setMobLoot, removeMobLootItem, MobLootItem } from "./combatSlice";
import { applyDelta, consume } from "./resourcesSlice";
import { selectResourcesMaxById } from "./resourcesSelectors";
import { placeItemInCurrentContainer } from "./inventorySlice";
import { CURRENCIES } from "../content/currencies/index.js";
import { addNotice } from "./lootNoticesSlice";
import { getMobById } from "../content/entities/index.js";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../app/store";
import { getAbilityById } from "../content/abilities/index.js";
import { setAbilityTimers, selectAbilityCooldownEndsAtById } from "./playerSlice";
import { recordLocationDrop, markAsKnown } from "./lootSlice";

export const spawnMob = createAsyncThunk(
  "combat/spawnMob",
  async (mobId: string, { dispatch }) => {
    const mob = getMobById(mobId) as any;
    if (!mob) return;

    dispatch(startCombat({ mobId, health: mob.maxHealth }));
  }
);

export const playerAttack = createAsyncThunk(
  "combat/playerAttack",
  async (abilityId: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    // @ts-ignore
    if (state.combat.status !== "fighting") return;

    const ability = getAbilityById(abilityId) as any;
    if (!ability) return;

    const now = Date.now();
    const cooldownEndsById = selectAbilityCooldownEndsAtById(state);
    const readyAt = Number(cooldownEndsById?.[abilityId] ?? 0);
    if (now < readyAt) return;

    const damage = Math.floor(Math.random() * (ability.damageMax - ability.damageMin + 1)) + ability.damageMin;
    const cooldownMs = Math.max(0, Number(ability.cooldownMs ?? 0));
    
    dispatch(setAbilityTimers({ 
      abilityId, 
      delayEndsAtMs: now, 
      cooldownEndsAtMs: now + cooldownMs 
    }));

    dispatch(damageMob({ amount: damage, now }));

    const updatedState = getState() as any;
    if (updatedState.combat.status === "victory") {
      dispatch(finishCombatVictory());
    }
  }
);

export const mobAttack = createAsyncThunk(
  "combat/mobAttack",
  async (_, { dispatch, getState }) => {
    const state = getState() as any;
    if (state.combat.status !== "fighting" || !state.combat.mobId) return;

    const mob = getMobById(state.combat.mobId) as any;
    if (!mob || !mob.abilities || mob.abilities.length === 0) return;

    const abilityId = mob.abilities[0];
    const ability = getAbilityById(abilityId) as any;
    if (!ability) return;

    const damage = Math.floor(Math.random() * (ability.damageMax - ability.damageMin + 1)) + ability.damageMin;
    
    dispatch(damagePlayerEffect({ now: Date.now() }));
    dispatch(consume({ id: "max_health", amount: damage }));

    const updatedState = getState() as any;
    const currentHealth = updatedState.resources.current.max_health ?? 0;
    
    if (currentHealth <= 0) {
      dispatch(setCombatStatus("defeat"));
      setTimeout(() => {
        dispatch(resetCombat());
        // Set health to 1 to prevent immediate death loop
        const maxById = selectResourcesMaxById(getState() as RootState);
        dispatch(applyDelta({ delta: { max_health: 1 }, maxById }));
      }, 2000);
    }
  }
);

export const finishCombatVictory = createAsyncThunk(
  "combat/finishCombatVictory",
  async (_, { dispatch, getState }) => {
    const state = getState() as any;
    if (!state.combat.mobId) return;

    const mob = getMobById(state.combat.mobId) as any;
    if (mob && mob.drops) {
      const generatedLoot: MobLootItem[] = [];
      for (const drop of mob.drops) {
        if (Math.random() * 100 <= drop.chance) {
          const item = (CURRENCIES as Record<string, any>)[drop.id];
          generatedLoot.push({
            id: `${drop.id}_${Date.now()}_${Math.random()}`,
            itemId: drop.id,
            amount: drop.amount,
            rarity: item?.rarity ?? "common"
          });
        }
      }
      dispatch(setMobLoot(generatedLoot));

      // Record drop stats immediately upon generation (fact of drop)
      const locationId = state.player.locationId;
      for (const item of generatedLoot) {
        dispatch(recordLocationDrop({ 
          locationId, 
          itemId: item.itemId, 
          source: "mobs", 
          mobId: state.combat.mobId 
        }));
      }
    }
  }
);

export const takeMobLootItem = createAsyncThunk(
  "combat/takeMobLootItem",
  async (id: string, { dispatch, getState }) => {
    const state = getState() as any;
    const lootItem = state.combat.loot.find((item: any) => item.id === id);
    if (!lootItem) return;

    const itemMeta = (CURRENCIES as Record<string, any>)[lootItem.itemId];
    
    dispatch(placeItemInCurrentContainer({
      itemId: lootItem.itemId,
      amount: lootItem.amount,
      maxStack: itemMeta?.maxStack ?? 1
    }));

    // Mark as discovered when picked up
    dispatch(markAsKnown(lootItem.itemId));

    dispatch(addNotice({
      name: itemMeta?.name ?? lootItem.itemId,
      icon: itemMeta?.icon,
      rarity: itemMeta?.rarity ?? "common",
      label: "Taken"
    }));

    dispatch(removeMobLootItem(id));
  }
);

export const escapeCombat = createAsyncThunk(
  "combat/escapeCombat",
  async (_, { dispatch }) => {
    dispatch(resetCombat());
  }
);
