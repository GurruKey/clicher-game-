import type { InventorySnapshot } from "./inventoryTypes";

export type BagsByItemId = Record<string, { capacity?: number }>;

const hasAnyItems = (slots: Array<{ count: number } | null> | undefined) =>
  Array.isArray(slots) && slots.some((slot) => slot && slot.count > 0);

export function hasNestedBagWithItems(params: {
  containerId: string | null | undefined;
  snapshot: Pick<InventorySnapshot, "bagSlotsById">;
  bagsByItemId: BagsByItemId;
}): boolean {
  const { containerId, snapshot, bagsByItemId } = params;
  if (!containerId) return false;

  const containerSlots = snapshot.bagSlotsById[containerId];
  if (!containerSlots) return false;

  return containerSlots.some((slot) => {
    if (!slot) return false;
    if (!bagsByItemId[slot.id]) return false;

    const nestedSlots = slot.instanceId ? snapshot.bagSlotsById[slot.instanceId] : undefined;
    if (hasAnyItems(nestedSlots)) return true;

    if (slot.instanceId) {
      return hasNestedBagWithItems({ containerId: slot.instanceId, snapshot, bagsByItemId });
    }

    return false;
  });
}

