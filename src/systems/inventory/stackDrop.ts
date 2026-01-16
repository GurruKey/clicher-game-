import type { InventorySlot } from "./inventoryTypes";

export const stackSlots = (params: {
  source: InventorySlot | null;
  target: InventorySlot | null;
  maxStack: number;
}) => {
  const { source, target, maxStack } = params;
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

export const applyStackDrop = (params: {
  sourceSlot: InventorySlot | null;
  targetSlot: InventorySlot | null;
  getMaxStack: (itemId: string) => number;
}) => {
  const { sourceSlot, targetSlot, getMaxStack } = params;
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

