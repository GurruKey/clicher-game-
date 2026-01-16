import type { InventorySnapshot } from "./inventoryTypes";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export function collectReferencedBagInstanceIds(snapshot: InventorySnapshot): Set<string> {
  const ids = new Set<string>();

  if (isNonEmptyString(snapshot.equippedBagId)) {
    ids.add(snapshot.equippedBagId);
  }

  for (const slot of snapshot.baseSlots) {
    if (slot?.instanceId && isNonEmptyString(slot.instanceId)) {
      ids.add(slot.instanceId);
    }
  }

  for (const slots of Object.values(snapshot.bagSlotsById)) {
    for (const slot of slots) {
      if (slot?.instanceId && isNonEmptyString(slot.instanceId)) {
        ids.add(slot.instanceId);
      }
    }
  }

  return ids;
}

export function cleanupOrphanedBagSlots(snapshot: InventorySnapshot): InventorySnapshot {
  const referenced = collectReferencedBagInstanceIds(snapshot);
  const nextBagSlotsById: InventorySnapshot["bagSlotsById"] = {};
  for (const [instanceId, slots] of Object.entries(snapshot.bagSlotsById)) {
    if (referenced.has(instanceId)) {
      nextBagSlotsById[instanceId] = slots;
    }
  }
  if (Object.keys(nextBagSlotsById).length === Object.keys(snapshot.bagSlotsById).length) {
    return snapshot;
  }
  return { ...snapshot, bagSlotsById: nextBagSlotsById };
}

