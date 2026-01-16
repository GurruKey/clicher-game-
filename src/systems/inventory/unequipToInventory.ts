import type { InventorySnapshot } from "./inventoryTypes";
import { cleanupOrphanedBagSlots } from "./cleanupBagSlots";
import { getBagIdFromInstance } from "./bagInstance";
import { placeItemInVisibleSlots } from "./placeItemInVisibleSlots";

export type BagsByItemId = Record<string, { capacity: number }>;

export function unequipToInventory(params: {
  snapshot: InventorySnapshot;
  slotId: string;
  getMaxStack: (itemId: string) => number;
  bagsByItemId: BagsByItemId;
  createBagInstance: (bagItemId: string) => { instanceId: string; capacity: number };
}): { next: InventorySnapshot; ok: boolean } {
  const { snapshot, slotId, getMaxStack, bagsByItemId, createBagInstance } = params;
  if (!slotId) return { next: snapshot, ok: false };

  if (slotId === "bag") {
    const equippedBagId = snapshot.equippedBagId;
    if (!equippedBagId) return { next: snapshot, ok: false };

    const bagItemId = getBagIdFromInstance(equippedBagId) ?? equippedBagId;
    const maxStack = getMaxStack(bagItemId);
    const capacity = bagsByItemId[bagItemId]?.capacity ?? 0;

    const placed = placeItemInVisibleSlots({
      snapshot,
      itemId: bagItemId,
      amount: 1,
      maxStack,
      createBagInstance,
      options: { instanceId: equippedBagId, isBag: true, bagCapacity: capacity }
    });

    if (placed.remaining > 0) return { next: snapshot, ok: false };

    const next = cleanupOrphanedBagSlots({ ...placed.next, equippedBagId: null });
    return { next, ok: true };
  }

  const equipped = snapshot.equippedItems[slotId];
  if (!equipped) return { next: snapshot, ok: false };

  const isBag = Boolean(bagsByItemId[equipped.id]);
  const capacity = isBag ? bagsByItemId[equipped.id]?.capacity ?? 0 : 0;

  const placed = placeItemInVisibleSlots({
    snapshot,
    itemId: equipped.id,
    amount: 1,
    maxStack: getMaxStack(equipped.id),
    createBagInstance,
    options: equipped.instanceId ? { instanceId: equipped.instanceId, isBag, bagCapacity: capacity } : { isBag, bagCapacity: capacity }
  });

  if (placed.remaining > 0) return { next: snapshot, ok: false };

  const nextEquippedItems = { ...snapshot.equippedItems };
  delete nextEquippedItems[slotId];
  const next = cleanupOrphanedBagSlots({ ...placed.next, equippedItems: nextEquippedItems });
  return { next, ok: true };
}

