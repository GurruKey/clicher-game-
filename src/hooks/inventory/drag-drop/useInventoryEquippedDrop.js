import { useCallback } from "react";
import { validateUnequip } from "../../../logic/items/wear/unequip/unequipLogic.js";
import { canEquipInSlot } from "../../../logic/items/wear/equip/equipLogic.js";

export default function useInventoryEquippedDrop({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  setBagSlotsById,
  bags,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  dragItemId,
  dragItemInstanceId,
  dragSlotId,
  bagSlotsByIdRef,
  setEquippedBagId,
  setEquippedItems,
  equippedBagId,
  notifyInventoryFull,
  resetDrag,
  currencies
}) {
  return useCallback(
    (index) => {
      const isBase = index < baseSlotCount;
      const error = validateUnequip({
        draggedId: dragItemId,
        dragItemInstanceId,
        targetIndex: index,
        baseSlotCount,
        bagSlotsByIdRef,
        bags,
        isBase,
        equippedBagId
      });

      if (error === "bag_nested") {
        notifyBagNested(dragItemId);
        resetDrag();
        return;
      }

      if (error === "bag_inside" && equippedBagId === dragItemInstanceId) {
        notifyBagInside(dragItemId);
        resetDrag();
        return;
      }

      if (error) {
        resetDrag();
        return;
      }

      const nextBase = [...baseSlots];
      const nextBag = [...activeBagSlots];

      const targetSlot = isBase ? nextBase[index] : nextBag[index - baseSlotCount];

      // CRITICAL: Validation before swap
      if (targetSlot) {
        const targetItemData = currencies[targetSlot.id];
        if (!canEquipInSlot(targetItemData, dragSlotId, currencies)) {
          // Cannot swap because target item is not compatible with character slot
          resetDrag();
          return;
        }
      }

      let unequippedItemToPlace = {
        id: dragItemId,
        count: 1,
        instanceId: dragItemInstanceId
      };

      if (dragSlotId === "bag") {
        // Handle bag unequip logic
        setEquippedBagId(targetSlot?.instanceId ?? null);
      } else {
        if (targetSlot && targetSlot.count > 1) {
          // If we swap with a stack, we only equip ONE and keep the rest in inventory
          setEquippedItems((prev) => ({
            ...prev,
            [dragSlotId]: { id: targetSlot.id, instanceId: targetSlot.instanceId }
          }));
          
          // Place the unequipped item back into inventory if possible, 
          // but since the target slot is busy with the rest of the stack, 
          // we need to find another place for the unequipped item.
          const success = placeItemInVisibleSlots(dragItemId, 1, { instanceId: dragItemInstanceId });
          if (!success) {
            if (notifyInventoryFull) notifyInventoryFull();
            resetDrag();
            return;
          }
          
          // The target slot now contains the remaining stack
          const updatedTarget = { ...targetSlot, count: targetSlot.count - 1 };
          if (isBase) nextBase[index] = updatedTarget;
          else nextBag[index - baseSlotCount] = updatedTarget;
          
          // We already placed the unequipped item via placeItemInVisibleSlots
          unequippedItemToPlace = null; 
        } else {
          // Simple swap or unequip to empty slot
          setEquippedItems((prev) => ({
            ...prev,
            [dragSlotId]: targetSlot ? { id: targetSlot.id, instanceId: targetSlot.instanceId } : null
          }));
        }
      }

      if (unequippedItemToPlace) {
        if (isBase) {
          nextBase[index] = unequippedItemToPlace;
        } else {
          nextBag[index - baseSlotCount] = unequippedItemToPlace;
        }
      }

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
      dragItemId,
      dragItemInstanceId,
      dragSlotId,
      baseSlotCount,
      baseSlots,
      activeBagSlots,
      equippedBagId,
      bags,
      bagSlotsByIdRef,
      setBaseSlots,
      setBagSlotsById,
      setEquippedBagId,
      setEquippedItems,
      notifyBagInside,
      notifyBagNested,
      notifyInventoryFull,
      resetDrag,
      currencies
    ]
  );
}
