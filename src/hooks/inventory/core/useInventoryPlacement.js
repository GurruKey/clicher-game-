import { useCallback } from "react";

const fillExistingStacks = ({ slots, itemId, maxStack, remaining }) => {
  let changed = false;
  let nextRemaining = remaining;

  slots.forEach((slot, index) => {
    if (!slot || slot.id !== itemId || nextRemaining <= 0) {
      return;
    }
    if (slot.count >= maxStack) {
      return;
    }
    const add = Math.min(nextRemaining, maxStack - slot.count);
    if (add <= 0) {
      return;
    }
    slots[index] = {
      ...slot,
      count: slot.count + add
    };
    nextRemaining -= add;
    changed = true;
  });

  return { changed, remaining: nextRemaining };
};

const fillEmptySlots = ({ slots, itemId, maxStack, remaining, createSlot }) => {
  let changed = false;
  let nextRemaining = remaining;

  slots.forEach((slot, index) => {
    if (slot || nextRemaining <= 0) {
      return;
    }
    const count = Math.min(nextRemaining, maxStack);
    if (count <= 0) {
      return;
    }
    slots[index] = createSlot ? createSlot(itemId, count) : { id: itemId, count };
    nextRemaining -= count;
    changed = true;
  });

  return { changed, remaining: nextRemaining };
};

const buildPlacementPlan = ({
  baseSlots,
  bagSlots,
  itemId,
  maxStack,
  amount,
  createSlot
}) => {
  const nextBase = [...baseSlots];
  const nextBag = bagSlots ? [...bagSlots] : null;
  let remaining = amount;
  let baseChanged = false;
  let bagChanged = false;

  // 1. Fill existing stacks in Bag
  if (nextBag) {
    const result = fillExistingStacks({
      slots: nextBag,
      itemId,
      maxStack,
      remaining
    });
    remaining = result.remaining;
    bagChanged = result.changed || bagChanged;
  }

  // 2. Fill existing stacks in Base
  {
    const result = fillExistingStacks({
      slots: nextBase,
      itemId,
      maxStack,
      remaining
    });
    remaining = result.remaining;
    baseChanged = result.changed || baseChanged;
  }

  // 3. Fill empty slots in Bag
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

  // 4. Fill empty slots in Base
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

  return {
    nextBase,
    nextBag,
    remaining,
    baseChanged,
    bagChanged
  };
};

export default function useInventoryPlacement({
  getMaxStack,
  bags,
  createBagInstance,
  baseSlotsRef,
  bagSlotsByIdRef,
  equippedBagIdRef,
  setBaseSlots,
  setBagSlotsById,
  notifyInventoryFull
}) {
  return useCallback(
    (itemId, amount = 1, options = {}) => {
      if (!itemId || amount <= 0) {
        return;
      }

      const maxStack = getMaxStack(itemId);
      const currentBase = baseSlotsRef.current;
      const currentBagId = equippedBagIdRef.current;
      // If we are placing the currently equipped bag (based on instanceId), we cannot place it inside itself.
      const isSelf = options.instanceId && options.instanceId === currentBagId;
      const currentBagSlots =
        !isSelf && currentBagId && bagSlotsByIdRef.current[currentBagId]
          ? bagSlotsByIdRef.current[currentBagId]
          : [];
      const createSlot = (nextItemId, count) => {
        if (options.instanceId) {
           return { id: nextItemId, count, instanceId: options.instanceId };
        }
        if (bags?.[nextItemId] && createBagInstance) {
          const instanceId = createBagInstance(nextItemId);
          return { id: nextItemId, count, instanceId };
        }
        return { id: nextItemId, count };
      };

      const plan = buildPlacementPlan({
        baseSlots: currentBase,
        bagSlots: currentBagId ? currentBagSlots : null,
        itemId,
        maxStack,
        amount,
        createSlot
      });

      if (plan.remaining > 0 && notifyInventoryFull) {
        notifyInventoryFull();
      }

      if (plan.baseChanged) {
        setBaseSlots(plan.nextBase);
      }
      if (plan.bagChanged && currentBagId && plan.nextBag) {
        setBagSlotsById((prev) => ({
          ...prev,
          [currentBagId]: plan.nextBag
        }));
      }

      return plan.remaining === 0;
    },
    [
      getMaxStack,
      bags,
      createBagInstance,
      baseSlotsRef,
      bagSlotsByIdRef,
      equippedBagIdRef,
      setBaseSlots,
      setBagSlotsById,
      notifyInventoryFull
    ]
  );
}
