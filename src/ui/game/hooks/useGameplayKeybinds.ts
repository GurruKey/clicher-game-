import { useEffect } from "react";
import { BASE_INVENTORY_SLOTS } from "../../../config/inventory";
import { getAbilityById } from "../../../content/abilities/index.js";
import { resetProgress } from "../../../state/gameThunks";
import { useAbility } from "../../../state/abilitiesThunks";
import { useItemFromVisibleIndex } from "../../../state/inventoryThunks";
import { toggleInventory, toggleMap, triggerSkillError, triggerSkillPress } from "../../../state/uiSlice";

export function useGameplayKeybinds(args: {
  ui: {
    isSettingsOpen: boolean;
    isKeybindsOpen: boolean;
    isStatsOpen: boolean;
    isPerksOpen: boolean;
    isBloodlineOpen: boolean;
    isReputationOpen: boolean;
    isFameOpen: boolean;
    isMapOpen: boolean;
    isLocationOpen: boolean;
  };
  isCombatActive: boolean;
  keybinds: Record<string, string>;
  skillSlots: Array<string | null>;
  skillSlots2: Array<string | null>;
  itemIndexById: Map<string, number>;
  dispatch: (action: any) => void;
}): void {
  const { ui, isCombatActive, keybinds, skillSlots, skillSlots2, itemIndexById, dispatch } = args;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase?.() ?? "";
      const isTypingTarget = tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;
      if (isTypingTarget) return;

      if (
        ui.isSettingsOpen ||
        ui.isKeybindsOpen ||
        ui.isStatsOpen ||
        ui.isPerksOpen ||
        ui.isBloodlineOpen ||
        ui.isReputationOpen ||
        ui.isFameOpen ||
        ui.isMapOpen ||
        ui.isLocationOpen
      ) {
        return;
      }

      const code = event.code || event.key;
      if (!code) return;

      const skillActionIds = [
        "useSkill1",
        "useSkill2",
        "useSkill3",
        "useSkill4",
        "useSkill5",
        "useSkill6",
        "useSkill7",
        "useSkill8",
        "useSkill9",
        "useSkill10"
      ] as const;

      for (let slotIndex = 0; slotIndex < skillActionIds.length; slotIndex++) {
        const actionId = skillActionIds[slotIndex];
        const bind = (keybinds as any)?.[actionId];
        if (!bind || code !== bind) continue;
        event.preventDefault();
        const assignedItemId = (skillSlots as any)?.[slotIndex] ?? null;
        if (!assignedItemId) return;

        const invIndex = itemIndexById.get(String(assignedItemId));
        if (typeof invIndex === "number") {
          if (isCombatActive) return; // Block inventory in combat
          dispatch(triggerSkillPress({ barId: 1, index: slotIndex }));
          dispatch(useItemFromVisibleIndex({ slotIndex: invIndex, baseSlotCount: BASE_INVENTORY_SLOTS }));
          return;
        }

        const ability = getAbilityById(String(assignedItemId)) as any;
        if (ability) {
          if (isCombatActive && !ability.isCombat) {
            dispatch(triggerSkillError({ barId: 1, index: slotIndex }));
            return;
          }
          if (!isCombatActive && ability.isCombat) {
            dispatch(triggerSkillError({ barId: 1, index: slotIndex }));
            return;
          }

          dispatch(triggerSkillPress({ barId: 1, index: slotIndex }));
          dispatch(useAbility({ abilityId: String(ability.id ?? assignedItemId) }));
        }
        return;
      }

      const skill2ActionIds = [
        "useSkill2_1",
        "useSkill2_2",
        "useSkill2_3",
        "useSkill2_4",
        "useSkill2_5",
        "useSkill2_6",
        "useSkill2_7",
        "useSkill2_8",
        "useSkill2_9",
        "useSkill2_10"
      ] as const;

      for (let slotIndex = 0; slotIndex < skill2ActionIds.length; slotIndex++) {
        const actionId = skill2ActionIds[slotIndex];
        const bind = (keybinds as any)?.[actionId];
        if (!bind || code !== bind) continue;
        event.preventDefault();
        const assignedItemId = (skillSlots2 as any)?.[slotIndex] ?? null;
        if (!assignedItemId) return;

        const invIndex = itemIndexById.get(String(assignedItemId));
        if (typeof invIndex === "number") {
          if (isCombatActive) return; // Block inventory in combat
          dispatch(triggerSkillPress({ barId: 2, index: slotIndex }));
          dispatch(useItemFromVisibleIndex({ slotIndex: invIndex, baseSlotCount: BASE_INVENTORY_SLOTS }));
          return;
        }

        const ability = getAbilityById(String(assignedItemId)) as any;
        if (ability) {
          if (isCombatActive && !ability.isCombat) {
            dispatch(triggerSkillError({ barId: 2, index: slotIndex }));
            return;
          }
          if (!isCombatActive && ability.isCombat) {
            dispatch(triggerSkillError({ barId: 2, index: slotIndex }));
            return;
          }

          dispatch(triggerSkillPress({ barId: 2, index: slotIndex }));
          dispatch(useAbility({ abilityId: String(ability.id ?? assignedItemId) }));
        }
        return;
      }

      if (code === (keybinds as any).toggleBag) {
        event.preventDefault();
        dispatch(toggleInventory());
        return;
      }

      if (code === (keybinds as any).openMap) {
        event.preventDefault();
        dispatch(toggleMap());
        return;
      }

      if (code === (keybinds as any).resetProgress) {
        event.preventDefault();
        dispatch(resetProgress());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    dispatch,
    isCombatActive,
    itemIndexById,
    keybinds,
    skillSlots,
    skillSlots2,
    ui.isBloodlineOpen,
    ui.isFameOpen,
    ui.isKeybindsOpen,
    ui.isLocationOpen,
    ui.isMapOpen,
    ui.isPerksOpen,
    ui.isReputationOpen,
    ui.isSettingsOpen,
    ui.isStatsOpen
  ]);
}
