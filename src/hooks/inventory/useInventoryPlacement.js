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

const allocateToSlots = ({ slots, itemId, maxStack, remaining, createSlot }) => {
  let nextRemaining = remaining;
  let changed = false;

  const existingResult = fillExistingStacks({
    slots,
    itemId,
    maxStack,
    remaining: nextRemaining
  });
  nextRemaining = existingResult.remaining;
  changed = existingResult.changed || changed;

  if (nextRemaining > 0) {
    const emptyResult = fillEmptySlots({
      slots,
      itemId,
      maxStack,
      remaining: nextRemaining,
      createSlot
    });
    nextRemaining = emptyResult.remaining;
    changed = emptyResult.changed || changed;
  }

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

  if (nextBag) {
    const result = allocateToSlots({
      slots: nextBag,
      itemId,
      maxStack,
      remaining,
      createSlot
    });
    remaining = result.remaining;
    bagChanged = result.changed || bagChanged;
  }

  {
    const result = allocateToSlots({
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
    (itemId, amount = 1) => {
      if (!itemId || amount <= 0) {
        return;
      }

      const maxStack = getMaxStack(itemId);
      const currentBase = baseSlotsRef.current;
      const currentBagId = equippedBagIdRef.current;
      const currentBagSlots =
        currentBagId && bagSlotsByIdRef.current[currentBagId]
          ? bagSlotsByIdRef.current[currentBagId]
          : [];
      const createSlot = (nextItemId, count) => {
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

      if (plan.remaining > 0) {
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
