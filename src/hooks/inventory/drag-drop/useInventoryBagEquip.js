import { useCallback } from "react";
import { performBagEquipSwap } from "../utils/inventoryDragUtils.js";
import { getBagIdFromInstance } from "../utils/inventoryUtils.js";
import { hasNestedBagWithItems } from "../utils/useInventoryDragHelpers.js";

export default function useInventoryBagEquip({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  createBagInstance,
  setEquippedBagId,
  setBagSlotsById,
  bagSlotsByIdRef,
  getMaxStack,
  notifyBagNested,
  notifyNoSpaceUnequip,
  dragIndex,
  resetDrag
}) {
  return useCallback(
    () => {
      if (
        hasNestedBagWithItems({
          containerId: equippedBagId,
          bagSlotsByIdRef,
          bags
        })
      ) {
        const bagItemId = getBagIdFromInstance(equippedBagId) ?? null;
        notifyBagNested(bagItemId);
        resetDrag();
        return;
      }

      const result = performBagEquipSwap({
        dragIndex,
        visibleBagSlots,
        bags,
        equippedBagId,
        createBagInstance,
        baseSlotCount,
        baseSlots,
        activeBagSlots,
        getMaxStack
      });
      if (!result.ok) {
        if (result.reason === "no-space-old-bag" && result.previousBagId) {
          notifyNoSpaceUnequip(result.previousBagId);
        }
        resetDrag();
        return;
      }

      setBaseSlots(result.nextBase);
      if (result.previousBagId && !result.sourceIsBase) {
        setBagSlotsById((prev) => ({
          ...prev,
          [result.previousBagId]: result.nextBag
        }));
      }
      setEquippedBagId(result.draggedId);
      resetDrag();
    },
    [
      dragIndex,
      baseSlotCount,
      baseSlots,
      activeBagSlots,
      visibleBagSlots,
      bags,
      equippedBagId,
      bagSlotsByIdRef,
      createBagInstance,
      getMaxStack,
      notifyBagNested,
      notifyNoSpaceUnequip,
      resetDrag,
      setBaseSlots,
      setBagSlotsById,
      setEquippedBagId
    ]
  );
}
