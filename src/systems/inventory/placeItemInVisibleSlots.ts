import type { InventorySnapshot, InventorySlot } from "./inventoryTypes";

const fillExistingStacks = (params: {
  slots: Array<InventorySlot | null>;
  itemId: string;
  maxStack: number;
  remaining: number;
}) => {
  const { slots, itemId, maxStack } = params;
  let changed = false;
  let nextRemaining = params.remaining;

  slots.forEach((slot, index) => {
    if (!slot || slot.id !== itemId || nextRemaining <= 0) return;
    if (slot.count >= maxStack) return;

    const add = Math.min(nextRemaining, maxStack - slot.count);
    if (add <= 0) return;

    slots[index] = {
      ...slot,
      count: slot.count + add
    };
    nextRemaining -= add;
    changed = true;
  });

  return { changed, remaining: nextRemaining };
};

const fillEmptySlots = (params: {
  slots: Array<InventorySlot | null>;
  itemId: string;
  maxStack: number;
  remaining: number;
  createSlot: (itemId: string, count: number) => InventorySlot;
}) => {
  const { slots, itemId, maxStack, createSlot } = params;
  let changed = false;
  let nextRemaining = params.remaining;

  slots.forEach((slot, index) => {
    if (slot || nextRemaining <= 0) return;
    const count = Math.min(nextRemaining, maxStack);
    if (count <= 0) return;
    slots[index] = createSlot(itemId, count);
    nextRemaining -= count;
    changed = true;
  });

  return { changed, remaining: nextRemaining };
};

export type BagDefinition = { capacity: number };

export function placeItemInVisibleSlots(params: {
  snapshot: InventorySnapshot;
  itemId: string;
  amount: number;
  maxStack: number;
  createBagInstance: (bagItemId: string) => { instanceId: string; capacity: number };
  options?: {
    instanceId?: string;
    isBag?: boolean;
    bagCapacity?: number;
  };
}): { next: InventorySnapshot; remaining: number; changed: boolean } {
  const { snapshot, itemId, amount, maxStack, createBagInstance, options } = params;
  if (!itemId || amount <= 0) return { next: snapshot, remaining: amount, changed: false };

  const currentBagId = snapshot.equippedBagId;
  const isSelf = Boolean(options?.instanceId && options.instanceId === currentBagId);
  const currentBagSlots =
    !isSelf && currentBagId && snapshot.bagSlotsById[currentBagId]
      ? snapshot.bagSlotsById[currentBagId]
      : [];

  const nextBase = [...snapshot.baseSlots];
  const nextBag = currentBagId ? [...currentBagSlots] : null;
  const nextBagSlotsById: InventorySnapshot["bagSlotsById"] = { ...snapshot.bagSlotsById };

  const createSlot = (nextItemId: string, count: number): InventorySlot => {
    if (options?.instanceId) {
      if (options.isBag && options.bagCapacity && !nextBagSlotsById[options.instanceId]) {
        nextBagSlotsById[options.instanceId] = Array(options.bagCapacity).fill(null);
      }
      return { id: nextItemId, count, instanceId: options.instanceId };
    }

    if (options?.isBag) {
      const created = createBagInstance(nextItemId);
      if (!nextBagSlotsById[created.instanceId]) {
        nextBagSlotsById[created.instanceId] = Array(created.capacity).fill(null);
      }
      return { id: nextItemId, count, instanceId: created.instanceId };
    }

    return { id: nextItemId, count };
  };

  let remaining = amount;
  let baseChanged = false;
  let bagChanged = false;

  if (nextBag) {
    const result = fillExistingStacks({ slots: nextBag, itemId, maxStack, remaining });
    remaining = result.remaining;
    bagChanged = result.changed || bagChanged;
  }

  {
    const result = fillExistingStacks({ slots: nextBase, itemId, maxStack, remaining });
    remaining = result.remaining;
    baseChanged = result.changed || baseChanged;
  }

  if (nextBag && remaining > 0) {
    const result = fillEmptySlots({
      slots: nextBag,
      itemId,
      maxStack,
      remaining,
      createSlot
    });
    remaining = result.remaining;
    bagChanged = result.changed || bagChanged;
  }

  if (remaining > 0) {
    const result = fillEmptySlots({
      slots: nextBase,
      itemId,
      maxStack,
      remaining,
      createSlot
    });
    remaining = result.remaining;
    baseChanged = result.changed || baseChanged;
  }

  const changed = baseChanged || bagChanged || nextBagSlotsById !== snapshot.bagSlotsById;

  const next: InventorySnapshot = {
    ...snapshot,
    baseSlots: baseChanged ? nextBase : snapshot.baseSlots,
    bagSlotsById: bagChanged || changed ? nextBagSlotsById : snapshot.bagSlotsById
  };

  if (bagChanged && currentBagId && nextBag) {
    next.bagSlotsById = {
      ...next.bagSlotsById,
      [currentBagId]: nextBag
    };
  }

  return { next, remaining, changed };
}

