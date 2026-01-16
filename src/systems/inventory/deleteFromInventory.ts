import type { InventorySnapshot, InventorySlot } from "./inventoryTypes";
import { cleanupOrphanedBagSlots } from "./cleanupBagSlots";

const clampInt = (value: unknown) => {
  const num = Math.floor(Number(value));
  return Number.isFinite(num) ? Math.max(0, num) : 0;
};

const deleteFromSlots = (slots: Array<InventorySlot | null>, index: number, amount: number) => {
  const slot = slots[index];
  if (!slot) return { slots, changed: false };

  const nextCount = Math.max(0, slot.count - amount);
  const nextSlot = nextCount > 0 ? { ...slot, count: nextCount } : null;
  if (nextSlot === slot) return { slots, changed: false };

  const next = [...slots];
  next[index] = nextSlot;
  return { slots: next, changed: true };
};

export function deleteFromInventory(params: {
  snapshot: InventorySnapshot;
  container: "base" | "bag";
  slotIndex: number;
  amount: number;
}): { next: InventorySnapshot; changed: boolean } {
  const { snapshot, container } = params;
  const slotIndex = clampInt(params.slotIndex);
  const amount = clampInt(params.amount);
  if (amount <= 0) return { next: snapshot, changed: false };

  if (container === "base") {
    if (slotIndex >= snapshot.baseSlots.length) return { next: snapshot, changed: false };
    const result = deleteFromSlots(snapshot.baseSlots, slotIndex, amount);
    if (!result.changed) return { next: snapshot, changed: false };
    return {
      next: cleanupOrphanedBagSlots({ ...snapshot, baseSlots: result.slots }),
      changed: true
    };
  }

  const bagId = snapshot.equippedBagId;
  if (!bagId) return { next: snapshot, changed: false };
  const bagSlots = snapshot.bagSlotsById[bagId] ?? [];
  if (slotIndex >= bagSlots.length) return { next: snapshot, changed: false };
  const result = deleteFromSlots(bagSlots, slotIndex, amount);
  if (!result.changed) return { next: snapshot, changed: false };
  return {
    next: cleanupOrphanedBagSlots({
      ...snapshot,
      bagSlotsById: { ...snapshot.bagSlotsById, [bagId]: result.slots }
    }),
    changed: true
  };
}

export function deleteEquipped(params: {
  snapshot: InventorySnapshot;
  slotId: string;
}): { next: InventorySnapshot; changed: boolean } {
  const { snapshot, slotId } = params;
  if (!slotId) return { next: snapshot, changed: false };

  if (slotId === "bag") {
    if (!snapshot.equippedBagId) return { next: snapshot, changed: false };
    return {
      next: cleanupOrphanedBagSlots({ ...snapshot, equippedBagId: null }),
      changed: true
    };
  }

  if (!snapshot.equippedItems[slotId]) return { next: snapshot, changed: false };
  const nextEquipped = { ...snapshot.equippedItems };
  delete nextEquipped[slotId];
  return {
    next: cleanupOrphanedBagSlots({ ...snapshot, equippedItems: nextEquipped }),
    changed: true
  };
}

