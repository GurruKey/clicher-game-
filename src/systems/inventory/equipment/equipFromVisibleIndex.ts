import type { InventorySnapshot, InventorySlot } from "../inventoryTypes";
import { cleanupOrphanedBagSlots } from "../cleanupBagSlots";
import { removeOneFromSlot } from "../slotMath";
import { placeItemInVisibleSlots } from "../placeItemInVisibleSlots";
import { canEquipInSlot } from "./canEquipInSlot";
import { resolveTargetSlot } from "./resolveTargetSlot";

export type CurrenciesById = Record<
  string,
  {
    id: string;
    slot?: string;
    type?: unknown;
    types?: unknown;
    maxStack?: unknown;
  }
>;

export type BagsByItemId = Record<string, { capacity: number }>;

export function equipFromVisibleIndex(params: {
  snapshot: InventorySnapshot;
  dragIndex: number;
  baseSlotCount: number;
  slotIdOverride?: string;
  currenciesById: CurrenciesById;
  bagsByItemId: BagsByItemId;
  getMaxStack: (itemId: string) => number;
  createBagInstance: (bagItemId: string) => { instanceId: string; capacity: number };
}): { ok: boolean; next: InventorySnapshot } {
  const { snapshot, dragIndex, baseSlotCount, slotIdOverride, currenciesById, bagsByItemId, getMaxStack, createBagInstance } =
    params;

  const equippedBagId = snapshot.equippedBagId;
  const activeBagSlots = equippedBagId ? snapshot.bagSlotsById[equippedBagId] ?? [] : [];
  const visibleSlots = [...snapshot.baseSlots, ...activeBagSlots];

  const sourceSlot = visibleSlots[dragIndex] ?? null;
  if (!sourceSlot) return { ok: false, next: snapshot };

  const itemData = currenciesById[sourceSlot.id];
  if (!itemData) return { ok: false, next: snapshot };

  const targetSlotId = slotIdOverride ?? resolveTargetSlot(itemData, snapshot.equippedItems);
  if (!targetSlotId) return { ok: false, next: snapshot };

  if (targetSlotId === "bag") {
    // Bag equip swap is handled elsewhere (equipBagFromVisibleIndex)
    return { ok: false, next: snapshot };
  }

  if (slotIdOverride && !canEquipInSlot(itemData, targetSlotId)) {
    return { ok: false, next: snapshot };
  }

  const sourceIsBase = dragIndex < baseSlotCount;
  const sourceIndex = sourceIsBase ? dragIndex : dragIndex - baseSlotCount;

  const nextBase = [...snapshot.baseSlots];
  const nextBag = [...activeBagSlots];
  const sourceSlots = sourceIsBase ? nextBase : nextBag;
  const currentSourceSlot = sourceSlots[sourceIndex] ?? null;
  if (!currentSourceSlot) return { ok: false, next: snapshot };

  const oldItem = snapshot.equippedItems[targetSlotId] ?? null;

  // If replacing equipped item and source has a stack, try to place old item into inventory first.
  if (oldItem && currentSourceSlot.count > 1) {
    const oldIsBag = Boolean(bagsByItemId[oldItem.id]);
    const oldCapacity = oldIsBag ? bagsByItemId[oldItem.id]?.capacity ?? 0 : 0;

    const placedOld = placeItemInVisibleSlots({
      snapshot: { ...snapshot, baseSlots: nextBase, bagSlotsById: snapshot.bagSlotsById, equippedBagId },
      itemId: oldItem.id,
      amount: 1,
      maxStack: getMaxStack(oldItem.id),
      createBagInstance,
      options: oldItem.instanceId
        ? { instanceId: oldItem.instanceId, isBag: oldIsBag, bagCapacity: oldCapacity }
        : { isBag: oldIsBag, bagCapacity: oldCapacity }
    });
    if (placedOld.remaining > 0) {
      return { ok: false, next: snapshot };
    }

    const { updatedSlot } = removeOneFromSlot(currentSourceSlot);
    sourceSlots[sourceIndex] = updatedSlot;

    const nextEquippedItems = {
      ...snapshot.equippedItems,
      [targetSlotId]: { id: sourceSlot.id, instanceId: sourceSlot.instanceId }
    };

    const next: InventorySnapshot = cleanupOrphanedBagSlots({
      ...placedOld.next,
      baseSlots: nextBase,
      bagSlotsById: equippedBagId
        ? { ...placedOld.next.bagSlotsById, [equippedBagId]: nextBag }
        : placedOld.next.bagSlotsById,
      equippedItems: nextEquippedItems
    });

    return { ok: true, next };
  }

  // Simple swap/replace
  const nextEquippedItems = {
    ...snapshot.equippedItems,
    [targetSlotId]: { id: sourceSlot.id, instanceId: sourceSlot.instanceId }
  };

  if (oldItem) {
    sourceSlots[sourceIndex] = { id: oldItem.id, count: 1, instanceId: oldItem.instanceId };
  } else {
    const { updatedSlot } = removeOneFromSlot(currentSourceSlot);
    sourceSlots[sourceIndex] = updatedSlot;
  }

  const next: InventorySnapshot = cleanupOrphanedBagSlots({
    ...snapshot,
    baseSlots: nextBase,
    bagSlotsById: equippedBagId ? { ...snapshot.bagSlotsById, [equippedBagId]: nextBag } : snapshot.bagSlotsById,
    equippedItems: nextEquippedItems
  });

  return { ok: true, next };
}
