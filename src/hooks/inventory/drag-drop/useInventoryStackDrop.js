import { useCallback } from "react";
import { applyStackDrop, buildSlotSetter } from "../utils/inventoryDragUtils.js";

export default function useInventoryStackDrop({
  baseSlotCount,
  baseSlots,
  activeBagSlots,
  visibleBagSlots,
  equippedBagId,
  setBaseSlots,
  setBagSlotsById,
  getMaxStack,
  dragIndex,
  resetDrag
}) {
  return useCallback(
    (index) => {
      if (dragIndex === null || dragIndex === index) {
        resetDrag();
        return;
      }

      const sourceSlot = visibleBagSlots[dragIndex];
      if (!sourceSlot) {
        resetDrag();
        return;
      }

      const nextBase = [...baseSlots];
      const nextBag = [...activeBagSlots];
      const setSlotValue = buildSlotSetter({
        baseSlotCount,
        nextBase,
        nextBag,
        equippedBagId
      });

      const targetValue = visibleBagSlots[index] ?? null;
      const result = applyStackDrop({
        sourceSlot,
        targetSlot: targetValue,
        getMaxStack
      });
      if (!result.changed) {
        resetDrag();
        return;
      }
      setSlotValue(index, result.target);
      setSlotValue(dragIndex, result.source);

      setBaseSlots(nextBase);
      if (equippedBagId) {
        setBagSlotsById((prev) => ({
          ...prev,
          [equippedBagId]: nextBag
        }));
      }

      resetDrag();
    },
    [
      dragIndex,
      baseSlotCount,
      baseSlots,
      activeBagSlots,
      visibleBagSlots,
      equippedBagId,
      getMaxStack,
      resetDrag,
      setBaseSlots,
      setBagSlotsById
    ]
  );
}
