import { BASE_INVENTORY_SLOTS } from "../../config/inventory";
import { STARTER_CONFIG } from "../../content/starter_packs.js";
import type { InventorySnapshot, InventorySlot } from "./inventoryTypes";

export function createStarterInventorySnapshot(): InventorySnapshot {
  const baseSlots: Array<InventorySlot | null> = Array(BASE_INVENTORY_SLOTS).fill(null);

  const items = (STARTER_CONFIG as unknown as { initialItems?: unknown }).initialItems;
  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      if (index >= baseSlots.length) return;
      if (!item || typeof item !== "object") return;
      const id = (item as { id?: unknown }).id;
      const count = Number((item as { count?: unknown }).count);
      if (typeof id !== "string" || !id) return;
      if (!Number.isFinite(count) || count <= 0) return;
      baseSlots[index] = { id, count };
    });
  }

  return {
    baseSlots,
    bagSlotsById: {},
    equippedBagId: null,
    equippedItems: {},
    seenItemIds: []
  };
}
