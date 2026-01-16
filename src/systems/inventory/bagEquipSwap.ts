import type { InventorySlot, InventorySnapshot } from "./inventoryTypes";
import { getBagIdFromInstance } from "./bagInstance";

export type BagsByItemId = Record<string, { capacity: number }>;

import { removeOneFromSlot } from "./slotMath";

const placeBagInBaseSlots = (params: {
  bagId: string | null;
  bagInstanceId: string | null;
  baseSlots: Array<InventorySlot | null>;
  getMaxStack: (itemId: string) => number;
  preferredIndex: number | null;
}) => {
  const { bagId, bagInstanceId, baseSlots, getMaxStack, preferredIndex } = params;
  if (!bagId) return false;

  const stackIndex = baseSlots.findIndex((slot) => slot?.id === bagId);
  if (stackIndex !== -1 && !bagInstanceId) {
    const maxStack = getMaxStack(bagId);
    const slot = baseSlots[stackIndex];
    if (slot && slot.count < maxStack) {
      baseSlots[stackIndex] = { ...slot, count: slot.count + 1 };
      return true;
    }
  }

  const canUsePreferred =
    Number.isInteger(preferredIndex) &&
    (preferredIndex as number) >= 0 &&
    (preferredIndex as number) < baseSlots.length &&
    !baseSlots[preferredIndex as number];

  const emptyIndex = canUsePreferred
    ? (preferredIndex as number)
    : baseSlots.findIndex((slot) => !slot);

  if (emptyIndex === -1) return false;

  baseSlots[emptyIndex] = {
    id: bagId,
    count: 1,
    instanceId: bagInstanceId ?? undefined
  };
  return true;
};

export function performBagEquipSwap(params: {
  snapshot: InventorySnapshot;
  dragIndex: number;
  baseSlotCount: number;
  bagsByItemId: BagsByItemId;
  getMaxStack: (itemId: string) => number;
  createBagInstance: (bagItemId: string) => { instanceId: string; capacity: number };
}):
  | {
      ok: true;
      next: InventorySnapshot;
    }
  | { ok: false; reason: string } {
  const { snapshot, dragIndex, baseSlotCount, bagsByItemId, getMaxStack, createBagInstance } =
    params;

  const visibleBagSlots: Array<InventorySlot | null> = snapshot.equippedBagId
    ? [...snapshot.baseSlots, ...(snapshot.bagSlotsById[snapshot.equippedBagId] ?? [])]
    : [...snapshot.baseSlots];

  const dragSlot = visibleBagSlots[dragIndex] ?? null;
  const draggedId = dragSlot?.id ?? null;
  if (!draggedId || !bagsByItemId[draggedId]) {
    return { ok: false, reason: "no-drag" };
  }

  const draggedInstanceId = dragSlot?.instanceId ?? null;
  const resolvedInstanceId =
    draggedInstanceId ?? createBagInstance(draggedId).instanceId ?? null;
  if (!resolvedInstanceId) {
    return { ok: false, reason: "no-instance" };
  }

  if (snapshot.equippedBagId === resolvedInstanceId) {
    return { ok: false, reason: "same-bag" };
  }

  const sourceIsBase = dragIndex < baseSlotCount;
  const sourceIndex = sourceIsBase ? dragIndex : dragIndex - baseSlotCount;
  const nextBase = [...snapshot.baseSlots];
  const nextBag = snapshot.equippedBagId
    ? [...(snapshot.bagSlotsById[snapshot.equippedBagId] ?? [])]
    : [];
  const sourceSlots = sourceIsBase ? nextBase : nextBag;
  const sourceSlot = sourceSlots[sourceIndex];

  if (!sourceSlot) {
    return { ok: false, reason: "no-source" };
  }

  const { updatedSlot } = removeOneFromSlot(sourceSlot);
  sourceSlots[sourceIndex] = updatedSlot;

  const previousBagId = snapshot.equippedBagId;

  const preferredIndex = sourceIsBase && !updatedSlot ? dragIndex : null;
  const placedOldBag = placeBagInBaseSlots({
    bagId: previousBagId ? getBagIdFromInstance(previousBagId) ?? previousBagId : null,
    bagInstanceId: previousBagId,
    baseSlots: nextBase,
    getMaxStack,
    preferredIndex
  });

  if (previousBagId && !placedOldBag) {
    sourceSlots[sourceIndex] = sourceSlot;
    return { ok: false, reason: "no-space-old-bag" };
  }

  const nextBagSlotsById = { ...snapshot.bagSlotsById };
  if (!nextBagSlotsById[resolvedInstanceId]) {
    const capacity = bagsByItemId[draggedId]?.capacity ?? createBagInstance(draggedId).capacity ?? 0;
    nextBagSlotsById[resolvedInstanceId] = Array(capacity).fill(null);
  }
  if (snapshot.equippedBagId) {
    nextBagSlotsById[snapshot.equippedBagId] = nextBag;
  }

  const next: InventorySnapshot = {
    ...snapshot,
    baseSlots: nextBase,
    bagSlotsById: nextBagSlotsById,
    equippedBagId: resolvedInstanceId
  };

  return { ok: true, next };
}
