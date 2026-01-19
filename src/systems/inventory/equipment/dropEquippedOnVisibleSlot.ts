import type { InventorySnapshot, InventorySlot } from "../inventoryTypes";
import { cleanupOrphanedBagSlots } from "../cleanupBagSlots";
import { placeItemInVisibleSlots } from "../placeItemInVisibleSlots";
import { getBagIdFromInstance } from "../bagInstance";
import { hasNestedBagWithItems, type BagsByItemId } from "../hasNestedBagWithItems";
import { canEquipInSlot } from "./canEquipInSlot";

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

export function dropEquippedOnVisibleSlot(params: {
  snapshot: InventorySnapshot;
  slotId: string;
  targetIndex: number;
  baseSlotCount: number;
  currenciesById: CurrenciesById;
  bagsByItemId: BagsByItemId;
  getMaxStack: (itemId: string) => number;
  createBagInstance: (bagItemId: string) => { instanceId: string; capacity: number };
}): { ok: boolean; next: InventorySnapshot } {
  const { snapshot, slotId, targetIndex, baseSlotCount, currenciesById, bagsByItemId, getMaxStack, createBagInstance } =
    params;

  if (!slotId) return { ok: false, next: snapshot };
  if (!Number.isInteger(targetIndex) || targetIndex < 0) return { ok: false, next: snapshot };
  if (!Number.isInteger(baseSlotCount) || baseSlotCount <= 0) return { ok: false, next: snapshot };

  const equippedBagId = snapshot.equippedBagId;
  const activeBagSlots = equippedBagId ? snapshot.bagSlotsById[equippedBagId] ?? [] : [];
  const visibleSlots = [...snapshot.baseSlots, ...activeBagSlots];
  if (targetIndex >= visibleSlots.length) return { ok: false, next: snapshot };

  const targetSlot = visibleSlots[targetIndex] ?? null;
  const isBase = targetIndex < baseSlotCount;

  const nextBase = [...snapshot.baseSlots];
  const nextBag = [...activeBagSlots];
  const setAt = (slotIndex: number, value: InventorySlot | null) => {
    if (slotIndex < baseSlotCount) nextBase[slotIndex] = value;
    else if (equippedBagId) nextBag[slotIndex - baseSlotCount] = value;
  };

  // Bag is stored separately as `equippedBagId`, but still behaves like a "slot" in DnD.
  if (slotId === "bag") {
    if (!equippedBagId) return { ok: false, next: snapshot };

    // If user drops the equipped bag onto the currently open bag container area, treat it as
    // an "unequip" attempt and place it into a base slot instead (the container will close).
    const effectiveTargetIndex = (() => {
      if (isBase) return targetIndex;
      const emptyBaseIndex = nextBase.findIndex((slot) => !slot);
      return emptyBaseIndex === -1 ? null : emptyBaseIndex;
    })();
    if (effectiveTargetIndex === null) return { ok: false, next: snapshot };
    const effectiveTargetSlot = visibleSlots[effectiveTargetIndex] ?? null;

    // Prevent moving a bag that contains nested bags-with-items into base inventory (mirrors legacy logic).
    if (hasNestedBagWithItems({ snapshot, containerId: equippedBagId, bagsByItemId })) {
      return { ok: false, next: snapshot };
    }

    const draggedBagItemId = getBagIdFromInstance(equippedBagId) ?? equippedBagId;
    const draggedCapacity = bagsByItemId[draggedBagItemId]?.capacity ?? 0;
    if (!bagsByItemId[draggedBagItemId]) return { ok: false, next: snapshot };

    if (effectiveTargetSlot) {
      const targetItemData = currenciesById[effectiveTargetSlot.id];
      if (!canEquipInSlot(targetItemData, "bag")) return { ok: false, next: snapshot };
      if (effectiveTargetSlot.count > 1) return { ok: false, next: snapshot };

      const nextEquippedBagId =
        effectiveTargetSlot.instanceId ?? createBagInstance(effectiveTargetSlot.id).instanceId;

      setAt(effectiveTargetIndex, { id: draggedBagItemId, count: 1, instanceId: equippedBagId });

      const next = cleanupOrphanedBagSlots({
        ...snapshot,
        baseSlots: nextBase,
        bagSlotsById: equippedBagId ? { ...snapshot.bagSlotsById, [equippedBagId]: nextBag } : snapshot.bagSlotsById,
        equippedBagId: nextEquippedBagId
      });

      return { ok: true, next };
    }

    setAt(effectiveTargetIndex, { id: draggedBagItemId, count: 1, instanceId: equippedBagId });
    const next = cleanupOrphanedBagSlots({
      ...snapshot,
      baseSlots: nextBase,
      bagSlotsById: equippedBagId ? { ...snapshot.bagSlotsById, [equippedBagId]: nextBag } : snapshot.bagSlotsById,
      equippedBagId: null
    });
    return { ok: true, next };
  }

  const equipped = snapshot.equippedItems[slotId] ?? null;
  if (!equipped) return { ok: false, next: snapshot };

  if (targetSlot) {
    const targetItemData = currenciesById[targetSlot.id];
    if (!canEquipInSlot(targetItemData, slotId)) return { ok: false, next: snapshot };
  }

  const draggedItemId = equipped.id;
  const draggedInstanceId = equipped.instanceId;

  // If swapping with a stack, only equip ONE, and place the unequipped item elsewhere.
  if (targetSlot && targetSlot.count > 1) {
    const nextEquippedItems = {
      ...snapshot.equippedItems,
      [slotId]: { id: targetSlot.id, instanceId: targetSlot.instanceId }
    };

    setAt(targetIndex, { ...targetSlot, count: targetSlot.count - 1 });

    const placed = placeItemInVisibleSlots({
      snapshot: {
        ...snapshot,
        baseSlots: nextBase,
        bagSlotsById: snapshot.bagSlotsById,
        equippedBagId
      },
      itemId: draggedItemId,
      amount: 1,
      maxStack: getMaxStack(draggedItemId),
      createBagInstance,
      options: draggedInstanceId ? { instanceId: draggedInstanceId } : undefined
    });

    if (placed.remaining > 0) return { ok: false, next: snapshot };

    const next = cleanupOrphanedBagSlots({
      ...placed.next,
      baseSlots: nextBase,
      bagSlotsById: equippedBagId
        ? { ...placed.next.bagSlotsById, [equippedBagId]: nextBag }
        : placed.next.bagSlotsById,
      equippedItems: nextEquippedItems
    });

    return { ok: true, next };
  }

  const nextEquippedItems = { ...snapshot.equippedItems };
  if (targetSlot) {
    nextEquippedItems[slotId] = { id: targetSlot.id, instanceId: targetSlot.instanceId };
  } else {
    delete nextEquippedItems[slotId];
  }

  setAt(targetIndex, { id: draggedItemId, count: 1, instanceId: draggedInstanceId });

  const next = cleanupOrphanedBagSlots({
    ...snapshot,
    baseSlots: nextBase,
    bagSlotsById: equippedBagId ? { ...snapshot.bagSlotsById, [equippedBagId]: nextBag } : snapshot.bagSlotsById,
    equippedItems: nextEquippedItems
  });

  return { ok: true, next };
}
