import type { InventorySlot } from "./inventoryTypes";

export const removeOneFromSlot = (slot: InventorySlot | null) => {
  if (!slot) {
    return { updatedSlot: null as InventorySlot | null, remainingCount: 0 };
  }

  const remainingCount = slot.count - 1;
  const updatedSlot = remainingCount > 0 ? { ...slot, count: remainingCount } : null;

  return { updatedSlot, remainingCount };
};

