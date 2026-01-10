import { useCallback } from "react";
import { canEquipInSlot } from "../../../logic/items/wear/equip/equipLogic.js";

export default function useInventoryEquipmentDrag({
  dragSource,
  dragIndex,
  dragItemId,
  resetDrag,
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  equippedBagId,
  setEquippedItems,
  setBagSlotsById,
  equippedItems,
  currencies,
  placeItemInVisibleSlots,
  notifyInventoryFull
}) {
  return useCallback((slotId) => {
    if (dragSource !== "inventory" || dragIndex === null || !dragItemId) {
      resetDrag();
      return;
    }

    // Validation
    const itemData = currencies?.[dragItemId];
    if (!canEquipInSlot(itemData, slotId, currencies)) {
      resetDrag();
      return;
    }

    const nextBase = [...baseSlots];
    const nextBag = [...activeBagSlots];
    const sourceIsBase = dragIndex < baseSlotCount;
    const sourceIndex = sourceIsBase ? dragIndex : dragIndex - baseSlotCount;
    const sourceSlots = sourceIsBase ? nextBase : nextBag;
    const sourceSlot = sourceSlots[sourceIndex];

    if (!sourceSlot) {
      resetDrag();
      return;
    }

    const oldItem = equippedItems?.[slotId];

    if (oldItem) {
      if (sourceSlot.count > 1) {
        // Try to place old item in inventory first
        const success = placeItemInVisibleSlots(oldItem.id, 1, { instanceId: oldItem.instanceId });
        if (!success) {
          if (notifyInventoryFull) notifyInventoryFull();
          resetDrag();
          return;
        }

        // Equip new item and reduce source stack
        setEquippedItems(prev => ({ ...prev, [slotId]: { id: dragItemId, instanceId: sourceSlot.instanceId } }));
        sourceSlots[sourceIndex] = { ...sourceSlot, count: sourceSlot.count - 1 };
      } else {
        // Simple swap
        setEquippedItems(prev => ({ ...prev, [slotId]: { id: dragItemId, instanceId: sourceSlot.instanceId } }));
        sourceSlots[sourceIndex] = { ...oldItem, count: 1 };
      }
    } else {
      // Normal equip
      setEquippedItems(prev => {
        const next = { ...prev };
        next[slotId] = { id: dragItemId, instanceId: sourceSlot.instanceId };
        return next;
      });
      
      if (sourceSlot.count > 1) {
        sourceSlots[sourceIndex] = { ...sourceSlot, count: sourceSlot.count - 1 };
      } else {
        sourceSlots[sourceIndex] = null;
      }
    }

    setBaseSlots(nextBase);
    if (equippedBagId) {
      setBagSlotsById(prev => ({
        ...prev,
        [equippedBagId]: nextBag
      }));
    }

    resetDrag();
  }, [
    dragSource, 
    dragIndex, 
    dragItemId, 
    baseSlotCount, 
    baseSlots, 
    activeBagSlots, 
    equippedBagId, 
    setEquippedItems, 
    setBaseSlots, 
    setBagSlotsById, 
    resetDrag,
    currencies,
    equippedItems,
    placeItemInVisibleSlots,
    notifyInventoryFull
  ]);
}
