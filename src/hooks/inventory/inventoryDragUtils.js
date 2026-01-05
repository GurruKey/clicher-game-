import { getBagIdFromInstance } from "./inventoryUtils.js";

export const stackSlots = ({ source, target, maxStack }) => {
  if (!source || !target) {
    return { source, target };
  }

  const available = maxStack - target.count;
  if (available <= 0) {
    return { source, target };
  }

  if (source.count <= available) {
    return {
      source: null,
      target: {
        ...target,
        count: target.count + source.count
      }
    };
  }

  return {
    source: {
      ...source,
      count: source.count - available
    },
    target: {
      ...target,
      count: maxStack
    }
  };
};

export const applyStackDrop = ({ sourceSlot, targetSlot, getMaxStack }) => {
  if (!sourceSlot) {
    return { source: sourceSlot, target: targetSlot, changed: false };
  }

  if (!targetSlot) {
    return { source: null, target: sourceSlot, changed: true };
  }

  if (targetSlot.id === sourceSlot.id) {
    const maxStack = getMaxStack(sourceSlot.id);
    const sourceInstance = sourceSlot.instanceId ?? null;
    const targetInstance = targetSlot.instanceId ?? null;

    if (maxStack <= 1 && sourceInstance !== targetInstance) {
      return { source: targetSlot, target: sourceSlot, changed: true };
    }

    const result = stackSlots({
      source: sourceSlot,
      target: targetSlot,
      maxStack
    });
    const changed = !(result.source === sourceSlot && result.target === targetSlot);
    return { ...result, changed };
  }

  return { source: targetSlot, target: sourceSlot, changed: true };
};

export const buildSlotSetter = ({ baseSlotCount, nextBase, nextBag, equippedBagId }) =>
  (slotIndex, value) => {
    if (slotIndex < baseSlotCount) {
      nextBase[slotIndex] = value;
    } else if (equippedBagId) {
      nextBag[slotIndex - baseSlotCount] = value;
    }
  };

export const getBagDragContext = ({
  dragIndex,
  baseSlotCount,
  baseSlots,
  activeBagSlots
}) => {
  const sourceIsBase = dragIndex < baseSlotCount;
  const sourceIndex = sourceIsBase ? dragIndex : dragIndex - baseSlotCount;
  const nextBase = [...baseSlots];
  const nextBag = [...activeBagSlots];
  const sourceSlots = sourceIsBase ? nextBase : nextBag;
  const sourceSlot = sourceSlots[sourceIndex];

  return {
    sourceIsBase,
    sourceIndex,
    nextBase,
    nextBag,
    sourceSlots,
    sourceSlot
  };
};

export const getDraggedBagId = ({ dragIndex, visibleBagSlots, bags }) => {
  if (dragIndex === null) {
    return null;
  }

  const dragSlot = visibleBagSlots[dragIndex] ?? null;
  const draggedId = dragSlot?.id ?? null;
  if (!draggedId || !bags[draggedId]) {
    return null;
  }

  return {
    draggedId,
    draggedInstanceId: dragSlot?.instanceId ?? null,
    dragSlot
  };
};

export const removeOneFromSlot = (slot) => {
  if (!slot) {
    return { updatedSlot: null, remainingCount: 0 };
  }

  const remainingCount = slot.count - 1;
  const updatedSlot = remainingCount > 0 ? { ...slot, count: remainingCount } : null;

  return { updatedSlot, remainingCount };
};

export const placeBagInBaseSlots = ({
  bagId,
  bagInstanceId,
  baseSlots,
  getMaxStack,
  preferredIndex
}) => {
  if (!bagId) {
    return false;
  }

  const stackIndex = baseSlots.findIndex((slot) => slot?.id === bagId);
  if (stackIndex !== -1 && !bagInstanceId) {
    const maxStack = getMaxStack(bagId);
    const slot = baseSlots[stackIndex];
    if (slot && slot.count < maxStack) {
      baseSlots[stackIndex] = {
        ...slot,
        count: slot.count + 1
      };
      return true;
    }
  }

  let emptyIndex = -1;
  const canUsePreferred =
    Number.isInteger(preferredIndex) &&
    preferredIndex >= 0 &&
    preferredIndex < baseSlots.length &&
    !baseSlots[preferredIndex];
  if (canUsePreferred) {
    emptyIndex = preferredIndex;
  } else {
    emptyIndex = baseSlots.findIndex((slot) => !slot);
  }

  if (emptyIndex === -1) {
    return false;
  }

  baseSlots[emptyIndex] = {
    id: bagId,
    count: 1,
    instanceId: bagInstanceId ?? null
  };
  return true;
};

export const performBagEquipSwap = ({
  dragIndex,
  visibleBagSlots,
  bags,
  equippedBagId,
  createBagInstance,
  baseSlotCount,
  baseSlots,
  activeBagSlots,
  getMaxStack
}) => {
  const dragInfo = getDraggedBagId({
    dragIndex,
    visibleBagSlots,
    bags
  });
  if (!dragInfo) {
    return { ok: false, reason: "no-drag" };
  }

  const { draggedId, draggedInstanceId } = dragInfo;
  const resolvedInstanceId =
    draggedInstanceId ?? (createBagInstance ? createBagInstance(draggedId) : null);
  if (!resolvedInstanceId) {
    return { ok: false, reason: "no-instance" };
  }

  if (equippedBagId === resolvedInstanceId) {
    return { ok: false, reason: "same-bag" };
  }

  if (dragIndex === null) {
    return { ok: false, reason: "no-index" };
  }

  const previousBagId = equippedBagId;
  const {
    sourceIsBase,
    sourceIndex,
    nextBase,
    nextBag,
    sourceSlots,
    sourceSlot
  } = getBagDragContext({
    dragIndex,
    baseSlotCount,
    baseSlots,
    activeBagSlots
  });

  if (!sourceSlot) {
    return { ok: false, reason: "no-source" };
  }

  const { updatedSlot } = removeOneFromSlot(sourceSlot);
  sourceSlots[sourceIndex] = updatedSlot;

  const preferredIndex = sourceIsBase && !updatedSlot ? dragIndex : null;
  const placedOldBag = placeBagInBaseSlots({
    bagId: previousBagId ? getBagIdFromInstance(previousBagId) ?? previousBagId : null,
    bagInstanceId: previousBagId,
    baseSlots: nextBase,
    getMaxStack,
    preferredIndex
  });

  if (previousBagId && !placedOldBag) {
    return { ok: false, reason: "no-space-old-bag", previousBagId };
  }

  return {
    ok: true,
    draggedId: resolvedInstanceId,
    previousBagId,
    sourceIsBase,
    nextBase,
    nextBag
  };
};
