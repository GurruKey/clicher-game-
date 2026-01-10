import { useCallback } from "react";

export const hasAnyItems = (slots) =>
  Array.isArray(slots) && slots.some((slot) => slot && slot.count > 0);

export const hasNestedBagWithItems = ({ containerId, bagSlotsByIdRef, bags }) => {
  if (!containerId || !bagSlotsByIdRef?.current || !bags) {
    return false;
  }
    const containerSlots = bagSlotsByIdRef.current[containerId];
    if (!containerSlots) {
        return false;
    }

    return containerSlots.some((slot) => {
        if (!slot) return false;
        
        // If the item itself is a bag
        if (bags[slot.id]) {
           // Check if it has items inside
           const nestedSlots = bagSlotsByIdRef.current[slot.instanceId];
           if (hasAnyItems(nestedSlots)) return true;
           
           // Recursively check deeper bags
           if (slot.instanceId && hasNestedBagWithItems({ containerId: slot.instanceId, bagSlotsByIdRef, bags })) {
               return true;
           }
        }
        return false;
    });
};

export function useInventoryBagInsideGuard({
  dragItemId,
  dragItemInstanceId,
  bags,
  baseSlotCount,
  equippedBagId,
  notifyBagInside,
  resetDrag
}) {
  return useCallback(
    (index) => {
      if (!dragItemId || !bags[dragItemId] || index < baseSlotCount) {
        return false;
      }

      if (dragItemInstanceId && equippedBagId && dragItemInstanceId === equippedBagId) {
        notifyBagInside(dragItemId);
        resetDrag();
        return true;
      }

      return false;
    },
    [
      dragItemId,
      dragItemInstanceId,
      bags,
      baseSlotCount,
      equippedBagId,
      notifyBagInside,
      resetDrag
    ]
  );
}
